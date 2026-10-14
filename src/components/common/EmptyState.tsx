import React from 'react';
import { Inbox, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No data matches the selected Center, EC, or Date Range filters.',
  onResetFilters,
  actionLabel = 'Reset Filters',
}) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-12 text-center flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {onResetFilters && (
        <button
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
