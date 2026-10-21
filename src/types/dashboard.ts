/**
 * Type definitions for Sparks Field Sales — Internal Dashboard
 * Note: Customer PII (parent names, phone numbers, children names, DOB) is strictly omitted.
 */

export type DateRangePreset = 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month';

/**
 * Standard 6-Status Flow for Sparks Field Sales
 * STATUS_ORDER defines the natural progression order (1 through 6).
 */
export const STATUS_ORDER = {
  'Leads': 1,
  'Potential Booking': 2,
  'FU Booking': 3,
  'Booking': 4,
  'Rescheduled': 5,
  'Cancelled': 6,
} as const;

export type BookingStatus = keyof typeof STATUS_ORDER;

export const ALL_BOOKING_STATUSES: BookingStatus[] = [
  'Leads',
  'Potential Booking',
  'FU Booking',
  'Booking',
  'Rescheduled',
  'Cancelled',
];

export function normalizeBookingStatus(statusStr?: string | null): BookingStatus | null {
  if (!statusStr || typeof statusStr !== 'string') return null;
  const s = statusStr.trim().toLowerCase();
  if (s === 'leads' || s === 'lead') return 'Leads';
  if (s === 'potential booking' || s === 'potential' || s === 'potential_booking') return 'Potential Booking';
  if (
    s === 'fu booking' ||
    s === 'fu' ||
    s === 'fu_booking' ||
    s === 'follow up booking' ||
    s === 'followup booking' ||
    s === 'follow-up booking'
  )
    return 'FU Booking';
  if (s === 'booking' || s === 'bookings') return 'Booking';
  if (s === 'rescheduled' || s === 'reschedule') return 'Rescheduled';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel') return 'Cancelled';
  return null;
}

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  {
    order: number;
    label: string;
    description: string;
    badgeClass: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
    dotClass: string;
  }
> = {
  'Leads': {
    order: 1,
    label: 'Leads',
    description: 'Prospek awal hasil interaksi di booth lapangan',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    borderClass: 'border-sky-300',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
    dotClass: 'bg-sky-500',
  },
  'Potential Booking': {
    order: 2,
    label: 'Potential Booking',
    description: 'Prospek tertarik tinggi yang sedang memilih sesi kelas',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    borderClass: 'border-indigo-300',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-700',
    dotClass: 'bg-indigo-500',
  },
  'FU Booking': {
    order: 3,
    label: 'FU Booking',
    description: 'Prospek dalam proses tindak lanjut intensif oleh tim EC',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    borderClass: 'border-amber-300',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
  },
  'Booking': {
    order: 4,
    label: 'Booking',
    description: 'Konfirmasi booking sesi/trial definitif (Confirmed Booking)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderClass: 'border-emerald-300',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  'Rescheduled': {
    order: 5,
    label: 'Rescheduled',
    description: 'Jadwal trial/sesi yang diatur ulang atas permintaan orang tua',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    borderClass: 'border-orange-300',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    dotClass: 'bg-orange-500',
  },
  'Cancelled': {
    order: 6,
    label: 'Cancelled',
    description: 'Booking atau prospek yang dibatalkan',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    borderClass: 'border-rose-300',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    dotClass: 'bg-rose-500',
  },
};

export interface DashboardFilters {
  center: string; // 'all' or specific center (matches centerNearest)
  dateRange: DateRangePreset;
  ecId: string; // 'all' or specific EC name
  locationId: string; // 'all' or specific location name
  status: string; // 'all' or specific BookingStatus
  searchQuery: string;
}

export interface BuEntry {
  bu: string;
  center: string;
  status: string;
  ageGroup: string;
  classDate: string;
  classTime: string;
  className: string;
  room: string;
}

export interface ActualVisitRecord {
  recordId?: string;
  timestamp: string;
  ec: string;
  locationName: string;
  namaLokasiStandard: string;
  center: string;
  centerNearest: string;
  matchStatus: string;
  matchMethod: string;
  matchConfidence: number;
  buEntries: BuEntry[];
  leadsCount: number;
  bookingCount: number;
  totalBUEntries: number;
  statusBreakdown?: Record<string, number>;
}

export interface ActualApiResponse {
  success: boolean;
  generatedAt: string;
  count: number;
  summary: {
    totalVisits: number;
    totalBUEntries: number;
    totalLeads: number;
    totalBooking: number;
    statusBreakdown?: Record<string, number>;
  };
  data: ActualVisitRecord[];
  error?: string;
}

export interface MetricSummary {
  totalVisits: number;
  totalBUEntries: number;
  totalLeads: number;
  totalBookings: number;
  overallConversionRate: number; // Booking / (Leads + Booking) * 100
  activeLocationsCount: number;
  activeEcCount: number;
  statusBreakdown: Record<BookingStatus, number>;
}

export interface LocationPerformanceRecord {
  locationId: string;
  locationName: string;
  center: string; // Represents centerNearest
  region?: string;
  totalVisits?: number;
  totalLeads: number;
  totalBookings: number;
  conversionRate: number; // Booking / (Leads + Booking) * 100
  activeEcsCount: number;
  matchStatus?: string;
  status: 'active' | 'temporary' | 'inactive';
  statusBreakdown?: Record<BookingStatus, number>;
}

export interface EcPerformanceRecord {
  ecId: string;
  ecCode: string;
  ecName: string;
  center: string;
  assignedLocation: string;
  totalVisits?: number;
  totalLeads: number;
  totalBookings: number;
  conversionRate: number; // Booking / (Leads + Booking) * 100
  rank: number;
  tier: 'Top Tier' | 'Core' | 'Developing';
  statusBreakdown?: Record<BookingStatus, number>;
}

export interface PipelineAuditRecord {
  stage: string;
  name: string;
  status: 'unverified' | 'mock_active' | 'pending_audit' | 'verified';
  details: string;
  lastChecked: string;
}

export interface DataQualityFollowUpRecord {
  id: string;
  timestamp: string;
  ec: string;
  rawLocation: string;
  standardLocation: string;
  locationDisplay: string;
  isLocationMapped: boolean;
  matchStatus: string;
  matchMethod: string;
  matchConfidence: number;
  center: string;
  centerDisplay: string;
  hasCenter: boolean;
  centerNearest: string;
  buCenter?: string;
  buEntriesCount: number;
  leadsCount: number;
  bookingCount: number;
  statusBreakdown?: Record<string, number>;
  statusSummary?: string;
}

export interface DataQualityMetrics {
  totalVisits: number;
  totalBUEntries: number;
  unmappedLocationCount: number;
  unmappedLocationPercentage: number;
  standardizedLocationCount: number;
  standardizedLocationPercentage: number;
  unassignedCenterCount: number;
  unassignedCenterPercentage: number;
  assignedCenterCount: number;
  assignedCenterPercentage: number;
  uniqueActionNeededCount: number; // Deduplicated count of visits with unmapped location OR unassigned center
  matchStatusBreakdown: {
    matched: number;
    review: number;
    unmatched: number;
  };
  followUpRecords: DataQualityFollowUpRecord[];
  generatedAt: string;
}

export interface DataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isMock: boolean;
  sourceDescription?: string;
}

