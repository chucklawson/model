// ============================================
// FILE: src/Components/TickerChipBar/TickerChipBar.tsx
// ============================================

import type { TickersToEvaluate } from '../../Lib/TickersToEvaluate/TickersToEvaluate';
import { Loader2 } from 'lucide-react';

interface TickerChipBarProps {
  tickerEntries: TickersToEvaluate[];
  selectedTicker?: string;
  selectedPositionType?: 'long' | 'short';
  onSelectTicker: (ticker: string, quantity: number, totalCost: number, positionType: 'long' | 'short') => void;
  isLoading?: boolean;
  currentPrice?: number;
}

export default function TickerChipBar({
  tickerEntries,
  selectedTicker,
  selectedPositionType,
  onSelectTicker,
  isLoading = false,
  currentPrice,
}: TickerChipBarProps) {
  // Find selected ticker entry for details display — match both ticker and positionType
  const selectedEntry = tickerEntries.find(
    entry => entry.ticker === selectedTicker && entry.positionType === (selectedPositionType ?? 'long')
  );

  // Find counterpart position (long when short is selected, vice versa)
  const counterpartEntry = selectedEntry
    ? tickerEntries.find(e => e.ticker === selectedEntry.ticker && e.positionType !== selectedEntry.positionType)
    : undefined;

  const handleChipClick = (entry: TickersToEvaluate) => {
    if (!isLoading) {
      const totalCost = entry.unitsOnHand * Number(entry.costBasis);
      onSelectTicker(
        entry.ticker,
        Number(entry.unitsOnHand.toFixed(3)),
        Number(totalCost.toFixed(2)),
        entry.positionType
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 mb-4">
      {/* Horizontal scrollable chip container */}
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <div className="flex flex-nowrap gap-2 mb-3">
          {tickerEntries.map((entry) => {
            const isSelected = entry.ticker === selectedTicker && entry.positionType === (selectedPositionType ?? 'long');
            const isShort = entry.positionType === 'short';
            const costPerShare = Number(entry.costBasis);
            const totalCost = entry.unitsOnHand * costPerShare;

            return (
              <div key={`${entry.ticker}-${entry.positionType}`} className="group relative flex-shrink-0">
                {/* Chip button */}
                <button
                  onClick={() => handleChipClick(entry)}
                  disabled={isLoading}
                  className={`
                    px-3 py-1.5 rounded-full font-semibold text-sm
                    transition-all duration-200
                    whitespace-nowrap
                    ${isSelected
                      ? isShort
                        ? 'bg-red-600 text-white shadow-lg scale-105'
                        : 'bg-blue-600 text-white shadow-lg scale-105'
                      : isShort
                        ? 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 hover:border-red-400'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {entry.ticker}{isShort && <span className="ml-1 text-xs opacity-80">S</span>}
                </button>

                {/* Tooltip on hover */}
                <div className="absolute z-50 hidden group-hover:block left-1/2 -translate-x-1/2 top-full mt-2">
                  <div className="bg-slate-800 text-white text-xs rounded-lg p-2.5 shadow-xl whitespace-nowrap">
                    <div className="font-bold text-blue-300 mb-1">
                      {entry.ticker}
                      {isShort && <span className="ml-1 text-red-300 font-bold"> SHORT</span>}
                    </div>
                    <div>{isShort ? 'Sale Price' : 'Cost'}: ${costPerShare.toFixed(2)}/share</div>
                    <div>Quantity: {entry.unitsOnHand} shares</div>
                    <div className="border-t border-slate-600 mt-1 pt-1">
                      {isShort ? 'Proceeds' : 'Total'}: ${totalCost.toFixed(2)}
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
          <span className={`font-bold text-base ${selectedEntry.positionType === 'short' ? 'text-red-600' : 'text-blue-600'}`}>
            {selectedEntry.ticker}
            {selectedEntry.positionType === 'short' && (
              <span className="ml-1 text-xs font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full">SHORT</span>
            )}
          </span>
          <span className="text-slate-400">•</span>
          <span>
            {selectedEntry.positionType === 'short' ? 'Sale: ' : ''}${Number(selectedEntry.costBasis).toFixed(2)}/share
          </span>
          <span className="text-slate-400">•</span>
          <span>{selectedEntry.unitsOnHand} shares</span>
          <span className="text-slate-400">•</span>
          {selectedEntry.positionType === 'short' && currentPrice && currentPrice > 0 ? (() => {
            const proceeds  = selectedEntry.unitsOnHand * Number(selectedEntry.costBasis);
            const coverCost = selectedEntry.unitsOnHand * currentPrice;
            const shortPL   = proceeds - coverCost;
            const isPositive = shortPL >= 0;
            return (
              <span className={`font-semibold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                Short P&L: {isPositive ? '+' : ''}${shortPL.toFixed(2)}
              </span>
            );
          })() : (
            <span className="font-semibold">
              {selectedEntry.positionType === 'short' ? 'Proceeds' : 'Total'}: ${(selectedEntry.unitsOnHand * Number(selectedEntry.costBasis)).toFixed(2)}
            </span>
          )}
          {counterpartEntry && (
            <>
              <span className="text-slate-400">•</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                counterpartEntry.positionType === 'short'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {counterpartEntry.positionType === 'short' ? 'Short' : 'Long'} position also open: {counterpartEntry.unitsOnHand} shares @ ${Number(counterpartEntry.costBasis).toFixed(2)}
              </span>
              <span className="text-slate-400">•</span>
              {currentPrice && currentPrice > 0 ? (() => {
                const longEntry  = selectedEntry.positionType === 'long' ? selectedEntry : counterpartEntry;
                const shortEntry = selectedEntry.positionType === 'short' ? selectedEntry : counterpartEntry;
                const longValue    = longEntry.unitsOnHand * currentPrice;
                const shortProceeds = shortEntry.unitsOnHand * Number(shortEntry.costBasis);
                const coverCost    = shortEntry.unitsOnHand * currentPrice;
                const combined     = longValue + shortProceeds - coverCost;
                const isPositive   = combined >= 0;
                return (
                  <span className={`font-semibold ${isPositive ? 'text-purple-700' : 'text-red-700'}`}>
                    Net proceeds if liquidated: ${combined.toFixed(2)}
                  </span>
                );
              })() : (
                <span className="text-slate-400 text-xs italic">Net proceeds if liquidated: awaiting price</span>
              )}
            </>
          )}
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
