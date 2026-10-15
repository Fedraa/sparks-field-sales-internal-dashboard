import React from 'react';
import { Database, ShieldCheck, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EnvironmentBannerProps {
  lastUpdated?: string | null;
  onOpenAudit?: () => void;
  sourceDescription?: string;
  isError?: boolean;
  isMock?: boolean;
}

export const EnvironmentBanner: React.FC<EnvironmentBannerProps> = ({
  lastUpdated,
  onOpenAudit,
  sourceDescription = 'Data Aktual — Google Sheets',
  isError = false,
  isMock = false,
}) => {
  // Styling according to real data state
  const bgClass = isError
    ? 'bg-red-50 border-red-200 text-red-900'
    : isMock
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : 'bg-emerald-50/90 border-emerald-200 text-emerald-950';

  const dotClass = isError
    ? 'text-red-400'
    : isMock
      ? 'text-amber-400'
      : 'text-emerald-500';

  return (
    <div className={`${bgClass} border-b px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 transition-colors`}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 font-semibold">
          {isError ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          ) : isMock ? (
            <Database className="w-3.5 h-3.5 text-amber-700" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          )}
          <span>{sourceDescription}</span>
        </div>

        <span className={dotClass} aria-hidden="true">·</span>

        <span className={isError ? 'text-red-800' : isMock ? 'text-amber-800' : 'text-emerald-900'}>
          {isError
            ? 'Endpoint Apps Script Tidak Merespons'
            : isMock
              ? 'Mode Simulasi Fixture (Testing)'
              : 'Tab Clean_EC_Visits via Express Proxy'}
        </span>

        <span className={dotClass} aria-hidden="true">·</span>

        <div className="flex items-center gap-1 font-medium text-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Customer PII Excluded (Strict Allowlist)</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="tabular-nums font-mono text-[11px] opacity-80">
            Sinkronisasi: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        {onOpenAudit && (
          <button
            onClick={onOpenAudit}
            className="inline-flex items-center gap-1 underline hover:opacity-100 opacity-80 font-medium"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Info Pipeline</span>
          </button>
        )}
      </div>
    </div>
  );
};
