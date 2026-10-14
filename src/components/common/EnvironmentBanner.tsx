import React from 'react';
import { Database, ShieldCheck, HelpCircle } from 'lucide-react';

interface EnvironmentBannerProps {
  lastUpdated?: string | null;
  onOpenAudit?: () => void;
}

export const EnvironmentBanner: React.FC<EnvironmentBannerProps> = ({
  lastUpdated,
  onOpenAudit,
}) => {
  return (
    <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 font-semibold text-amber-950">
          <Database className="w-3.5 h-3.5 text-amber-700" />
          <span>Mock Data — Not Connected</span>
        </div>
        <span className="text-amber-500" aria-hidden="true">·</span>
        <span className="text-amber-800">
          Apps Script Endpoint Audit Pending
        </span>
        <span className="text-amber-500" aria-hidden="true">·</span>
        <div className="flex items-center gap-1 text-emerald-800 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Customer PII Excluded</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-amber-700 tabular-nums">
            Sync Check: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {onOpenAudit && (
          <button
            onClick={onOpenAudit}
            className="inline-flex items-center gap-1 text-amber-900 underline hover:text-amber-950 font-medium"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Audit Pipeline Info</span>
          </button>
        )}
      </div>
    </div>
  );
};
