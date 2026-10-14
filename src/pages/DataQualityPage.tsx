import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Database,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Sliders,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { PipelineAuditRecord, DataState } from '../types/dashboard';
import {
  fetchDataQualityStatus,
  SimulationOptions,
} from '../services/dashboardService';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface DataQualityPageProps {
  lastUpdated: string | null;
  onRefreshData: () => void;
  simulationOptions: SimulationOptions;
  onUpdateSimulation: (opts: Partial<SimulationOptions>) => void;
  refreshTrigger: number;
}

export const DataQualityPage: React.FC<DataQualityPageProps> = ({
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
    isMock: true,
  });

  const loadData = async () => {
    setAuditState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetchDataQualityStatus();
      setAuditState(res);
    } catch {
      setAuditState({
        data: null,
        isLoading: false,
        error: 'Failed to retrieve data pipeline audit records.',
        lastUpdated: null,
        isMock: true,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  if (auditState.isLoading) {
    return <LoadingState message="Auditing pipeline stages and data boundaries..." rows={4} />;
  }

  if (auditState.error) {
    return <ErrorState error={auditState.error} onRetry={loadData} />;
  }

  const stages = auditState.data || [];

  return (
    <div className="space-y-6">
      {/* Page Title & Mission */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Data Quality & Pipeline Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Architecture status, Apps Script integration readiness, and customer PII exclusion audit.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Environment: Pre-Production Scaffold</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            Last Sync Check: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Architecture Flow Diagram */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Planned Data Architecture & Ingestion Flow
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Google Sheets remains the primary source of truth. The Internal Dashboard will consume verified aggregates via Google Apps Script.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Node 1: Google Sheets */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Stage 01
                </span>
                <Database className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900">Google Sheets</h3>
              <p className="text-xs text-slate-600 mt-1">
                Primary source of truth for retail field sales records.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
              Audit Status: <span className="font-medium text-slate-700">Schema Review Pending</span>
            </div>
          </div>

          {/* Node 2: Google Apps Script */}
          <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                  Stage 02 (Middleware)
                </span>
                <Layers className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="font-semibold text-sm text-amber-950">Google Apps Script</h3>
              <p className="text-xs text-amber-900 mt-1">
                Authorized Web App / API. Endpoints and serialization methods not yet audited.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/80 text-[11px] text-amber-900">
              Endpoint Status: <span className="font-medium">No Scraping · Awaiting Audit</span>
            </div>
          </div>

          {/* Node 3: Internal Dashboard */}
          <div className="border border-slate-900 rounded-lg p-4 bg-slate-900 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Stage 03 (Front)
                </span>
                <ShieldCheck className="w-4 h-4 text-slate-300" />
              </div>
              <h3 className="font-semibold text-sm text-white">Internal Dashboard</h3>
              <p className="text-xs text-slate-300 mt-1">
                Modular React/TS UI displaying aggregated Leads & Bookings without customer PII.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-300">
              Current Mode: <span className="font-medium text-white">Mock Fixtures Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Readiness Checklist */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Pipeline Verification & Isolation Checklist
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Guarantees established for the initial scaffold phase.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-slate-900">Separate Repository & Codebase Boundary</div>
              <div className="text-slate-600 mt-0.5">
                This project remains completely independent and does not modify, replace, or interfere with the existing EC-facing application.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-slate-900">Customer PII Excluded</div>
              <div className="text-slate-600 mt-0.5">
                No customer personal information (parent names, phone numbers, child names, DOBs) is stored, requested, or rendered in internal analytics.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-slate-900">No Hardcoded Credentials or Invented Endpoints</div>
              <div className="text-slate-600 mt-0.5">
                No mock passwords or fabricated production endpoints. The data-access service is structured to adopt the verified endpoint seamlessly.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/30">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-amber-950">Pending: Apps Script Contract Audit</div>
              <div className="text-amber-800 mt-0.5">
                Production calculations and live data flow will be activated once the Apps Script methods and schema definitions are audited.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive State Verification Panel */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Interactive State Verification
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Test how the dashboard renders under different network and data states (Section 5 requirements).
            </p>
          </div>
          <button
            onClick={onRefreshData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Trigger Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => {
              onUpdateSimulation({ forceError: false, forceEmpty: false, latencyMs: 250 });
              onRefreshData();
            }}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              !simulationOptions.forceError && !simulationOptions.forceEmpty
                ? 'border-slate-900 bg-slate-50 font-semibold'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-slate-900 font-medium">Standard Mock State</div>
            <div className="text-slate-500 text-[11px] mt-1">Normal data response</div>
          </button>

          <button
            onClick={() => {
              onUpdateSimulation({ forceError: true, forceEmpty: false });
              onRefreshData();
            }}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              simulationOptions.forceError
                ? 'border-red-600 bg-red-50 text-red-900 font-semibold'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-slate-900 font-medium">Simulate Error State</div>
            <div className="text-slate-500 text-[11px] mt-1">Simulates network/proxy failure</div>
          </button>

          <button
            onClick={() => {
              onUpdateSimulation({ forceError: false, forceEmpty: true });
              onRefreshData();
            }}
            className={`p-3 rounded-lg border text-left text-xs transition-colors ${
              simulationOptions.forceEmpty
                ? 'border-slate-900 bg-slate-50 font-semibold'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-slate-900 font-medium">Simulate Empty State</div>
            <div className="text-slate-500 text-[11px] mt-1">Simulates 0 records found</div>
          </button>
        </div>
      </div>
    </div>
  );
};
