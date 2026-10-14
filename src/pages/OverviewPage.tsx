import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  MapPin,
  Users,
  Target,
  Award,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import {
  DashboardFilters,
  MetricSummary,
  LocationPerformanceRecord,
  EcPerformanceRecord,
  DataState,
} from '../types/dashboard';
import {
  fetchOverviewMetrics,
  fetchLocationPerformance,
  fetchEcPerformance,
} from '../services/dashboardService';
import { DashboardFilterBar } from '../components/filters/DashboardFilterBar';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

interface OverviewPageProps {
  filters: DashboardFilters;
  onFilterChange: (filters: Partial<DashboardFilters>) => void;
  onResetFilters: () => void;
  onNavigateTab: (tab: 'locations' | 'ec-performance' | 'data-quality') => void;
  refreshTrigger: number;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onNavigateTab,
  refreshTrigger,
}) => {
  const [metricsState, setMetricsState] = useState<DataState<MetricSummary>>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
    isMock: true,
  });

  const [topLocations, setTopLocations] = useState<LocationPerformanceRecord[]>([]);
  const [topEcs, setTopEcs] = useState<EcPerformanceRecord[]>([]);

  const loadData = async () => {
    setMetricsState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [metricsRes, locationsRes, ecsRes] = await Promise.all([
        fetchOverviewMetrics(filters),
        fetchLocationPerformance(filters),
        fetchEcPerformance(filters),
      ]);

      setMetricsState(metricsRes);
      if (locationsRes.data) {
        // Sort descending by total Leads
        const sorted = [...locationsRes.data].sort((a, b) => b.totalLeads - a.totalLeads);
        setTopLocations(sorted.slice(0, 4));
      }
      if (ecsRes.data) {
        const sorted = [...ecsRes.data].sort((a, b) => b.totalBookings - a.totalBookings);
        setTopEcs(sorted.slice(0, 4));
      }
    } catch {
      setMetricsState({
        data: null,
        isLoading: false,
        error: 'Failed to retrieve overview metrics.',
        lastUpdated: null,
        isMock: true,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [filters, refreshTrigger]);

  if (metricsState.isLoading) {
    return (
      <div className="space-y-6">
        <DashboardFilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          onResetFilters={onResetFilters}
        />
        <LoadingState message="Aggregating Leads, Booking, and Conversion rates..." rows={5} />
      </div>
    );
  }

  if (metricsState.error) {
    return (
      <div className="space-y-6">
        <DashboardFilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          onResetFilters={onResetFilters}
        />
        <ErrorState error={metricsState.error} onRetry={loadData} />
      </div>
    );
  }

  const data = metricsState.data;
  const isZeroState = !data || (data.totalLeads === 0 && data.totalBookings === 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Field Sales Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key metrics for Leads, Booking conversion, and active field deployment.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Source: Mock Fixture (Pre-Audit)</span>
          <span aria-hidden="true">·</span>
          <span>Scope: Authorized Internal</span>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
      />

      {isZeroState ? (
        <EmptyState
          title="No overview data for current filters"
          description="Try adjusting your Center, EC, or Date Range filter to display aggregate metrics."
          onResetFilters={onResetFilters}
        />
      ) : (
        <>
          {/* Summary Metric Cards Grid (5-column layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Leads */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Total Leads</span>
                <Target className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {data.totalLeads.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-medium">
                <ArrowUpRight className="w-3 h-3" />
                <span className="tabular-nums">+{data.leadsTrendPercentage}% vs prev period</span>
              </div>
            </div>

            {/* Total Bookings */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Total Bookings</span>
                <Award className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {data.totalBookings.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-medium">
                <ArrowUpRight className="w-3 h-3" />
                <span className="tabular-nums">+{data.bookingsTrendPercentage}% vs prev period</span>
              </div>
            </div>

            {/* Overall Conversion Rate */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Conversion Rate</span>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {data.overallConversionRate}%
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Leads to Booking ratio
              </div>
            </div>

            {/* Active Locations */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Active Locations</span>
                <MapPin className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {data.activeLocationsCount}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Operating retail booths
              </div>
            </div>

            {/* Active Field ECs */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Active Field ECs</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {data.activeEcCount}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Education consultants
              </div>
            </div>
          </div>

          {/* Two-Column Deep-Dive Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Locations Snapshot */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Top Locations by Leads
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standardized location-level performance
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('locations')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100 pb-2">
                      <th className="pb-2 font-medium">Location</th>
                      <th className="pb-2 font-medium">Center</th>
                      <th className="pb-2 font-medium text-right">Leads</th>
                      <th className="pb-2 font-medium text-right">Booking</th>
                      <th className="pb-2 font-medium text-right">Conv %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topLocations.map((loc) => (
                      <tr key={loc.locationId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 font-medium text-slate-900 max-w-[180px] truncate">
                          {loc.locationName}
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {loc.center}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                          {loc.totalLeads}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                          {loc.totalBookings}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {loc.conversionRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top EC Performance Leaderboard */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    EC Performance Highlights
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Field reps ranked by total confirmed Bookings
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('ec-performance')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100 pb-2">
                      <th className="pb-2 font-medium w-8">#</th>
                      <th className="pb-2 font-medium">EC Rep</th>
                      <th className="pb-2 font-medium">Center</th>
                      <th className="pb-2 font-medium text-right">Leads</th>
                      <th className="pb-2 font-medium text-right">Booking</th>
                      <th className="pb-2 font-medium text-right">Conv %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topEcs.map((ec, idx) => (
                      <tr key={ec.ecId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 font-mono text-slate-400 tabular-nums">
                          0{idx + 1}
                        </td>
                        <td className="py-2.5 font-medium text-slate-900">
                          <div>{ec.ecName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ec.ecCode}</div>
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {ec.center}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                          {ec.totalLeads}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {ec.totalBookings}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                          {ec.conversionRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
