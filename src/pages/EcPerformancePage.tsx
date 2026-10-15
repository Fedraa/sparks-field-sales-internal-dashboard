import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Award,
  ArrowUpDown,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  DashboardFilters,
  EcPerformanceRecord,
  DataState,
} from '../types/dashboard';
import {
  fetchEcPerformance,
  fetchFilterOptions,
} from '../services/dashboardService';
import { DashboardFilterBar } from '../components/filters/DashboardFilterBar';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

type SortField = 'rank' | 'totalVisits' | 'totalLeads' | 'totalBookings' | 'conversionRate' | 'ecName';
type SortDirection = 'asc' | 'desc';

interface EcPerformancePageProps {
  filters: DashboardFilters;
  onFilterChange: (filters: Partial<DashboardFilters>) => void;
  onResetFilters: () => void;
  refreshTrigger: number;
}

export const EcPerformancePage: React.FC<EcPerformancePageProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  refreshTrigger,
}) => {
  const [ecsState, setEcsState] = useState<DataState<EcPerformanceRecord[]>>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
    isMock: false,
    sourceDescription: 'Memuat...',
  });

  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [filterOptions, setFilterOptions] = useState<{
    centers: string[];
    locations: string[];
    ecs: string[];
  }>({ centers: [], locations: [], ecs: [] });

  const loadData = async () => {
    setEcsState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [res, optionsRes] = await Promise.all([
        fetchEcPerformance(filters, false),
        fetchFilterOptions(),
      ]);
      setEcsState(res);
      setFilterOptions(optionsRes);
    } catch (err: any) {
      setEcsState({
        data: null,
        isLoading: false,
        error: err.message || 'Gagal memuat performa EC dari Apps Script.',
        lastUpdated: null,
        isMock: false,
        sourceDescription: 'Koneksi Gagal',
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
      setSortDir(field === 'rank' ? 'asc' : 'desc');
    }
  };

  const sortedEcs = useMemo(() => {
    if (!ecsState.data) return [];
    return [...ecsState.data].sort((a, b) => {
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
  }, [ecsState.data, sortField, sortDir]);

  // Top 3 Podium ECs
  const topThree = useMemo(() => {
    if (!ecsState.data) return [];
    return [...ecsState.data]
      .filter(e => e.totalBookings > 0 || e.totalLeads > 0)
      .slice(0, 3);
  }, [ecsState.data]);

  if (ecsState.isLoading) {
    return (
      <div className="space-y-6">
        <DashboardFilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          onResetFilters={onResetFilters}
          showEcFilter={false}
          centerOptions={filterOptions.centers}
          locationOptions={filterOptions.locations}
        />
        <LoadingState message="Menghitung peringkat performa Field EC dari data Google Sheets..." rows={6} />
      </div>
    );
  }

  if (ecsState.error) {
    return (
      <div className="space-y-6">
        <DashboardFilterBar
          filters={filters}
          onFilterChange={onFilterChange}
          onResetFilters={onResetFilters}
          showEcFilter={false}
          centerOptions={filterOptions.centers}
          locationOptions={filterOptions.locations}
        />
        <ErrorState
          title="Koneksi Google Apps Script Terkendala"
          error={ecsState.error}
          onRetry={loadData}
        />
      </div>
    );
  }

  const isEmpty = sortedEcs.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Title & PII Compliance Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Performa Education Consultant (EC)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Papan peringkat dan produktivitas field sales berdasarkan entri Leads dan Booking aktual.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Internal Analytics · PII Pelanggan Disaring Penuh</span>
        </div>
      </div>

      {/* Filter Bar */}
      <DashboardFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        showEcFilter={false}
        centerOptions={filterOptions.centers}
        locationOptions={filterOptions.locations}
      />

      {/* Top 3 Leaders Spotlight Cards */}
      {topThree.length >= 1 && !isEmpty && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((ec, idx) => (
            <div
              key={ec.ecId}
              className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Peringkat #0{idx + 1}
                  </span>
                  <Award className="w-4 h-4 text-slate-700" />
                </div>
                <div className="font-bold text-slate-900 text-sm">{ec.ecName}</div>
                <div className="text-xs text-slate-500 mt-0.5">{ec.center}</div>
                <div className="text-[11px] text-slate-400 truncate mt-1">
                  {ec.assignedLocation}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Kunjungan</div>
                  <div className="font-mono tabular-nums font-medium text-slate-700">
                    {ec.totalVisits}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Leads</div>
                  <div className="font-mono tabular-nums font-semibold text-slate-800">
                    {ec.totalLeads}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Booking</div>
                  <div className="font-mono tabular-nums font-bold text-slate-900">
                    {ec.totalBookings}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">Share</div>
                  <div className="font-mono tabular-nums font-semibold text-slate-900">
                    {ec.conversionRate}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          title="Tidak ada data EC yang cocok"
          description="Ubah filter Center atau kata kunci pencarian untuk melihat data EC lainnya."
          onResetFilters={onResetFilters}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-12">
                    <button
                      onClick={() => handleSort('rank')}
                      className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                    >
                      <span>#</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4">
                    <button
                      onClick={() => handleSort('ecName')}
                      className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                    >
                      <span>Nama Field EC</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4">Center Terdekat</th>
                  <th className="py-3 px-4">Lokasi Kunjungan Utama</th>
                  <th className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSort('totalVisits')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto font-semibold"
                    >
                      <span>Kunjungan</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
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
                      <span>Confirmed Booking</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSort('conversionRate')}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto font-semibold"
                    >
                      <span>Booking Share</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">Kategori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedEcs.map((ec) => (
                  <tr key={ec.ecId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-400">
                      {ec.rank < 10 ? `0${ec.rank}` : ec.rank}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {ec.ecName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ec.center}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {ec.assignedLocation}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {ec.totalVisits}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {ec.totalLeads}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {ec.totalBookings}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                      {ec.conversionRate}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] font-medium text-slate-600">
                        {ec.tier}
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
