/**
 * Type definitions for Sparks Field Sales — Internal Dashboard
 * Note: Customer PII (parent names, phone numbers, children names, DOB) is strictly omitted.
 */

export type DateRangePreset = 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month';

export interface DashboardFilters {
  center: string; // 'all' or specific center (matches centerNearest)
  dateRange: DateRangePreset;
  ecId: string; // 'all' or specific EC name
  locationId: string; // 'all' or specific location name
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
  buEntriesCount: number;
  leadsCount: number;
  bookingCount: number;
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

