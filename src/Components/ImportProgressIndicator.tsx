// ============================================
// Import Progress Indicator Component
// ============================================
import { Loader2 } from 'lucide-react';
import type { ImportProgress } from '../types';

interface ImportProgressIndicatorProps {
  progress: ImportProgress;
}

export default function ImportProgressIndicator({ progress }: ImportProgressIndicatorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 className="animate-spin text-blue-500" size={24} />
        <h3 className="text-lg font-semibold text-slate-800">Importing...</h3>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-600">
          <span>{progress.currentOperation}</span>
          <span>{progress.percentage}%</span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        <div className="text-center text-sm text-slate-500">
          {progress.current} of {progress.total} operations
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Please don't close this window while the import is in progress.
        </p>
      </div>
    </div>
  );
}
