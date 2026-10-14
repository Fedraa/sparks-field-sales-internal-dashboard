import React, { useEffect, useState, useMemo } from 'react';
import {
  MapPin,
  ArrowUpDown,
  Building2,
  Users,
} from 'lucide-react';
import {
  DashboardFilters,
  LocationPerformanceRecord,
  DataState,
} from '../types/dashboard';
import { fetchLocationPerformance } from '../services/dashboardService';
import { DashboardFilterBar } from '../components/filters/DashboardFilterBar';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

type SortField = 'totalLeads' | 'totalBookings' | 'conversionRate' | 'locationName';
type SortDirection = 'asc' | 'desc';

interface LocationPerformancePageProps {
  filters: DashboardFilters;
  onFilterChange: (filters: Partial<DashboardFilters>) => void;
  onResetFilters: () => void;
  refreshTrigger: number;
}

export const LocationPerformancePage: React.FC<LocationPerformancePageProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  refreshTrigger,
}) => {
  const [locationsState, setLocationsState] = useState<DataState<LocationPerformanceRecord[]>>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
    isMock: true,
  });

  const [sortField, setSortField] = useState<SortField>('totalLeads');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const loadData = async () => {
    setLocationsState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetchLocationPerformance(filters);
      setLocationsState(res);
    } catch {
      setLocationsState({
        data: null,
        isLoading: false,
        error: 'Failed to load location performance records.',
        lastUpdated: null,
        isMock: true,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [filters, refreshTrigger]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedLocations = useMemo(() => {
    if (!locationsState.data) return [];
    return [...locationsState.data].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortDir === 'asc'
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }
      return sortDir === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [locationsState.data, sortField, sortDir]);

  if (locationsState.isLoading) {
    return (
      <div className="space-y-6">
        <DashboardFilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          onResetFilters={onResetFilters}
          showLocationFilter={false}
        />
        <LoadingState message="Aggregating standardized location performance records..." rows={6} />
      </div>
    );
  }

  if (locationsState.error) {
    return (
      <div className="space-y-6">
        <DashboardFilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          onResetFilters={onResetFilters}
          showLocationFilter={false}
        />
        <ErrorState error={locationsState.error} onRetry={loadData} />
      </div>
    );
  }

  const isEmpty = sortedLocations.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Title & Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Location Performance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated Leads, confirmed Bookings, and conversion metrics by standardized field location.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-mono tabular-nums font-semibold text-slate-900">{sortedLocations.length}</span> locations
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        showLocationFilter={false}
      />

      {isEmpty ? (
        <EmptyState
          title="No locations match your filter"
          description="Adjust your Center or search query to review other retail locations."
          onResetFilters={onResetFilters}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSort('locationName')}
                      className="flex items-center gap-1.5 hover:text-slate-900 font-semibold"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Standardized Location</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Center / Region</th>
                  <th className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Active ECs</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSort('totalLeads')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto font-semibold"
                    >
                      <span>Total Leads</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSort('totalBookings')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto font-semibold"
                    >
                      <span>Total Bookings</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSort('conversionRate')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto font-semibold"
                    >
                      <span>Conversion</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Site Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedLocations.map((loc) => (
                  <tr key={loc.locationId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{loc.locationName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{loc.locationId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{loc.center}</div>
                      <div className="text-[11px] text-slate-400">{loc.region}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                      {loc.activeEcsCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {loc.totalLeads}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {loc.totalBookings}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {loc.conversionRate}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      {/* Zero-pill: clean text with subtle styling */}
                      <span className="text-[11px] font-medium text-slate-600">
                        {loc.status === 'active' ? 'Active Booth' : 'Temporary'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
