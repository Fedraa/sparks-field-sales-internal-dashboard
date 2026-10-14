/**
 * Sparks Field Sales — Data Access Service (Abstraction Layer)
 * 
 * ARCHITECTURAL PURPOSE:
 * This layer completely decouples dashboard UI components from the underlying data source.
 * In this initial scaffold, it sources from `mockFieldSalesData.ts` and tags all payloads
 * with `isMock: true`.
 * 
 * FUTURE INTEGRATION ROADMAP:
 * When the Google Apps Script endpoint audit is completed, this service will be updated
 * to call the authenticated Apps Script proxy without requiring any structural changes
 * to the presentation components.
 */

import {
  DashboardFilters,
  MetricSummary,
  LocationPerformanceRecord,
  EcPerformanceRecord,
  PipelineAuditRecord,
  DataState,
} from '../types/dashboard';
import {
  MOCK_LOCATIONS,
  MOCK_ECS,
  MOCK_PIPELINE_AUDIT,
  MOCK_DATA_METADATA,
} from '../data/mockFieldSalesData';

// Simulation controls for testing loading/error/empty states in UI review
export interface SimulationOptions {
  forceLoading?: boolean;
  forceError?: boolean;
  forceEmpty?: boolean;
  latencyMs?: number;
}

let activeSimulation: SimulationOptions = {
  forceLoading: false,
  forceError: false,
  forceEmpty: false,
  latencyMs: 300,
};

export const setSimulationOptions = (options: Partial<SimulationOptions>) => {
  activeSimulation = { ...activeSimulation, ...options };
};

export const getSimulationOptions = (): SimulationOptions => ({ ...activeSimulation });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Filter helper for location records based on active dashboard filters
 */
function applyLocationFilters(
  items: LocationPerformanceRecord[],
  filters?: Partial<DashboardFilters>
): LocationPerformanceRecord[] {
  if (!filters) return items;

  return items.filter((loc) => {
    if (filters.center && filters.center !== 'all' && loc.center !== filters.center) {
      return false;
    }
    if (filters.locationId && filters.locationId !== 'all' && loc.locationId !== filters.locationId) {
      return false;
    }
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      const matchName = loc.locationName.toLowerCase().includes(q);
      const matchCenter = loc.center.toLowerCase().includes(q);
      const matchRegion = loc.region.toLowerCase().includes(q);
      if (!matchName && !matchCenter && !matchRegion) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Filter helper for EC records based on active dashboard filters
 */
function applyEcFilters(
  items: EcPerformanceRecord[],
  filters?: Partial<DashboardFilters>
): EcPerformanceRecord[] {
  if (!filters) return items;

  return items.filter((ec) => {
    if (filters.center && filters.center !== 'all' && ec.center !== filters.center) {
      return false;
    }
    if (filters.ecId && filters.ecId !== 'all' && ec.ecId !== filters.ecId) {
      return false;
    }
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      const matchName = ec.ecName.toLowerCase().includes(q);
      const matchCode = ec.ecCode.toLowerCase().includes(q);
      const matchCenter = ec.center.toLowerCase().includes(q);
      const matchLoc = ec.assignedLocation.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCenter && !matchLoc) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Fetch Aggregated Overview Metrics
 */
export async function fetchOverviewMetrics(
  filters?: Partial<DashboardFilters>
): Promise<DataState<MetricSummary>> {
  if (activeSimulation.latencyMs) {
    await delay(activeSimulation.latencyMs);
  }

  if (activeSimulation.forceError) {
    return {
      data: null,
      isLoading: false,
      error: 'Simulated connection failure: Unable to establish contact with Apps Script endpoint.',
      lastUpdated: null,
      isMock: true,
    };
  }

  if (activeSimulation.forceEmpty) {
    return {
      data: {
        totalLeads: 0,
        totalBookings: 0,
        overallConversionRate: 0,
        activeLocationsCount: 0,
        activeEcCount: 0,
        leadsTrendPercentage: 0,
        bookingsTrendPercentage: 0,
      },
      isLoading: false,
      error: null,
      lastUpdated: new Date().toISOString(),
      isMock: true,
    };
  }

  const filteredLocations = applyLocationFilters(MOCK_LOCATIONS, filters);
  const filteredEcs = applyEcFilters(MOCK_ECS, filters);

  const totalLeads = filteredLocations.reduce((sum, item) => sum + item.totalLeads, 0);
  const totalBookings = filteredLocations.reduce((sum, item) => sum + item.totalBookings, 0);
  const overallConversionRate = totalLeads > 0 ? (totalBookings / totalLeads) * 100 : 0;
  const activeLocationsCount = filteredLocations.filter((l) => l.status === 'active').length;
  const activeEcCount = filteredEcs.length;

  return {
    data: {
      totalLeads,
      totalBookings,
      overallConversionRate: Number(overallConversionRate.toFixed(1)),
      activeLocationsCount,
      activeEcCount,
      leadsTrendPercentage: 12.4, // Sample baseline trend
      bookingsTrendPercentage: 8.7,
    },
    isLoading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    isMock: true,
  };
}

/**
 * Fetch Location Performance Table Data
 */
export async function fetchLocationPerformance(
  filters?: Partial<DashboardFilters>
): Promise<DataState<LocationPerformanceRecord[]>> {
  if (activeSimulation.latencyMs) {
    await delay(activeSimulation.latencyMs);
  }

  if (activeSimulation.forceError) {
    return {
      data: null,
      isLoading: false,
      error: 'Data access error: Failed to retrieve location metrics from mock data store.',
      lastUpdated: null,
      isMock: true,
    };
  }

  if (activeSimulation.forceEmpty) {
    return {
      data: [],
      isLoading: false,
      error: null,
      lastUpdated: new Date().toISOString(),
      isMock: true,
    };
  }

  const filtered = applyLocationFilters(MOCK_LOCATIONS, filters);

  return {
    data: filtered,
    isLoading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    isMock: true,
  };
}

/**
 * Fetch EC Performance Table Data
 */
export async function fetchEcPerformance(
  filters?: Partial<DashboardFilters>
): Promise<DataState<EcPerformanceRecord[]>> {
  if (activeSimulation.latencyMs) {
    await delay(activeSimulation.latencyMs);
  }

  if (activeSimulation.forceError) {
    return {
      data: null,
      isLoading: false,
      error: 'Data access error: Failed to retrieve EC performance records.',
      lastUpdated: null,
      isMock: true,
    };
  }

  if (activeSimulation.forceEmpty) {
    return {
      data: [],
      isLoading: false,
      error: null,
      lastUpdated: new Date().toISOString(),
      isMock: true,
    };
  }

  const filtered = applyEcFilters(MOCK_ECS, filters);

  return {
    data: filtered,
    isLoading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    isMock: true,
  };
}

/**
 * Fetch Data Quality and Pipeline Audit records
 */
export async function fetchDataQualityStatus(): Promise<DataState<PipelineAuditRecord[]>> {
  if (activeSimulation.latencyMs) {
    await delay(activeSimulation.latencyMs);
  }

  return {
    data: MOCK_PIPELINE_AUDIT,
    isLoading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    isMock: true,
  };
}
