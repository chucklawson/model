// ============================================
// Vanguard CSV Preview Table Component
// ============================================
import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { ParsedVanguardCSV } from '../types';

interface VanguardPreviewTableProps {
  data: ParsedVanguardCSV;
  warnings: string[];
}

type TabType = 'holdings' | 'transactions';

export default function VanguardPreviewTable({
  data,
  warnings,
}: VanguardPreviewTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>('holdings');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h4 className="font-semibold text-slate-800 mb-3">Preview Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="text-blue-600" size={18} />
              <span className="text-2xl font-bold text-blue-700">{data.holdings.length}</span>
            </div>
            <div className="text-xs text-slate-600">Holdings</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="text-green-600" size={18} />
              <span className="text-2xl font-bold text-green-700">{data.transactions.length}</span>
            </div>
            <div className="text-xs text-slate-600">Transactions</div>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="text-yellow-500 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <span className="font-semibold text-yellow-800">Warnings ({warnings.length}):</span>
                <div className="text-yellow-700 text-xs mt-1 max-h-20 overflow-y-auto space-y-0.5">
                  {warnings.slice(0, 5).map((warning, i) => (
                    <div key={i}>• {warning}</div>
                  ))}
                  {warnings.length > 5 && (
                    <div className="font-medium">...and {warnings.length - 5} more (see import results)</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'holdings'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Holdings ({data.holdings.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'transactions'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Transactions ({data.transactions.length})
        </button>
      </div>

      {/* Holdings Table */}
      {activeTab === 'holdings' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Account</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Symbol</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Investment Name</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Shares</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Price</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {data.holdings.map((holding, index) => (
                  <tr
                    key={index}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{holding.accountNumber}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-blue-700">
                      {holding.symbol}
                    </td>
                    <td className="px-3 py-2 text-slate-700">{holding.investmentName}</td>
                    <td className="px-3 py-2 text-right">{holding.shares.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">${holding.sharePrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      ${holding.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {activeTab === 'transactions' && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Account</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Trade Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Symbol</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Shares</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Price</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.slice(0, 100).map((txn, index) => (
                  <tr
                    key={index}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{txn.accountNumber}</td>
                    <td className="px-3 py-2 text-xs">{txn.tradeDate}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        txn.transactionType === 'Buy' ? 'bg-green-100 text-green-700' :
                        txn.transactionType === 'Sell' ? 'bg-red-100 text-red-700' :
                        txn.transactionType === 'Dividend' ? 'bg-blue-100 text-blue-700' :
                        txn.transactionType === 'Reinvestment' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {txn.transactionType}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-blue-700">
                      {txn.symbol}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {txn.shares >= 0 ? '+' : ''}{txn.shares.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {txn.sharePrice ? `$${txn.sharePrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {txn.netAmount ? `$${txn.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-slate-500 text-center">
        {activeTab === 'holdings'
          ? `Showing all ${data.holdings.length} holdings`
          : `Showing first ${Math.min(100, data.transactions.length)} of ${data.transactions.length} transactions`
        }
      </div>
    </div>
  );
}
