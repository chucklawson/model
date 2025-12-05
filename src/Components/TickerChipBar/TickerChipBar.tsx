// ============================================
// FILE: src/Components/TickerChipBar/TickerChipBar.tsx
// ============================================

import type { TickersToEvaluate } from '../../Lib/TickersToEvaluate/TickersToEvaluate';
import { Loader2 } from 'lucide-react';

interface TickerChipBarProps {
  tickerEntries: TickersToEvaluate[];
  selectedTicker?: string;
  onSelectTicker: (ticker: string, quantity: number, totalCost: number) => void;
  isLoading?: boolean;
}

export default function TickerChipBar({
  tickerEntries,
  selectedTicker,
  onSelectTicker,
  isLoading = false
}: TickerChipBarProps) {
  // Find selected ticker entry for details display
  const selectedEntry = tickerEntries.find(
    entry => entry.ticker === selectedTicker
  );

  const handleChipClick = (entry: TickersToEvaluate) => {
    if (!isLoading) {
      const totalCost = entry.unitsOnHand * Number(entry.costBasis);
      onSelectTicker(
        entry.ticker,
        Number(entry.unitsOnHand.toFixed(3)),
        Number(totalCost.toFixed(2))
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-4">
      {/* Horizontal scrollable chip container */}
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <div className="flex flex-nowrap gap-2 mb-3">
          {tickerEntries.map((entry) => {
            const isSelected = entry.ticker === selectedTicker;
            const costPerShare = Number(entry.costBasis);
            const totalCost = entry.unitsOnHand * costPerShare;

            return (
              <div key={entry.ticker} className="group relative flex-shrink-0">
                {/* Chip button */}
                <button
                  onClick={() => handleChipClick(entry)}
                  disabled={isLoading}
                  className={`
                    px-3 py-1.5 rounded-full font-semibold text-sm
                    transition-all duration-200
                    whitespace-nowrap
                    ${isSelected
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {entry.ticker}
                </button>

                {/* Tooltip on hover */}
                <div className="absolute z-50 hidden group-hover:block left-1/2 -translate-x-1/2 top-full mt-2">
                  <div className="bg-slate-800 text-white text-xs rounded-lg p-2.5 shadow-xl whitespace-nowrap">
                    <div className="font-bold text-blue-300 mb-1">{entry.ticker}</div>
                    <div>Cost: ${costPerShare.toFixed(2)}/share</div>
                    <div>Quantity: {entry.unitsOnHand} shares</div>
                    <div className="border-t border-slate-600 mt-1 pt-1">
                      Total: ${totalCost.toFixed(2)}
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected ticker details row */}
      {selectedEntry && (
        <div className="text-sm text-slate-600 flex items-center gap-2 border-t border-slate-200 pt-2">
          <span className="font-bold text-blue-600 text-base">
            {selectedEntry.ticker}
          </span>
          <span className="text-slate-400">•</span>
          <span>
            ${Number(selectedEntry.costBasis).toFixed(2)}/share
          </span>
          <span className="text-slate-400">•</span>
          <span>{selectedEntry.unitsOnHand} shares</span>
          <span className="text-slate-400">•</span>
          <span className="font-semibold">
            Total: ${(selectedEntry.unitsOnHand * Number(selectedEntry.costBasis)).toFixed(2)}
          </span>
          {isLoading && (
            <>
              <span className="text-slate-400">•</span>
              <Loader2 className="animate-spin text-blue-600" size={14} />
              <span className="text-blue-600 text-xs">Loading...</span>
            </>
          )}
        </div>
      )}

      {/* Show message if no ticker selected */}
      {!selectedEntry && (
        <div className="text-sm text-slate-400 italic border-t border-slate-200 pt-2">
          Select a ticker to view details and chart
        </div>
      )}
    </div>
  );
}
