// ============================================
// Duplicates Modal Component
// Shows duplicate transactions found in CSV
// ============================================
import { X, ArrowRight } from 'lucide-react';
import type { VanguardTransaction } from '../types';

interface DuplicatePair {
  original: VanguardTransaction;
  duplicate: VanguardTransaction;
}

interface DuplicatesModalProps {
  duplicatePairs: DuplicatePair[];
  onClose: () => void;
}

export default function DuplicatesModal({
  duplicatePairs,
  onClose,
}: DuplicatesModalProps) {
  const renderTransaction = (txn: VanguardTransaction, label: string, isOriginal: boolean) => (
    <div className={`p-4 rounded-lg ${isOriginal ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
      <div className="text-xs font-semibold mb-2 uppercase tracking-wide">
        <span className={isOriginal ? 'text-green-700' : 'text-red-700'}>{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="text-slate-600">Account:</div>
        <div className="font-mono text-slate-900">{txn.accountNumber}</div>

        <div className="text-slate-600">Trade Date:</div>
        <div className="text-slate-900">{txn.tradeDate}</div>

        <div className="text-slate-600">Symbol:</div>
        <div className="font-semibold text-slate-900">{txn.symbol}</div>

        <div className="text-slate-600">Type:</div>
        <div className="text-slate-900">{txn.transactionType}</div>

        <div className="text-slate-600">Shares:</div>
        <div className="font-mono text-slate-900">{txn.shares.toFixed(4)}</div>

        <div className="text-slate-600">Price:</div>
        <div className="font-mono text-slate-900">
          {txn.sharePrice !== undefined ? `$${txn.sharePrice.toFixed(2)}` : 'N/A'}
        </div>

        <div className="text-slate-600">Amount:</div>
        <div className="font-mono font-semibold">
          <span className={(txn.principalAmount || 0) < 0 ? 'text-red-600' : 'text-green-600'}>
            {txn.principalAmount !== undefined ? `$${txn.principalAmount.toFixed(2)}` : 'N/A'}
          </span>
        </div>

        <div className="text-slate-600">Description:</div>
        <div className="text-slate-900 text-xs">{txn.transactionDescription || txn.investmentName || 'N/A'}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Duplicate Transactions Removed
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {duplicatePairs.length} duplicate {duplicatePairs.length === 1 ? 'transaction was' : 'transactions were'} found and removed from the import
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Showing original (kept) and duplicate (removed) side by side
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Pairs Display */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {duplicatePairs.map((pair, index) => (
              <div key={index} className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                <div className="text-sm font-semibold text-slate-700 mb-3">
                  Duplicate #{index + 1}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  {/* Original Transaction (Kept) */}
                  {renderTransaction(pair.original, '✓ Original (Kept)', true)}

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="bg-slate-200 rounded-full p-2">
                      <ArrowRight className="text-slate-600" size={20} />
                    </div>
                  </div>

                  {/* Duplicate Transaction (Removed) */}
                  {renderTransaction(pair.duplicate, '✗ Duplicate (Removed)', false)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
