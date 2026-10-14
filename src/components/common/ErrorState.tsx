import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  error?: string | null;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Access Error',
  error = 'An unexpected error occurred while communicating with the data service.',
  onRetry,
}) => {
  return (
    <div className="w-full bg-red-50/50 border border-red-200 rounded-lg p-8 text-center flex flex-col items-center justify-center">
      <div className="w-11 h-11 rounded-lg bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-red-900 mb-1">{title}</h3>
      <p className="text-sm text-red-700 max-w-lg mb-5 font-mono text-xs bg-red-100/60 py-2 px-3 rounded border border-red-200">
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};
