import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Google Apps Script Web App URL
const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzZmcsKNDPIXgflD3WuOQwrRYy8sv_HV7KBzLzSMPhefYkXuf7THY_1gFtoI49ErBfYtA/exec';
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL;

app.use(express.json());

// Strict Allowlist Interface for Sanitized Visit Entries
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
}

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
    environment: process.env.NODE_ENV || 'development',
    note: 'Backend proxy is operational. Google Sheets data is retrieved on demand.',
  });
});

/**
 * Data retrieval endpoint
 * Connects to Google Apps Script Web App via HTTP POST with automatic redirect following.
 * Strictly sanitizes data to guarantee NO customer PII (Parent, Phone, Child, DOB, Age, Notes)
 * is ever sent to the browser.
 */
app.get('/api/field-sales/data', async (_req: Request, res: Response) => {
  try {
    if (!APPS_SCRIPT_URL) {
      res.status(500).json({
        success: false,
        error: 'APPS_SCRIPT_URL is not configured in environment variables.',
      });
      return;
    }

    // Set 25-second timeout to handle cold starts of Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      res.status(response.status).json({
        success: false,
        error: `Apps Script endpoint returned HTTP error ${response.status}: ${response.statusText}`,
      });
      return;
    }

    const responseText = await response.text();

    let payload: any;
    try {
      payload = JSON.parse(responseText);
    } catch {
      // If JSON parsing fails, check if the response was an HTML login/error redirect page
      const trimmed = responseText.trim();
      if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('<body')) {
        res.status(502).json({
          success: false,
          error:
            'Apps Script returned an HTML page instead of JSON. The deployment may require authentication or redirected to a Google login page.',
        });
        return;
      }

      res.status(502).json({
        success: false,
        error: 'Failed to parse JSON response from Apps Script endpoint.',
      });
      return;
    }

    if (!payload || typeof payload !== 'object' || payload.success === false) {
      res.status(502).json({
        success: false,
        error: payload?.error || 'Apps Script returned unsuccessful response payload.',
      });
      return;
    }

    const rawData = Array.isArray(payload.data) ? payload.data : [];

    // Strict Allowlist Sanitization:
    // Strip all unwanted fields (Parent, Phone, Child, DOB, Age, Notes, raw row data)
    const sanitizedData: SanitizedVisitRecord[] = rawData.map((item: any, index: number) => {
      const buEntries: SanitizedBuEntry[] = Array.isArray(item.buEntries)
        ? item.buEntries.map((b: any) => ({
            bu: typeof b.bu === 'string' ? b.bu.trim() : '',
            center: typeof b.center === 'string' ? b.center.trim() : '',
            status: typeof b.status === 'string' ? b.status.trim() : '',
            ageGroup: typeof b.ageGroup === 'string' ? b.ageGroup.trim() : '',
            classDate: typeof b.classDate === 'string' ? b.classDate.trim() : '',
            classTime: typeof b.classTime === 'string' ? b.classTime.trim() : '',
            className: typeof b.className === 'string' ? b.className.trim() : '',
            room: typeof b.room === 'string' ? b.room.trim() : '',
          }))
        : [];

      // Calculate exact Leads and Bookings according to calculation rules:
      // status === "Leads" -> Lead
      // status === "Booking" -> Booking
      let computedLeads = 0;
      let computedBookings = 0;
      for (const entry of buEntries) {
        const s = entry.status.toLowerCase();
        if (s === 'leads' || s === 'lead') {
          computedLeads += 1;
        } else if (s === 'booking' || s === 'bookings') {
          computedBookings += 1;
        }
      }

      const timestamp = typeof item.timestamp === 'string' ? item.timestamp : '';
      const ec = typeof item.ec === 'string' ? item.ec.trim() : '';
      const locationName =
        (typeof item.locationName === 'string' && item.locationName.trim()) ||
        (typeof item.rawLocation === 'string' && item.rawLocation.trim()) ||
        (typeof item.Nama_Lokasi_Raw === 'string' && item.Nama_Lokasi_Raw.trim()) ||
        (typeof item.Location === 'string' && item.Location.trim()) ||
        '';

      // Preserve standard location name without falling back to raw location
      const namaLokasiStandard =
        (typeof item.namaLokasiStandard === 'string' && item.namaLokasiStandard.trim()) ||
        (typeof item.Nama_Lokasi_Standard === 'string' && item.Nama_Lokasi_Standard.trim()) ||
        '';

      const center = typeof item.center === 'string' ? item.center.trim() : '';
      const centerNearest =
        typeof item.centerNearest === 'string' && item.centerNearest.trim() !== ''
          ? item.centerNearest.trim()
          : typeof item.Center_Terdekat === 'string'
            ? item.Center_Terdekat.trim()
            : '';

      const matchStatus =
        (typeof item.matchStatus === 'string' && item.matchStatus.trim()) ||
        (typeof item.Match_Status === 'string' && item.Match_Status.trim()) ||
        'Unknown';

      const matchMethod =
        (typeof item.matchMethod === 'string' && item.matchMethod.trim()) ||
        (typeof item.Match_Method === 'string' && item.Match_Method.trim()) ||
        'Unknown';

      const matchConfidence =
        typeof item.matchConfidence === 'number'
          ? item.matchConfidence
          : typeof item.Match_Confidence === 'number'
            ? item.Match_Confidence
            : 1;

      // Deterministic pseudonymized record ID:
      // Uses a non-reversible cryptographic hash of immutable non-PII visit attributes and origin position
      const hashInput = `${timestamp}__${ec}__${locationName}__${namaLokasiStandard}__${center}__${index}`;
      const recordId = 'REC-' + crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 10);

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
        matchConfidence,
        buEntries,
        leadsCount: typeof item.leadsCount === 'number' ? item.leadsCount : computedLeads,
        bookingCount: typeof item.bookingCount === 'number' ? item.bookingCount : computedBookings,
        totalBUEntries: typeof item.totalBUEntries === 'number' ? item.totalBUEntries : buEntries.length,
      };
    });

    // Compute aggregated summary from validated sanitized data
    const totalVisits = sanitizedData.length;
    const totalBUEntries = sanitizedData.reduce((acc, row) => acc + row.totalBUEntries, 0);
    const totalLeads = sanitizedData.reduce((acc, row) => acc + row.leadsCount, 0);
    const totalBooking = sanitizedData.reduce((acc, row) => acc + row.bookingCount, 0);

    const summary = {
      totalVisits: typeof payload.summary?.totalVisits === 'number' ? payload.summary.totalVisits : totalVisits,
      totalBUEntries: typeof payload.summary?.totalBUEntries === 'number' ? payload.summary.totalBUEntries : totalBUEntries,
      totalLeads: typeof payload.summary?.totalLeads === 'number' ? payload.summary.totalLeads : totalLeads,
      totalBooking: typeof payload.summary?.totalBooking === 'number' ? payload.summary.totalBooking : totalBooking,
    };

    res.json({
      success: true,
      generatedAt: payload.generatedAt || new Date().toISOString(),
      count: sanitizedData.length,
      summary,
      data: sanitizedData,
    });
  } catch (error: any) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      res.status(504).json({
        success: false,
        error: 'Connection timeout while contacting Google Apps Script endpoint.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: `Internal Server Error: ${error.message || 'Unknown error'}`,
    });
  }
});

// Setup Vite middleware in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

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
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sparks Field Sales Dashboard] Server running at http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
