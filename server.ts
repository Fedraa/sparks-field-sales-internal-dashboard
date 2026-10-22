import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// ---------------------------------------------------------------------------
// Konfigurasi (semua lewat environment variables / .env)
// ---------------------------------------------------------------------------

// WAJIB diisi di .env. Tidak ada nilai default agar URL deployment tidak ikut ter-commit.
const APPS_SCRIPT_URL = (process.env.APPS_SCRIPT_URL || '').trim();

// Opsional: shared secret yang dikirim ke Apps Script (field "token" di body).
// Validasi di doPost: if (JSON.parse(e.postData.contents).token !== SECRET) return error.
const APPS_SCRIPT_TOKEN = (process.env.APPS_SCRIPT_TOKEN || '').trim();

// Opsional: token untuk mengamankan endpoint data dashboard ini.
// Kirim lewat header "Authorization: Bearer <token>" atau "x-dashboard-token".
// Jika kosong, endpoint terbuka (hanya cocok untuk development).
const DASHBOARD_TOKEN = (process.env.DASHBOARD_TOKEN || '').trim();

const REQUEST_TIMEOUT_MS = 35_000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1_200;
const CACHE_TTL_MS = 45_000; // data dianggap segar selama 45 detik
const STALE_MAX_AGE_MS = 10 * 60_000; // data lama masih boleh dipakai saat upstream gagal (10 menit)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30; // request per IP per menit

// ---------------------------------------------------------------------------
// Status flow
// ---------------------------------------------------------------------------

// Standard 6-Status Flow for Sparks Field Sales
const STATUS_ORDER = {
  Leads: 1,
  'Potential Booking': 2,
  'FU Booking': 3,
  Booking: 4,
  Rescheduled: 5,
  Cancelled: 6,
} as const;

type BookingStatus = keyof typeof STATUS_ORDER;

const KNOWN_STATUSES = Object.keys(STATUS_ORDER) as BookingStatus[];
const OTHER_STATUS_KEY = 'Other';

function normalizeBookingStatus(statusStr?: string | null): BookingStatus | null {
  if (!statusStr || typeof statusStr !== 'string') return null;
  // Samakan huruf kecil, ganti _ - dan spasi berulang menjadi satu spasi
  const s = statusStr.trim().toLowerCase().replace(/[\s_-]+/g, ' ');

  if (s === 'leads' || s === 'lead') return 'Leads';
  if (s === 'potential booking' || s === 'potential') return 'Potential Booking';
  if (
    s === 'fu booking' ||
    s === 'fu' ||
    s === 'follow up booking' ||
    s === 'followup booking'
  )
    return 'FU Booking';
  if (s === 'booking' || s === 'bookings') return 'Booking';
  if (s === 'rescheduled' || s === 'reschedule' || s === 're scheduled') return 'Rescheduled';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel') return 'Cancelled';
  return null;
}

function emptyStatusCounts(): Record<string, number> {
  const counts: Record<string, number> = Object.create(null);
  for (const st of KNOWN_STATUSES) counts[st] = 0;
  counts[OTHER_STATUS_KEY] = 0;
  return { ...counts };
}

// ---------------------------------------------------------------------------
// Tipe data (allowlist ketat: hanya field ini yang boleh keluar ke browser)
// ---------------------------------------------------------------------------

interface SanitizedBuEntry {
  bu: string;
  center: string;
  status: string;
  ageGroup: string;
  classDate: string;
  classTime: string;
  className: string;
  room: string;
}

interface SanitizedVisitRecord {
  recordId: string;
  timestamp: string;
  ec: string;
  locationName: string;
  namaLokasiStandard: string;
  center: string;
  centerNearest: string;
  matchStatus: string;
  matchMethod: string;
  matchConfidence: number;
  buEntries: SanitizedBuEntry[];
  leadsCount: number;
  bookingCount: number;
  totalBUEntries: number;
  statusBreakdown: Record<string, number>;
}

interface FieldSalesResponse {
  success: true;
  generatedAt: string;
  count: number;
  summary: {
    totalVisits: number;
    totalBUEntries: number;
    totalLeads: number;
    totalBooking: number;
    statusBreakdown: Record<string, number>;
  };
  data: SanitizedVisitRecord[];
  stale?: boolean;
  warning?: string;
}

type ErrorType =
  | 'CONFIG_ERROR'
  | 'AUTH_REQUIRED'
  | 'NOT_FOUND'
  | 'INVALID_PAYLOAD'
  | 'INVALID_JSON'
  | 'HTTP_ERROR'
  | 'APPS_SCRIPT_ERROR'
  | 'TIMEOUT'
  | 'NETWORK_ERROR';

class UpstreamError extends Error {
  errorType: ErrorType;
  httpStatus: number;
  retryable: boolean;

  constructor(errorType: ErrorType, message: string, httpStatus = 502, retryable = true) {
    super(message);
    this.name = 'UpstreamError';
    this.errorType = errorType;
    this.httpStatus = httpStatus;
    this.retryable = retryable;
  }
}

// ---------------------------------------------------------------------------
// Helper kecil
// ---------------------------------------------------------------------------

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const firstString = (...values: unknown[]): string => {
  for (const v of values) {
    const s = str(v);
    if (s) return s;
  }
  return '';
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ---------------------------------------------------------------------------
// Middleware: rate limit sederhana (in-memory) dan autentikasi token
// ---------------------------------------------------------------------------

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;

  if (bucket.count > RATE_LIMIT_MAX) {
    res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.status(429).json({
      success: false,
      errorType: 'RATE_LIMITED',
      error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
    });
    return;
  }
  next();
}

function requireDashboardToken(req: Request, res: Response, next: NextFunction) {
  if (!DASHBOARD_TOKEN) {
    next(); // autentikasi tidak diaktifkan
    return;
  }

  const authHeader = req.header('authorization') || '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  const provided = bearer || (req.header('x-dashboard-token') || '').trim();

  if (!provided || !safeEqual(provided, DASHBOARD_TOKEN)) {
    res.status(401).json({
      success: false,
      errorType: 'UNAUTHORIZED',
      error: 'Akses ditolak. Token dashboard tidak valid.',
    });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// Komunikasi dengan Google Apps Script
// ---------------------------------------------------------------------------

const REDIRECT_CODES = [301, 302, 303, 307, 308];

function extractHtmlTitle(html: string): string {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim().slice(0, 120) : '';
}

/**
 * Satu kali percobaan ke Apps Script.
 * - POST ke /exec dengan redirect manual (Apps Script membalas 302 ke googleusercontent).
 * - Mengikuti redirect dengan GET, maksimal 5 lompatan.
 * - Mengklasifikasikan semua jenis kegagalan menjadi UpstreamError.
 * Mengembalikan teks respons yang sudah dipastikan bukan HTML dan status OK.
 */
async function fetchAppsScriptOnce(): Promise<string> {
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  let response: globalThis.Response;
  try {
    response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(APPS_SCRIPT_TOKEN ? { token: APPS_SCRIPT_TOKEN } : {}),
      signal,
    });

    let hops = 0;
    while (REDIRECT_CODES.includes(response.status) && hops < 5) {
      const location = response.headers.get('location');
      if (!location) break;
      const nextUrl = new URL(location, response.url || APPS_SCRIPT_URL).toString();
      response = await fetch(nextUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: { Accept: 'application/json' },
        signal,
      });
      hops += 1;
    }
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new UpstreamError(
        'TIMEOUT',
        'Batas waktu koneksi ke Google Apps Script habis (timeout). Endpoint memerlukan waktu lebih lama dari biasanya.',
        504,
        true,
      );
    }
    console.error('[Apps Script] Network error:', err?.message || err);
    throw new UpstreamError(
      'NETWORK_ERROR',
      'Gagal menghubungi server Google Apps Script. Periksa koneksi internet server.',
      502,
      true,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  const trimmed = text.trim();

  // Hanya anggap HTML jika content-type HTML atau isi diawali tag (bukan sekadar mengandung <body> di data)
  const isHtml =
    contentType.toLowerCase().includes('text/html') ||
    /^<!doctype/i.test(trimmed) ||
    /^<html/i.test(trimmed);

  const title = isHtml ? extractHtmlTitle(trimmed) : '';

  // Diagnostik tanpa membocorkan URL redirect (berisi user_content_key)
  let finalHost = '';
  try {
    finalHost = new URL(response.url || APPS_SCRIPT_URL).host;
  } catch {
    /* abaikan */
  }
  console.log('[Apps Script diagnostic]', {
    status: response.status,
    contentType,
    finalHost,
    isHtml,
    title: title || undefined,
  });

  if (isHtml) {
    if (
      trimmed.includes('ServiceLogin') ||
      trimmed.includes('accounts.google.com') ||
      trimmed.includes('Google Accounts') ||
      /sign in/i.test(title)
    ) {
      throw new UpstreamError(
        'AUTH_REQUIRED',
        'Deployment Google Apps Script memerlukan otentikasi Google (login). Pastikan deployment Web App disetel dengan akses "Who has access: Anyone".',
        502,
        false,
      );
    }

    if (/script function not found/i.test(trimmed)) {
      throw new UpstreamError(
        'INVALID_PAYLOAD',
        'Fungsi doPost tidak ditemukan di Apps Script. Tambahkan doPost(e) lalu deploy ulang dengan versi baru.',
        502,
        false,
      );
    }

    if (
      trimmed.includes('Page not found') ||
      trimmed.includes('unable to open the file') ||
      trimmed.includes('Sorry, unable to open')
    ) {
      throw new UpstreamError(
        'NOT_FOUND',
        'Google Apps Script mengembalikan halaman file tidak ditemukan. Periksa ID deployment Web App, atau cek panel Executions di Apps Script apakah eksekusi gagal.',
        502,
        true,
      );
    }

    throw new UpstreamError(
      'INVALID_PAYLOAD',
      `Google Apps Script mengembalikan halaman HTML alih-alih data JSON${title ? ` (judul: "${title}")` : ''}. Pastikan Web App mengembalikan ContentService JSON yang valid dan tidak melempar error.`,
      502,
      true,
    );
  }

  if (!response.ok) {
    throw new UpstreamError(
      'HTTP_ERROR',
      `Apps Script mengembalikan status HTTP ${response.status}: ${response.statusText}`,
      502,
      response.status >= 500 || response.status === 429,
    );
  }

  return text;
}

/** Ambil dari Apps Script dengan retry (termasuk untuk timeout dan error jaringan). */
async function fetchAppsScriptWithRetry(): Promise<any> {
  let lastError: UpstreamError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text = await fetchAppsScriptOnce();

      let payload: any;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new UpstreamError(
          'INVALID_JSON',
          'Format data dari Google Apps Script tidak valid (gagal parsing JSON).',
          502,
          false,
        );
      }

      if (!payload || typeof payload !== 'object' || payload.success === false) {
        const detail = str(payload?.error).slice(0, 300);
        throw new UpstreamError(
          'APPS_SCRIPT_ERROR',
          detail || 'Apps Script mengembalikan status gagal saat mengambil data dari Google Sheets.',
          502,
          false,
        );
      }

      return payload;
    } catch (err) {
      const upstream =
        err instanceof UpstreamError
          ? err
          : new UpstreamError('NETWORK_ERROR', 'Terjadi kesalahan tak terduga saat mengambil data.', 502, true);
      lastError = upstream;

      console.warn(`[Apps Script] Percobaan ${attempt}/${MAX_ATTEMPTS} gagal: ${upstream.errorType}`);
      if (!upstream.retryable || attempt === MAX_ATTEMPTS) break;
      await sleep(RETRY_DELAY_MS);
    }
  }

  // Yang dilaporkan adalah error percobaan TERAKHIR
  throw lastError as UpstreamError;
}

// ---------------------------------------------------------------------------
// Sanitasi: hanya field allowlist yang lolos (tanpa Parent, Phone, Child, DOB, Age, Notes)
// ---------------------------------------------------------------------------

function sanitizeRecords(rawData: any[]): SanitizedVisitRecord[] {
  // Penghitung kemunculan hash yang sama agar ID tetap unik tapi TIDAK bergantung pada urutan baris
  const seen = new Map<string, number>();

  return rawData.map((item: any) => {
    const buEntries: SanitizedBuEntry[] = Array.isArray(item?.buEntries)
      ? item.buEntries.map((b: any) => {
          const rawStatus = str(b?.status);
          return {
            bu: str(b?.bu),
            center: str(b?.center),
            status: normalizeBookingStatus(rawStatus) || rawStatus,
            ageGroup: str(b?.ageGroup),
            classDate: str(b?.classDate),
            classTime: str(b?.classTime),
            className: str(b?.className),
            room: str(b?.room),
          };
        })
      : [];

    // Hitung status; status tak dikenal masuk "Other" agar breakdown tidak tercemar
    const statusCounts = emptyStatusCounts();
    for (const entry of buEntries) {
      const known = normalizeBookingStatus(entry.status);
      if (known) statusCounts[known] += 1;
      else if (entry.status) statusCounts[OTHER_STATUS_KEY] += 1;
    }

    const timestamp = str(item?.timestamp);
    const ec = str(item?.ec);
    const locationName = firstString(item?.locationName, item?.rawLocation, item?.Nama_Lokasi_Raw, item?.Location);
    const namaLokasiStandard = firstString(item?.namaLokasiStandard, item?.Nama_Lokasi_Standard);
    const center = str(item?.center);
    const centerNearest = firstString(item?.centerNearest, item?.Center_Terdekat);
    const matchStatus = firstString(item?.matchStatus, item?.Match_Status) || 'Unknown';
    const matchMethod = firstString(item?.matchMethod, item?.Match_Method) || 'Unknown';

    const rawConfidence =
      typeof item?.matchConfidence === 'number'
        ? item.matchConfidence
        : typeof item?.Match_Confidence === 'number'
          ? item.Match_Confidence
          : 0; // tidak ada data = 0, bukan 100%

    // ID pseudonim: pakai ID baris dari Apps Script jika ada (paling stabil), jika tidak pakai hash atribut non-PII
    const sourceRowId = firstString(item?.rowId, item?.id, item?.recordId);
    const hashInput = sourceRowId
      ? `row__${sourceRowId}`
      : `${timestamp}__${ec}__${locationName}__${namaLokasiStandard}__${center}`;
    const baseHash = crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 10);
    const occurrence = seen.get(baseHash) ?? 0;
    seen.set(baseHash, occurrence + 1);
    const recordId = occurrence === 0 ? `REC-${baseHash}` : `REC-${baseHash}-${occurrence}`;

    return {
      recordId,
      timestamp,
      ec,
      locationName,
      namaLokasiStandard,
      center,
      centerNearest,
      matchStatus,
      matchMethod,
      matchConfidence: rawConfidence,
      buEntries,
      // Satu sumber kebenaran: semua angka dihitung ulang dari buEntries
      leadsCount: statusCounts['Leads'],
      bookingCount: statusCounts['Booking'],
      totalBUEntries: buEntries.length,
      statusBreakdown: statusCounts,
    };
  });
}

function buildResponse(payload: any): FieldSalesResponse {
  const rawData = Array.isArray(payload.data) ? payload.data : [];
  const data = sanitizeRecords(rawData);

  const statusBreakdown = emptyStatusCounts();
  let totalBUEntries = 0;
  let totalLeads = 0;
  let totalBooking = 0;

  for (const row of data) {
    totalBUEntries += row.totalBUEntries;
    totalLeads += row.leadsCount;
    totalBooking += row.bookingCount;
    for (const [st, cnt] of Object.entries(row.statusBreakdown)) {
      statusBreakdown[st] = (statusBreakdown[st] || 0) + cnt;
    }
  }

  return {
    success: true,
    generatedAt: str(payload.generatedAt) || new Date().toISOString(),
    count: data.length,
    summary: {
      totalVisits: data.length,
      totalBUEntries,
      totalLeads,
      totalBooking,
      statusBreakdown,
    },
    data,
  };
}

// ---------------------------------------------------------------------------
// Cache + dedupe request yang sedang berjalan
// ---------------------------------------------------------------------------

let cache: { at: number; body: FieldSalesResponse } | null = null;
let inFlight: Promise<FieldSalesResponse> | null = null;

async function loadFieldSalesData(): Promise<FieldSalesResponse> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.body;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const payload = await fetchAppsScriptWithRetry();
      const body = buildResponse(payload);
      cache = { at: Date.now(), body };
      return body;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api', rateLimit);

/**
 * Health check endpoint for internal backend
 * Note: Does not claim Google Sheets is healthy, only reports backend status.
 */
app.get('/api/field-sales/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: 'online',
    timestamp: new Date().toISOString(),
    appsScriptConfigured: Boolean(APPS_SCRIPT_URL),
    authEnabled: Boolean(DASHBOARD_TOKEN),
    environment: process.env.NODE_ENV || 'development',
    note: 'Backend proxy is operational. Google Sheets data is retrieved on demand.',
  });
});

/**
 * Data retrieval endpoint
 * Mengambil data dari Google Apps Script Web App, lalu menyaring secara ketat
 * sehingga TIDAK ADA PII pelanggan (Parent, Phone, Child, DOB, Age, Notes) yang dikirim ke browser.
 */
app.get('/api/field-sales/data', requireDashboardToken, async (_req: Request, res: Response) => {
  if (!APPS_SCRIPT_URL) {
    res.status(500).json({
      success: false,
      errorType: 'CONFIG_ERROR',
      error: 'APPS_SCRIPT_URL belum dikonfigurasi di environment variables.',
    });
    return;
  }

  try {
    const body = await loadFieldSalesData();
    res.json(body);
  } catch (err) {
    const upstream =
      err instanceof UpstreamError
        ? err
        : new UpstreamError('NETWORK_ERROR', 'Terjadi kesalahan tak terduga di server.', 500, false);

    // Jika punya data lama yang masih layak, tampilkan itu daripada dashboard kosong
    if (cache && Date.now() - cache.at < STALE_MAX_AGE_MS) {
      res.json({
        ...cache.body,
        stale: true,
        warning: `Menampilkan data tersimpan (${Math.round((Date.now() - cache.at) / 1000)} detik lalu) karena pembaruan gagal: ${upstream.message}`,
      });
      return;
    }

    res.status(upstream.httpStatus).json({
      success: false,
      errorType: upstream.errorType,
      error: upstream.message,
    });
  }
});

// Handler 404 untuk route API yang tidak dikenal (agar tidak jatuh ke index.html milik SPA).
// Memakai app.use agar kompatibel dengan Express 4 dan Express 5.
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    errorType: 'NOT_FOUND',
    error: 'Endpoint API tidak ditemukan.',
  });
});

// ---------------------------------------------------------------------------
// Vite (development) atau file statis (production)
// ---------------------------------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!APPS_SCRIPT_URL) {
    console.warn('[Config] PERINGATAN: APPS_SCRIPT_URL belum diisi di .env. Endpoint data akan mengembalikan CONFIG_ERROR.');
  }
  if (!DASHBOARD_TOKEN) {
    console.warn('[Config] PERINGATAN: DASHBOARD_TOKEN kosong. Endpoint data tidak diautentikasi.');
  }

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Jika file ini sudah dibundle ke dalam dist/, jangan menambah dist/dist
    const distPath = path.basename(__dirname) === 'dist' ? __dirname : path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    // app.use tanpa pola path: aman untuk Express 4 dan 5
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Sparks Field Sales Dashboard] Server running at http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`,
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});