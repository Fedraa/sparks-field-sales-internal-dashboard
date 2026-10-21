import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  FileSpreadsheet,
  MapPin,
  Building,
  Target,
  Sliders,
  Search,
  Filter,
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  PipelineAuditRecord,
  DataState,
  DataQualityMetrics,
  DataQualityFollowUpRecord,
  DashboardFilters,
} from '../types/dashboard';
import {
  fetchDataQualityStatus,
  fetchDetailedDataQuality,
  fetchFilterOptions,
  SimulationOptions,
} from '../services/dashboardService';
import { DashboardFilterBar } from '../components/filters/DashboardFilterBar';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface DataQualityPageProps {
  filters?: DashboardFilters;
  onFilterChange?: (filters: Partial<DashboardFilters>) => void;
  onResetFilters?: () => void;
  lastUpdated: string | null;
  onRefreshData: () => void;
  simulationOptions: SimulationOptions;
  onUpdateSimulation: (opts: Partial<SimulationOptions>) => void;
  refreshTrigger: number;
}

type FollowUpFilterTab = 'all_action' | 'unmapped_only' | 'unassigned_center_only' | 'all';

export const DataQualityPage: React.FC<DataQualityPageProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  lastUpdated,
  onRefreshData,
  simulationOptions,
  onUpdateSimulation,
  refreshTrigger,
}) => {
  const [auditState, setAuditState] = useState<DataState<PipelineAuditRecord[]>>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
    isMock: false,
    sourceDescription: 'Memuat...',
  });

  const [qualityState, setQualityState] = useState<DataState<DataQualityMetrics>>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
    isMock: false,
    sourceDescription: 'Memuat...',
  });

  const [filterOptions, setFilterOptions] = useState<{
    centers: string[];
    locations: string[];
    ecs: string[];
  }>({ centers: [], locations: [], ecs: [] });

  const [activeTab, setActiveTab] = useState<FollowUpFilterTab>('all_action');
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const loadData = async () => {
    setAuditState((prev) => ({ ...prev, isLoading: true, error: null }));
    setQualityState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [auditRes, qualityRes, optionsRes] = await Promise.all([
        fetchDataQualityStatus(true),
        fetchDetailedDataQuality(filters, true),
        fetchFilterOptions(),
      ]);
      setAuditState(auditRes);
      setQualityState(qualityRes);
      setFilterOptions(optionsRes);
    } catch (err: any) {
      const errMsg = err.message || 'Gagal memverifikasi status kualitas data pipeline.';
      setAuditState({
        data: null,
        isLoading: false,
        error: errMsg,
        lastUpdated: null,
        isMock: false,
        sourceDescription: 'Koneksi Gagal',
      });
      setQualityState({
        data: null,
        isLoading: false,
        error: errMsg,
        lastUpdated: null,
        isMock: false,
        sourceDescription: 'Koneksi Gagal',
      });
    }
  };

  useEffect(() => {
    loadData();
    setCurrentPage(1);
  }, [filters, refreshTrigger]);

  // Filtered follow-up records based on active sub-tab and table search
  const filteredFollowUps = useMemo(() => {
    if (!qualityState.data) return [];
    let list = qualityState.data.followUpRecords;

    // 1. Tab filter
    if (activeTab === 'all_action') {
      list = list.filter((r) => !r.isLocationMapped || !r.hasCenter);
    } else if (activeTab === 'unmapped_only') {
      list = list.filter((r) => !r.isLocationMapped);
    } else if (activeTab === 'unassigned_center_only') {
      list = list.filter((r) => !r.hasCenter);
    }

    // 2. Local search query
    if (tableSearch.trim() !== '') {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.ec.toLowerCase().includes(q) ||
          r.locationDisplay.toLowerCase().includes(q) ||
          r.rawLocation.toLowerCase().includes(q) ||
          r.standardLocation.toLowerCase().includes(q) ||
          r.centerDisplay.toLowerCase().includes(q) ||
          r.centerNearest.toLowerCase().includes(q) ||
          (r.buCenter && r.buCenter.toLowerCase().includes(q)) ||
          (r.statusSummary && r.statusSummary.toLowerCase().includes(q)) ||
          r.matchStatus.toLowerCase().includes(q)
      );
    }

    return list;
  }, [qualityState.data, activeTab, tableSearch]);

  const totalPages = Math.ceil(filteredFollowUps.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredFollowUps.slice(start, start + rowsPerPage);
  }, [filteredFollowUps, currentPage]);

  if (qualityState.isLoading || auditState.isLoading) {
    return <LoadingState message="Memverifikasi integritas data kunjungan & status pipeline..." rows={6} />;
  }

  if (qualityState.error || auditState.error) {
    return (
      <ErrorState
        title="Koneksi Google Apps Script Terkendala"
        error={qualityState.error || auditState.error}
        onRetry={loadData}
      />
    );
  }

  const qData = qualityState.data!;
  const stages = auditState.data || [];

  return (
    <div className="space-y-6">
      {/* Page Title & Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Kualitas Data & Audit Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring kelengkapan data kunjungan, standardisasi lokasi booth, pengisian center, dan pipeline Google Sheets.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{qualityState.sourceDescription}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-mono">
            Sinkron: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Global Filter Bar (if filters passed from App) */}
      {filters && onFilterChange && onResetFilters && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Cakupan Filter Analisis Kualitas Data
            </span>
            <span className="text-[11px] text-slate-500">
              Metrik di bawah dihitung sesuai filter yang diterapkan
            </span>
          </div>
          <DashboardFilterBar
            filters={filters}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            centerOptions={filterOptions.centers}
            locationOptions={filterOptions.locations}
            ecOptions={filterOptions.ecs}
          />
        </div>
      )}

      {/* Bagian A: Ringkasan Kualitas Data (5 Metric Cards) */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-700" />
          <span>Ringkasan Kualitas Data Kunjungan</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Kunjungan */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium">Total Kunjungan</span>
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {qData.totalVisits.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {qData.totalBUEntries.toLocaleString()} entri BU dalam cakupan
            </div>
          </div>

          {/* Card 2: Lokasi Belum Terpetakan */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium">Lokasi Belum Terpetakan</span>
              <MapPin className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {qData.unmappedLocationCount.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] text-amber-700 font-medium">
              {qData.unmappedLocationPercentage}% (tetap valid dihitung)
            </div>
          </div>

          {/* Card 3: Kunjungan Tanpa Center */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium">Kunjungan Tanpa Center</span>
              <Building className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {qData.unassignedCenterCount.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {qData.unassignedCenterPercentage}% (kondisi opsional)
            </div>
          </div>

          {/* Card 4: Lokasi Terstandardisasi */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium">Lokasi Terstandardisasi</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {qData.standardizedLocationCount.toLocaleString()}
            </div>
            <div className="mt-2 text-[11px] text-emerald-700 font-medium">
              Cocok dengan database lokasi
            </div>
          </div>

          {/* Card 5: Persentase Lokasi Terstandardisasi */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-medium">Standardisasi Lokasi</span>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {qData.standardizedLocationPercentage}%
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Rasio lokasi terpetakan resmi
            </div>
          </div>
        </div>
      </div>

      {/* Bagian B: Distribusi Status Kualitas Data & Catatan Independensi Dimensi */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <span>Distribusi Status Kualitas Data (Dua Dimensi Independen)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dimensi 1: Status Pemetaan Lokasi */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Dimensi 1: Pemetaan Lokasi Booth
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  Total: {qData.totalVisits} kunjungan
                </span>
              </div>

              {/* Progress Bar Visualization */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex mb-3">
                <div
                  style={{ width: `${qData.standardizedLocationPercentage}%` }}
                  className="bg-emerald-600 transition-all duration-300"
                  title={`Terstandardisasi: ${qData.standardizedLocationCount} (${qData.standardizedLocationPercentage}%)`}
                />
                <div
                  style={{ width: `${qData.unmappedLocationPercentage}%` }}
                  className="bg-amber-400 transition-all duration-300"
                  title={`Belum Terpetakan: ${qData.unmappedLocationCount} (${qData.unmappedLocationPercentage}%)`}
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-slate-800 font-medium">Lokasi Terstandardisasi (Matched)</span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {qData.standardizedLocationCount} ({qData.standardizedLocationPercentage}%)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-slate-800 font-medium">Lokasi Belum Terpetakan</span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {qData.unmappedLocationCount} ({qData.unmappedLocationPercentage}%)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-slate-500 text-[11px]">
                  <span>Rincian Match Status:</span>
                  <span className="font-mono tabular-nums">
                    Matched: {qData.matchStatusBreakdown.matched} · Review: {qData.matchStatusBreakdown.review} · Unmatched: {qData.matchStatusBreakdown.unmatched}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <strong>Aturan Bisnis:</strong> Kunjungan dengan lokasi Belum Terpetakan tetap sah, dihitung dalam Total Kunjungan, dan seluruh entri Leads/Booking tetap dihitung ke performa EC.
            </div>
          </div>

          {/* Dimensi 2: Status Pengisian Center */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Dimensi 2: Pengisian Center Kunjungan
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  Total: {qData.totalVisits} kunjungan
                </span>
              </div>

              {/* Progress Bar Visualization */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex mb-3">
                <div
                  style={{ width: `${qData.assignedCenterPercentage}%` }}
                  className="bg-blue-600 transition-all duration-300"
                  title={`Center Terisi: ${qData.assignedCenterCount} (${qData.assignedCenterPercentage}%)`}
                />
                <div
                  style={{ width: `${qData.unassignedCenterPercentage}%` }}
                  className="bg-slate-300 transition-all duration-300"
                  title={`Center Belum Diisi: ${qData.unassignedCenterCount} (${qData.unassignedCenterPercentage}%)`}
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="text-slate-800 font-medium">Center Terisi (Assigned)</span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {qData.assignedCenterCount} ({qData.assignedCenterPercentage}%)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                    <span className="text-slate-800 font-medium">Center Belum Diisi (Unassigned)</span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {qData.unassignedCenterCount} ({qData.unassignedCenterPercentage}%)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-slate-500 text-[11px]">
                  <span>Pemisahan Konsep:</span>
                  <span>Center booth vs center kelas BU (independen)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <strong>Aturan Bisnis:</strong> Pengisian center booth bersifat opsional saat laporan dibuat. Kunjungan tanpa center booth merupakan kondisi yang diizinkan (74 kunjungan tanpa center booth memiliki center kelas di entri BU).
            </div>
          </div>
        </div>

        {/* Callout Independensi Kedua Dimensi (Non-Mutually Exclusive) */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 space-y-1">
            <div className="font-semibold">
              Klarifikasi Independensi Dimensi (Non-Mutually Exclusive):
            </div>
            <p className="leading-relaxed text-amber-900">
              Satu kunjungan dapat sekaligus memiliki lokasi yang belum terpetakan dan center yang belum diisi.
              Jangan menjumlahkan kedua kategori ({qData.unmappedLocationCount} + {qData.unassignedCenterCount}) secara langsung!
              Setelah deduplikasi identitas record yang aman, jumlah kunjungan unik yang memerlukan peninjauan (lokasi belum standar ATAU center belum diisi) adalah:
              <span className="font-bold font-mono tabular-nums ml-1 px-1.5 py-0.5 bg-amber-100 rounded text-amber-950">
                {qData.uniqueActionNeededCount} kunjungan
              </span>{' '}
              ({qData.totalVisits > 0 ? ((qData.uniqueActionNeededCount / qData.totalVisits) * 100).toFixed(1) : 0}% dari total).
            </p>
          </div>
        </div>
      </div>

      {/* Bagian C: Detail Data yang Perlu Ditindaklanjuti (Follow-Up Table) */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Detail Data Kunjungan yang Perlu Ditindaklanjuti
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pola input lapangan untuk membantu evaluasi pemetaan lokasi dan kelengkapan center (bebas data pribadi pelanggan).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari EC, lokasi, atau center..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2.5 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Sub-Tabs / Filter Segments */}
        <div className="px-4 py-2 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setActiveTab('all_action');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'all_action'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Semua Perlu Ditinjau ({qData.uniqueActionNeededCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('unmapped_only');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'unmapped_only'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Lokasi Belum Terpetakan ({qData.unmappedLocationCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('unassigned_center_only');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'unassigned_center_only'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Center Belum Diisi ({qData.unassignedCenterCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Semua Record ({qData.totalVisits})
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Strict Allowlist: PII Pelanggan Disaring 100%</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4 w-12">No</th>
                <th className="py-2.5 px-4">Waktu Kunjungan</th>
                <th className="py-2.5 px-4">Field EC</th>
                <th className="py-2.5 px-4">Nama Lokasi Terinput / Standar</th>
                <th className="py-2.5 px-4">Status Pemetaan</th>
                <th className="py-2.5 px-4">Status Center</th>
                <th className="py-2.5 px-4">Center Terdekat</th>
                <th className="py-2.5 px-4 text-right">Entri BU Terkait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Tidak ada record yang sesuai dengan filter atau kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-400 tabular-nums">
                      {(currentPage - 1) * rowsPerPage + idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                      {row.timestamp ? (
                        <div>
                          <div>{new Date(row.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[10px] text-slate-400">{new Date(row.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {row.ec}
                    </td>
                    <td className="py-2.5 px-4 max-w-[220px]">
                      {!row.isLocationMapped ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-semibold ${
                              row.locationDisplay === 'Lokasi Belum Sesuai'
                                ? 'text-amber-700 italic'
                                : 'text-slate-900'
                            }`}
                          >
                            {row.locationDisplay}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            Perlu Ditinjau
                          </span>
                        </div>
                      ) : (
                        <div className="font-semibold text-slate-900 truncate">
                          {row.locationDisplay}
                        </div>
                      )}
                      {row.rawLocation && row.rawLocation.trim() !== '' && row.rawLocation !== row.standardLocation && (
                        <div className="text-[10px] text-slate-400 truncate">
                          Input mentah: {row.rawLocation}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium ${
                          row.matchStatus === 'Matched'
                            ? 'text-emerald-700'
                            : row.matchStatus === 'Review'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                        }`}
                      >
                        {row.matchStatus}
                        {row.matchMethod && row.matchMethod !== '-' ? ` (${row.matchMethod})` : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div>
                        <span
                          className={`text-[11px] font-medium ${
                            row.hasCenter ? 'text-slate-800' : 'text-slate-500 italic'
                          }`}
                        >
                          {row.centerDisplay}
                        </span>
                        {!row.hasCenter && row.buCenter && row.buCenter !== '-' && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            Kelas BU: {row.buCenter}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {row.centerNearest}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{row.buEntriesCount} BU</div>
                      <div
                        className="text-[10px] flex items-center justify-end gap-1 flex-wrap mt-0.5"
                        title={row.statusSummary || `Leads: ${row.leadsCount}, Booking: ${row.bookingCount}`}
                      >
                        {row.leadsCount > 0 && (
                          <span className="px-1 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200">
                            L: {row.leadsCount}
                          </span>
                        )}
                        {row.bookingCount > 0 && (
                          <span className="px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            B: {row.bookingCount}
                          </span>
                        )}
                        {row.statusBreakdown?.['Potential Booking'] ? (
                          <span className="px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Pot: {row.statusBreakdown['Potential Booking']}
                          </span>
                        ) : null}
                        {row.statusBreakdown?.['FU Booking'] ? (
                          <span className="px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            FU: {row.statusBreakdown['FU Booking']}
                          </span>
                        ) : null}
                        {row.statusBreakdown?.['Rescheduled'] ? (
                          <span className="px-1 py-0.2 rounded bg-orange-50 text-orange-700 border border-orange-200">
                            Resched: {row.statusBreakdown['Rescheduled']}
                          </span>
                        ) : null}
                        {row.statusBreakdown?.['Cancelled'] ? (
                          <span className="px-1 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Canc: {row.statusBreakdown['Cancelled']}
                          </span>
                        ) : null}
                        {row.buEntriesCount === 0 && <span className="text-slate-400">0 entri</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Menampilkan <span className="font-semibold font-mono tabular-nums">{paginatedRows.length}</span> dari{' '}
            <span className="font-semibold font-mono tabular-nums">{filteredFollowUps.length}</span> record
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono tabular-nums">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bagian D: Status Pipeline Aktual (Architecture & Component Verification) */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-700" />
          <span>Status Pipeline Ingesti & Kepatuhan Keamanan</span>
        </h2>

        {/* Architecture Flow Diagram */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Alur Data Aktual & Titik Enkapsulasi Keamanan
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Google Sheets adalah single source of truth. Apps Script membaca data mentah, dan server Express menyaring seluruh PII sebelum dikirim ke dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {/* Node 1: Google Sheets */}
            <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                    Tahap 01 (Sumber Data)
                  </span>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                </div>
                <h4 className="font-semibold text-sm text-emerald-950">Google Sheets</h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Tab <span className="font-mono font-medium">Clean_EC_Visits</span>. Diperbarui secara berkala oleh fungsi sinkronisasi EC.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-200 text-[11px] text-emerald-900 font-medium">
                Status: Terhubung & Aktif ({qData.totalVisits} kunjungan)
              </div>
            </div>

            {/* Node 2: Google Apps Script */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    Tahap 02 (Middleware API)
                  </span>
                  <Layers className="w-4 h-4 text-slate-700" />
                </div>
                <h4 className="font-semibold text-sm text-slate-900">Apps Script (EC_Dashboard_API)</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Deployment Web App <span className="font-mono">doPost(e)</span> dengan hak akses <span className="font-medium">Anyone</span>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-600 font-medium">
                Status: HTTP 200 OK (JSON Valid)
              </div>
            </div>

            {/* Node 3: Internal Dashboard */}
            <div className="border border-slate-900 rounded-lg p-4 bg-slate-900 text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Tahap 03 (Frontend Dashboard)
                  </span>
                  <ShieldCheck className="w-4 h-4 text-slate-300" />
                </div>
                <h4 className="font-semibold text-sm text-white">Internal Dashboard UI</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Menyajikan metrik agregat, tabel lokasi, dan performa EC tanpa mengekspos PII pelanggan.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300 font-medium">
                Status: Mode Operasional Aktual
              </div>
            </div>
          </div>
        </div>

        {/* Integration Audit Checklist */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Daftar Verifikasi Komponen & Kepatuhan Keamanan
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Status audit integrasi data dan proteksi data sensitif.
          </p>

          <div className="space-y-3">
            {stages.map((stg, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">{stg.name}</div>
                    <span className="text-[11px] font-mono text-slate-500">{stg.lastChecked}</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">{stg.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bagian E: Pengujian Ketahanan UI (State Simulator Controls) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Pengujian Ketahanan UI (State Simulator)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Uji responsivitas antarmuka saat simulasi gangguan jaringan atau kondisi kosong.
            </p>
          </div>
          <button
            onClick={onRefreshData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tarik Data Terbaru</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => {
              onUpdateSimulation({ enabled: false, forceError: false, forceEmpty: false, latencyMs: 0 });
              onRefreshData();
            }}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              !simulationOptions.enabled
                ? 'border-emerald-600 bg-emerald-50/50 font-semibold'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-emerald-950 font-medium">Mode Data Aktual (Default)</div>
            <div className="text-slate-600 text-[11px] mt-1">Mengambil data riil dari Google Sheets</div>
          </button>

          <button
            onClick={() => {
              onUpdateSimulation({ enabled: true, forceError: true, forceEmpty: false });
              onRefreshData();
            }}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              simulationOptions.enabled && simulationOptions.forceError
                ? 'border-red-600 bg-red-50 text-red-900 font-semibold'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-slate-900 font-medium">Uji Error State</div>
            <div className="text-slate-500 text-[11px] mt-1">Simulasikan kegagalan respons endpoint</div>
          </button>

          <button
            onClick={() => {
              onUpdateSimulation({ enabled: true, forceError: false, forceEmpty: true });
              onRefreshData();
            }}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              simulationOptions.enabled && simulationOptions.forceEmpty
                ? 'border-slate-900 bg-slate-50 font-semibold'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-slate-900 font-medium">Uji Empty State</div>
            <div className="text-slate-500 text-[11px] mt-1">Simulasikan payload kosong (0 record)</div>
          </button>
        </div>
      </div>
    </div>
  );
};
