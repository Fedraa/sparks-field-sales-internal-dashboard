import React from 'react';
import { Filter, Search, RotateCcw, Calendar } from 'lucide-react';
import { DashboardFilters, DateRangePreset } from '../../types/dashboard';
import { MOCK_CENTERS, MOCK_ECS, MOCK_LOCATIONS } from '../../data/mockFieldSalesData';

interface DashboardFilterBarProps {
  filters: DashboardFilters;
  onFilterChange: (newFilters: Partial<DashboardFilters>) => void;
  onResetFilters: () => void;
  showLocationFilter?: boolean;
  showEcFilter?: boolean;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  showLocationFilter = true,
  showEcFilter = true,
}) => {
  const isFiltered =
    filters.center !== 'all' ||
    filters.dateRange !== 'this_month' ||
    filters.ecId !== 'all' ||
    filters.locationId !== 'all' ||
    filters.searchQuery !== '';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Side: Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters</span>
          </div>

          {/* Center Selector */}
          <div className="flex items-center">
            <select
              aria-label="Filter by Center"
              value={filters.center}
              onChange={(e) => onFilterChange({ center: e.target.value })}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors cursor-pointer"
            >
              <option value="all">All Centers</option>
              {MOCK_CENTERS.map((center) => (
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
                <option value="today">Today (Live)</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_month">This Month (MTD)</option>
                <option value="last_month">Last Month</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Location Selector (Optional) */}
          {showLocationFilter && (
            <div className="flex items-center">
              <select
                aria-label="Filter by Location"
                value={filters.locationId}
                onChange={(e) => onFilterChange({ locationId: e.target.value })}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors max-w-[180px] truncate cursor-pointer"
              >
                <option value="all">All Locations</option>
                {MOCK_LOCATIONS.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {loc.locationName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* EC Selector (Optional) */}
          {showEcFilter && (
            <div className="flex items-center">
              <select
                aria-label="Filter by Field EC"
                value={filters.ecId}
                onChange={(e) => onFilterChange({ ecId: e.target.value })}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 transition-colors max-w-[170px] truncate cursor-pointer"
              >
                <option value="all">All Field ECs</option>
                {MOCK_ECS.map((ec) => (
                  <option key={ec.ecId} value={ec.ecId}>
                    {ec.ecName} ({ec.ecCode})
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
              placeholder="Search location or EC..."
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
