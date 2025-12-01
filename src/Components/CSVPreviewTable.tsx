// ============================================
// CSV Preview Table Component
// ============================================
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { ValidationResult } from '../types';

interface CSVPreviewTableProps {
  validationResults: ValidationResult[];
  missingPortfolios: string[];
}

export default function CSVPreviewTable({
  validationResults,
  missingPortfolios,
}: CSVPreviewTableProps) {
  const validCount = validationResults.filter(r => r.status === 'valid').length;
  const duplicateCount = validationResults.filter(r => r.status === 'duplicate').length;
  const invalidCount = validationResults.filter(r => r.status === 'invalid').length;

  const getRowClassName = (status: 'valid' | 'duplicate' | 'invalid'): string => {
    switch (status) {
      case 'valid':
        return 'bg-green-50 border-green-200';
      case 'duplicate':
        return 'bg-yellow-50 border-yellow-200';
      case 'invalid':
        return 'bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (status: 'valid' | 'duplicate' | 'invalid') => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'duplicate':
        return <AlertCircle className="text-yellow-600" size={18} />;
      case 'invalid':
        return <XCircle className="text-red-600" size={18} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Preview Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="text-green-600" size={18} />
              <span className="text-2xl font-bold text-green-700">{validCount}</span>
            </div>
            <div className="text-xs text-slate-600">Valid</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="text-yellow-600" size={18} />
              <span className="text-2xl font-bold text-yellow-700">{duplicateCount}</span>
            </div>
            <div className="text-xs text-slate-600">Duplicates</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="text-red-600" size={18} />
              <span className="text-2xl font-bold text-red-700">{invalidCount}</span>
            </div>
            <div className="text-xs text-slate-600">Invalid</div>
          </div>
        </div>

        {missingPortfolios.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <span className="font-semibold text-blue-800">Note:</span>
                <span className="text-blue-700"> The following portfolios will be auto-created: </span>
                <span className="font-medium text-blue-800">{missingPortfolios.join(', ')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 w-12">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Ticker</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Shares</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Cost/Share</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Portfolio</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">Issues</th>
              </tr>
            </thead>
            <tbody>
              {validationResults.map((result, index) => (
                <tr
                  key={index}
                  className={`border-t border-slate-200 ${getRowClassName(result.status)}`}
                >
                  <td className="px-3 py-2">
                    {getStatusIcon(result.status)}
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold">
                    {result.row.ticker || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {result.row.shares || '-'}
                  </td>
                  <td className="px-3 py-2">
                    ${result.row.costPerShare?.toFixed(2) || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {result.row.purchaseDate || '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {result.row.portfolios.map((p, i) => (
                        <span
                          key={i}
                          className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {result.status === 'duplicate' && (
                      <span className="text-yellow-700 text-xs">
                        {result.duplicateReason}
                      </span>
                    )}
                    {result.status === 'invalid' && result.errors.length > 0 && (
                      <div className="text-red-700 text-xs space-y-0.5">
                        {result.errors.map((error, i) => (
                          <div key={i}>
                            <span className="font-semibold">{error.field}:</span> {error.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-slate-500 text-center">
        Showing {validationResults.length} rows
        {validationResults.length > 100 && ' (first 100 displayed, all will be imported)'}
      </div>
    </div>
  );
}
