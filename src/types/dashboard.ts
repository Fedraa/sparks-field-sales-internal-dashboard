/**
 * Type definitions for Sparks Field Sales — Internal Dashboard
 * Note: Customer PII (parent names, phone numbers, children names, DOB) is strictly omitted.
 */

export type DateRangePreset = 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month';

export interface DashboardFilters {
  center: string; // 'all' or specific center
  dateRange: DateRangePreset;
  ecId: string; // 'all' or specific EC ID
  locationId: string; // 'all' or specific location ID
  searchQuery: string;
}

export interface MetricSummary {
  totalLeads: number;
  totalBookings: number;
  overallConversionRate: number; // percentage, e.g. 24.5
  activeLocationsCount: number;
  activeEcCount: number;
  leadsTrendPercentage: number;
  bookingsTrendPercentage: number;
}

export interface LocationPerformanceRecord {
  locationId: string;
  locationName: string;
  center: string;
  region: string;
  totalLeads: number;
  totalBookings: number;
  conversionRate: number; // percentage
  activeEcsCount: number;
  status: 'active' | 'temporary' | 'inactive';
}

export interface EcPerformanceRecord {
  ecId: string;
  ecCode: string;
  ecName: string;
  center: string;
  assignedLocation: string;
  totalLeads: number;
  totalBookings: number;
  conversionRate: number; // percentage
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

export interface DataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isMock: boolean;
}
