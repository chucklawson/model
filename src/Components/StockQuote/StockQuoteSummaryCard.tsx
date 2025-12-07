import React from 'react';
import type Quote_V3 from '../../Lib/Quote_V3';

interface StockQuoteSummaryCardProps {
  quote: Quote_V3;
}

/**
 * Format volume to K/M/B notation
 */
function formatVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toString();
}

/**
 * Format market cap to M/B/T notation
 */
function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toLocaleString()}`;
}

/**
 * StockQuoteSummaryCard - Displays stock quote data in a modern card
 * Matches CurrentHoldings design with indigo/purple theme
 */
const StockQuoteSummaryCard: React.FC<StockQuoteSummaryCardProps> = ({ quote }) => {
  return (
    <div className="bg-indigo-100 rounded-md shadow-md p-2 mb-2 hover:shadow-lg transition-shadow duration-300">
      {/* Header and Price combined in one row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-baseline gap-2">
          <h3 className="text-purple-600 font-bold text-base">{quote.symbol}</h3>
          <span className="text-xl font-bold text-gray-900">
            ${quote.price.toFixed(2)}
          </span>
          <span className={`text-sm font-bold ${quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changesPercentage.toFixed(2)}%)
          </span>
        </div>
        <span className="text-gray-600 text-xs">{quote.name}</span>
      </div>

      {/* Metrics grid - Volume, Day Range, Market Cap */}
      <div className="grid grid-cols-3 gap-2">
        {/* Volume */}
        <div className="text-center">
          <div className="text-xs text-gray-500">Volume</div>
          <div className="text-xs font-bold text-gray-700">{formatVolume(quote.volume)}</div>
        </div>

        {/* Day Range */}
        <div className="text-center">
          <div className="text-xs text-gray-500">Day Range</div>
          <div className="text-xs font-bold text-gray-700">
            ${quote.dayLow.toFixed(2)} - ${quote.dayHigh.toFixed(2)}
          </div>
        </div>

        {/* Market Cap */}
        <div className="text-center">
          <div className="text-xs text-gray-500">Market Cap</div>
          <div className="text-xs font-bold text-gray-700">{formatMarketCap(quote.marketCap)}</div>
        </div>
      </div>
    </div>
  );
};

export default StockQuoteSummaryCard;
