// ============================================
// Import Results Summary Component
// ============================================
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Package } from 'lucide-react';
import type { ImportResult } from '../types';

interface ImportResultsSummaryProps {
  result: ImportResult;
  onClose: () => void;
  onImportAnother: () => void;
}

export default function ImportResultsSummary({
  result,
  onClose,
  onImportAnother,
}: ImportResultsSummaryProps) {
  const hasFailures = result.failed > 0;
  const hasPortfolios = result.portfoliosCreated.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="text-green-600" size={32} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Import Complete!</h3>
        <p className="text-slate-600">
          Your CSV data has been processed
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-green-700">{result.imported}</div>
          <div className="text-sm text-green-600 font-medium">Imported</div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="text-yellow-600" size={24} />
          </div>
          <div className="text-3xl font-bold text-yellow-700">{result.skipped}</div>
          <div className="text-sm text-yellow-600 font-medium">Skipped</div>
        </div>

        <div className={`${hasFailures ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} border-2 rounded-xl p-4 text-center`}>
          <div className="flex items-center justify-center mb-2">
            <XCircle className={hasFailures ? 'text-red-600' : 'text-slate-400'} size={24} />
          </div>
          <div className={`text-3xl font-bold ${hasFailures ? 'text-red-700' : 'text-slate-400'}`}>
            {result.failed}
          </div>
          <div className={`text-sm font-medium ${hasFailures ? 'text-red-600' : 'text-slate-400'}`}>
            Failed
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-6 space-y-4">
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp size={20} />
          Ticker Summary
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Created:</span>
            <span className="font-semibold text-slate-800">{result.tickersCreated} new</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Skipped:</span>
            <span className="font-semibold text-slate-800">{result.tickersSkipped} existing</span>
          </div>
        </div>

        {hasPortfolios && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h5 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
              <Package size={18} />
              Portfolios Created
            </h5>
            <div className="flex flex-wrap gap-2">
              {result.portfoliosCreated.map((portfolio) => (
                <span
                  key={portfolio}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {portfolio}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {hasFailures && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h5 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
            <XCircle size={18} />
            Failed Imports
          </h5>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {result.details
              .filter(d => d.status === 'failed')
              .map((detail, index) => (
                <div key={index} className="text-sm text-red-700">
                  <span className="font-medium">{detail.row.ticker}</span>
                  {detail.reason && (
                    <span className="text-red-600"> - {detail.reason}</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Close
        </button>
        <button
          onClick={onImportAnother}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Import Another File
        </button>
      </div>
    </div>
  );
}
