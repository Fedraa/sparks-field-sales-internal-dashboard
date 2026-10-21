import React from 'react';
import { Filter, Search, RotateCcw, Calendar } from 'lucide-react';
import { DashboardFilters, DateRangePreset, ALL_BOOKING_STATUSES, STATUS_ORDER } from '../../types/dashboard';
import { MOCK_CENTERS, MOCK_ECS, MOCK_LOCATIONS } from '../../data/mockFieldSalesData';

interface DashboardFilterBarProps {
  filters: DashboardFilters;
  onFilterChange: (newFilters: Partial<DashboardFilters>) => void;
  onResetFilters: () => void;
  showLocationFilter?: boolean;
  showEcFilter?: boolean;
  showStatusFilter?: boolean;
  centerOptions?: string[];
  locationOptions?: string[];
  ecOptions?: string[];
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  showLocationFilter = true,
  showEcFilter = true,
  showStatusFilter = true,
  centerOptions,
  locationOptions,
  ecOptions,
}) => {
  const isFiltered =
    filters.center !== 'all' ||
    filters.dateRange !== 'this_month' ||
    filters.ecId !== 'all' ||
    filters.locationId !== 'all' ||
    (filters.status && filters.status !== 'all') ||
    filters.searchQuery !== '';

  const activeCenters = centerOptions && centerOptions.length > 0 ? centerOptions : MOCK_CENTERS;
  const activeLocations = locationOptions && locationOptions.length > 0 ? locationOptions : MOCK_LOCATIONS.map(l => l.locationName);
  const activeEcs = ecOptions && ecOptions.length > 0 ? ecOptions : MOCK_ECS.map(e => e.ecName);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Side: Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters</span>
          </div>

          {/* Center Selector (Center Terdekat) */}
          <div className="flex items-center">
            <select
              aria-label="Filter by Center"
              value={filters.center}
              onChange={(e) => onFilterChange({ center: e.target.value })}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">Semua Center</option>
              {activeCenters.map((center) => (
                <option key={center} value={center}>
                  {center}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset Selector */}
          <div className="flex items-center">
            <div className="relative">
              <select
                aria-label="Filter by Date Range"
                value={filters.dateRange}
                onChange={(e) => onFilterChange({ dateRange: e.target.value as DateRangePreset })}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md pl-7 pr-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors cursor-pointer"
              >
                <option value="today">Hari Ini (Today)</option>
                <option value="last_7_days">7 Hari Terakhir</option>
                <option value="last_30_days">30 Hari Terakhir</option>
                <option value="this_month">Bulan Ini (MTD)</option>
                <option value="last_month">Bulan Lalu</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Location Selector */}
          {showLocationFilter && (
            <div className="flex items-center">
              <select
                aria-label="Filter by Location"
                value={filters.locationId}
                onChange={(e) => onFilterChange({ locationId: e.target.value })}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors max-w-[200px] truncate cursor-pointer"
              >
                <option value="all">Semua Lokasi</option>
                {activeLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* EC Selector */}
          {showEcFilter && (
            <div className="flex items-center">
              <select
                aria-label="Filter by Field EC"
                value={filters.ecId}
                onChange={(e) => onFilterChange({ ecId: e.target.value })}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors max-w-[180px] truncate cursor-pointer"
              >
                <option value="all">Semua Field EC</option>
                {activeEcs.map((ec) => (
                  <option key={ec} value={ec}>
                    {ec}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Booking Status Flow Selector (6 Statuses) */}
          {showStatusFilter && (
            <div className="flex items-center">
              <select
                aria-label="Filter by Booking Status"
                value={filters.status || 'all'}
                onChange={(e) => onFilterChange({ status: e.target.value })}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors max-w-[190px] truncate cursor-pointer"
              >
                <option value="all">Semua Status (6 Alur)</option>
                {ALL_BOOKING_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_ORDER[st]}. {st}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Search and Reset */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari lokasi, EC, center..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2.5 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              title="Reset all filters"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
