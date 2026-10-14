import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading dashboard metrics...',
  rows = 4,
}) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-8 space-y-4">
      <div className="flex items-center justify-center gap-3 text-slate-600 mb-6">
        <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
        <span className="text-sm font-medium">{message}</span>
      </div>

      {/* Structured skeleton lines matching high-density table layout */}
      <div className="space-y-3 pt-2">
        <div className="h-4 bg-slate-100 rounded w-1/3 animate-pulse" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-9 bg-slate-50 border border-slate-100 rounded flex-1 animate-pulse" />
            <div className="h-9 bg-slate-50 border border-slate-100 rounded w-24 animate-pulse hidden sm:block" />
            <div className="h-9 bg-slate-50 border border-slate-100 rounded w-28 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};
