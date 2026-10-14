import React, { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Users,
  ShieldCheck,
  Menu,
  X,
  RefreshCw,
  Sliders,
  ChevronRight,
  Database,
  Lock,
} from 'lucide-react';
import { EnvironmentBanner } from '../common/EnvironmentBanner';
import { SimulationOptions } from '../../services/dashboardService';

export type DashboardTab = 'overview' | 'locations' | 'ec-performance' | 'data-quality';

interface DashboardLayoutProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: React.ReactNode;
  lastUpdated: string | null;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  simulationOptions: SimulationOptions;
  onUpdateSimulation: (opts: Partial<SimulationOptions>) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
  lastUpdated,
  onRefreshData,
  isRefreshing = false,
  simulationOptions,
  onUpdateSimulation,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);

  const navItems: { id: DashboardTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'locations', label: 'Location Performance', icon: MapPin },
    { id: 'ec-performance', label: 'EC Performance', icon: Users },
    { id: 'data-quality', label: 'Data Quality & Pipeline', icon: ShieldCheck },
  ];

  const getBreadcrumbName = () => {
    switch (activeTab) {
      case 'overview':
        return 'Overview';
      case 'locations':
        return 'Location Performance';
      case 'ec-performance':
        return 'EC Performance';
      case 'data-quality':
        return 'Data Quality & Pipeline Audit';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Environment & Compliance Banner */}
      <EnvironmentBanner
        lastUpdated={lastUpdated}
        onOpenAudit={() => onTabChange('data-quality')}
      />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Mobile Sidebar Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation (260px) */}
        <aside
          className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Brand Wordmark & Department Identifier */}
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900">
                Sparks Field Sales
              </span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Internal Dashboard
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-md"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            <div className="px-2 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Analytics & Reports
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer: Security & Scope Notice */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Internal Staff Access</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Customer personal data is excluded. Connects to verified Apps Script endpoint upon audit completion.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar Contract: Breadcrumb Trail — Actions */}
          <header className="h-16 px-4 lg:px-8 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0 sticky top-0 z-20">
            {/* Zone 1: Mobile toggle & Breadcrumb Trail */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 truncate">
                <span className="text-slate-600 hidden sm:inline">Sparks Field Sales</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                <span className="text-slate-900 font-semibold truncate">{getBreadcrumbName()}</span>
              </div>
            </div>

            {/* Zone 2: Actions & Testing Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Testing Simulator Toggle */}
              <button
                onClick={() => setShowSimModal(!showSimModal)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                title="Configure Mock Simulation States"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">State Simulator</span>
              </button>

              {/* Data Refresh Action */}
              <button
                onClick={onRefreshData}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sync Data</span>
              </button>
            </div>
          </header>

          {/* Page Body Viewport */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* State Simulator Modal/Drawer for Reviewing Loading, Error, and Empty states */}
      {showSimModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Data Quality & State Simulator
                </h3>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Verify how the application gracefully handles various data conditions (loading, empty, or error states) prior to production Apps Script connection.
            </p>

            <div className="space-y-3 pt-1">
              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-slate-900">Simulate Network Error</div>
                  <div className="text-[11px] text-slate-500">Triggers error state and retry prompt</div>
                </div>
                <input
                  type="checkbox"
                  checked={simulationOptions.forceError || false}
                  onChange={(e) => onUpdateSimulation({ forceError: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-slate-900">Simulate Empty Records</div>
                  <div className="text-[11px] text-slate-500">Displays zero-state placeholders</div>
                </div>
                <input
                  type="checkbox"
                  checked={simulationOptions.forceEmpty || false}
                  onChange={(e) => onUpdateSimulation({ forceEmpty: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-500"
                />
              </label>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-900">Simulated Network Latency</span>
                  <span className="font-mono text-slate-600 tabular-nums">
                    {simulationOptions.latencyMs || 0}ms
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  value={simulationOptions.latencyMs || 0}
                  onChange={(e) => onUpdateSimulation({ latencyMs: Number(e.target.value) })}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onUpdateSimulation({ forceError: false, forceEmpty: false, latencyMs: 300 });
                  setShowSimModal(false);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-md"
              >
                Reset Defaults
              </button>
              <button
                onClick={() => {
                  setShowSimModal(false);
                  onRefreshData();
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
              >
                Apply & Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
