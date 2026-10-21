import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  MapPin,
  Users,
  Target,
  Award,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import {
  DashboardFilters,
  MetricSummary,
  LocationPerformanceRecord,
  EcPerformanceRecord,
  DataState,
  ALL_BOOKING_STATUSES,
  STATUS_ORDER,
  BOOKING_STATUS_CONFIG,
  BookingStatus,
} from '../types/dashboard';
import {
  fetchOverviewMetrics,
  fetchLocationPerformance,
  fetchEcPerformance,
  fetchFilterOptions,
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
    isMock: false,
    sourceDescription: 'Memuat...',
  });

  const [topLocations, setTopLocations] = useState<LocationPerformanceRecord[]>([]);
  const [topEcs, setTopEcs] = useState<EcPerformanceRecord[]>([]);
  const [filterOptions, setFilterOptions] = useState<{
    centers: string[];
    locations: string[];
    ecs: string[];
  }>({ centers: [], locations: [], ecs: [] });

  const loadData = async () => {
    setMetricsState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [metricsRes, locationsRes, ecsRes, optionsRes] = await Promise.all([
        fetchOverviewMetrics(filters, true),
        fetchLocationPerformance(filters, false),
        fetchEcPerformance(filters, false),
        fetchFilterOptions(),
      ]);

      setMetricsState(metricsRes);
      setFilterOptions(optionsRes);

      if (locationsRes.data) {
        const sorted = [...locationsRes.data].sort((a, b) => b.totalLeads - a.totalLeads);
        setTopLocations(sorted.slice(0, 5));
      }
      if (ecsRes.data) {
        const sorted = [...ecsRes.data].sort((a, b) => b.totalBookings - a.totalBookings);
        setTopEcs(sorted.slice(0, 5));
      }
    } catch (err: any) {
      setMetricsState({
        data: null,
        isLoading: false,
        error: err.message || 'Gagal mengambil data analitik overview.',
        lastUpdated: null,
        isMock: false,
        sourceDescription: 'Koneksi Gagal',
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
          centerOptions={filterOptions.centers}
          locationOptions={filterOptions.locations}
          ecOptions={filterOptions.ecs}
        />
        <LoadingState message="Menghubungkan ke Google Apps Script & menghitung metrik..." rows={5} />
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
          centerOptions={filterOptions.centers}
          locationOptions={filterOptions.locations}
          ecOptions={filterOptions.ecs}
        />
        <ErrorState
          title="Koneksi Google Apps Script Terkendala"
          error={metricsState.error}
          onRetry={loadData}
        />
      </div>
    );
  }

  const data = metricsState.data;
  const isZeroState = !data || (data.totalLeads === 0 && data.totalBookings === 0 && data.totalVisits === 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Field Sales Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Metrik agregasi Leads, Booking, dan efektivitas konversi per kunjungan retail.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-900">{metricsState.sourceDescription}</span>
          <span aria-hidden="true">·</span>
          <span>Scope: Authorized Internal</span>
        </div>
      </div>

      {/* Filter Bar with dynamic dropdowns */}
      <DashboardFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        centerOptions={filterOptions.centers}
        locationOptions={filterOptions.locations}
        ecOptions={filterOptions.ecs}
      />

      {isZeroState ? (
        <EmptyState
          title="Tidak ada data untuk filter yang dipilih"
          description="Coba ubah filter Center, Field EC, atau Rentang Tanggal untuk menampilkan data aktual."
          onResetFilters={onResetFilters}
        />
      ) : (
        <>
          {/* Summary Metric Cards Grid (6-column layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Total Visits */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Total Kunjungan</span>
                <ClipboardList className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {data.totalVisits.toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Baris respons kunjungan
              </div>
            </div>

            {/* Total BU Entries */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Total Entri BU</span>
                <Target className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {data.totalBUEntries.toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Grup BU terisi
              </div>
            </div>

            {/* Total Leads */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Total Leads</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {data.totalLeads.toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Status === "Leads"
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
              <div className="mt-2 text-[11px] text-slate-500">
                Status === "Booking"
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Booking Share</span>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {data.overallConversionRate}%
              </div>
              <div className="mt-2 text-[11px] text-slate-500 truncate" title="Booking / (Leads + Booking)">
                Booking / (Leads + Booking)
              </div>
            </div>

            {/* Active Locations & ECs */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-xs font-medium">Titik & Field EC</span>
                <MapPin className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {data.activeLocationsCount} <span className="text-xs font-normal text-slate-400">titik</span> · {data.activeEcCount} <span className="text-xs font-normal text-slate-400">EC</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Cakupan lokasi aktif
              </div>
            </div>
          </div>

          {/* 6-Status Booking Flow Pipeline Distribution */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Alur 6 Status Booking (Pipeline Flow)
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                    Urutan 1–6
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi riil seluruh entri BU berdasarkan tahap konversi dari Leads hingga Booking, Rescheduled, atau Cancelled.
                </p>
              </div>
              {filters.status && filters.status !== 'all' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Filter Aktif:</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
                    #{STATUS_ORDER[filters.status as BookingStatus] || ''} {filters.status}
                  </span>
                  <button
                    onClick={() => onFilterChange({ status: 'all' })}
                    className="text-xs text-slate-600 hover:text-slate-900 underline ml-1 cursor-pointer"
                  >
                    Reset Filter Status
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {ALL_BOOKING_STATUSES.map((st) => {
                const conf = BOOKING_STATUS_CONFIG[st];
                const count = data.statusBreakdown?.[st] || 0;
                const percentage =
                  data.totalBUEntries > 0 ? ((count / data.totalBUEntries) * 100).toFixed(1) : '0.0';
                const isSelected = filters.status === st;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onFilterChange({ status: isSelected ? 'all' : st })}
                    className={`p-3 rounded-lg border text-left transition-all relative cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-slate-800 text-slate-200'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        #{conf.order}
                      </span>
                      <span
                        className={`text-[10px] font-mono tabular-nums ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                      title={conf.label}
                    >
                      {conf.label}
                    </div>

                    <div className="mt-1 flex items-baseline gap-1">
                      <span
                        className={`text-xl font-bold font-mono tabular-nums ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {count.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        entri
                      </span>
                    </div>

                    <div
                      className={`mt-2 text-[10px] line-clamp-2 leading-tight ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                      title={conf.description}
                    >
                      {conf.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-Column Deep-Dive Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Locations Snapshot */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Lokasi dengan Leads Terbanyak
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Agregasi berdasarkan nama lokasi standar
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('locations')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100 pb-2">
                      <th className="pb-2 font-medium">Lokasi</th>
                      <th className="pb-2 font-medium">Center Terdekat</th>
                      <th className="pb-2 font-medium text-right">Leads</th>
                      <th className="pb-2 font-medium text-right">Booking</th>
                      <th className="pb-2 font-medium text-right">Rasio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topLocations.map((loc) => (
                      <tr key={loc.locationId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 font-medium text-slate-900 max-w-[180px] truncate">
                          {loc.locationName === 'Unknown Location' ? 'Belum Terpetakan' : loc.locationName}
                        </td>
                        <td className="py-2.5 text-slate-600 max-w-[140px] truncate">
                          {loc.center === 'Unassigned Center' ? 'Center Belum Diisi' : loc.center}
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
                    Peringkat Field EC (Berdasarkan Booking)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar EC dengan konfirmasi Booking terbanyak
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('ec-performance')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  <span>Lihat Semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100 pb-2">
                      <th className="pb-2 font-medium w-8">#</th>
                      <th className="pb-2 font-medium">Nama EC</th>
                      <th className="pb-2 font-medium">Center Utama</th>
                      <th className="pb-2 font-medium text-right">Leads</th>
                      <th className="pb-2 font-medium text-right">Booking</th>
                      <th className="pb-2 font-medium text-right">Rasio</th>
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
                        </td>
                        <td className="py-2.5 text-slate-600 max-w-[140px] truncate">
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
