/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DashboardLayout, DashboardTab } from './components/layout/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { LocationPerformancePage } from './pages/LocationPerformancePage';
import { EcPerformancePage } from './pages/EcPerformancePage';
import { DataQualityPage } from './pages/DataQualityPage';
import { DashboardFilters } from './types/dashboard';
import {
  SimulationOptions,
  setSimulationOptions,
  getSimulationOptions,
} from './services/dashboardService';

const DEFAULT_FILTERS: DashboardFilters = {
  center: 'all',
  dateRange: 'this_month',
  ecId: 'all',
  locationId: 'all',
  status: 'all',
  searchQuery: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [lastUpdated, setLastUpdated] = useState<string | null>(new Date().toISOString());
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simOptions, setSimOptions] = useState<SimulationOptions>(getSimulationOptions());

  const handleFilterChange = (newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setLastUpdated(new Date().toISOString());
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleUpdateSimulation = (opts: Partial<SimulationOptions>) => {
    setSimulationOptions(opts);
    setSimOptions((prev) => ({ ...prev, ...opts }));
  };

  const isMock = simOptions.enabled;
  const isError = simOptions.enabled && Boolean(simOptions.forceError);
  const sourceDescription = isError
    ? 'Koneksi Gagal (Simulasi)'
    : isMock
      ? 'Simulasi Mock Data'
      : 'Data Aktual — Google Sheets';

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      lastUpdated={lastUpdated}
      onRefreshData={handleRefreshData}
      isRefreshing={isRefreshing}
      simulationOptions={simOptions}
      onUpdateSimulation={handleUpdateSimulation}
      sourceDescription={sourceDescription}
      isError={isError}
      isMock={isMock}
    >
      {activeTab === 'overview' && (
        <OverviewPage
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onNavigateTab={(tab) => setActiveTab(tab)}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'locations' && (
        <LocationPerformancePage
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'ec-performance' && (
        <EcPerformancePage
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          refreshTrigger={refreshTrigger}
        />
      )}

      {activeTab === 'data-quality' && (
        <DataQualityPage
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          lastUpdated={lastUpdated}
          onRefreshData={handleRefreshData}
          simulationOptions={simOptions}
          onUpdateSimulation={handleUpdateSimulation}
          refreshTrigger={refreshTrigger}
        />
      )}
    </DashboardLayout>
  );
}
