import React from 'react';

/**
 * StockQuoteSkeleton - Loading placeholder for StockQuote component
 * Displays animated skeleton with indigo theme matching CurrentHoldings design
 */
const StockQuoteSkeleton: React.FC = () => {
  return (
    <div className="bg-indigo-100 rounded-md shadow-md p-2 mb-2">
      {/* Combined header and price row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-baseline gap-2">
          <div className="h-5 bg-indigo-200 rounded w-16 animate-pulse"></div>
          <div className="h-6 bg-indigo-200 rounded w-20 animate-pulse"></div>
          <div className="h-4 bg-indigo-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="h-3 bg-indigo-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* Metrics grid section - 3 columns */}
      <div className="grid grid-cols-3 gap-2">
        {/* Volume */}
        <div className="space-y-1">
          <div className="h-3 bg-indigo-200 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-indigo-200 rounded w-full animate-pulse"></div>
        </div>

        {/* Day Range */}
        <div className="space-y-1">
          <div className="h-3 bg-indigo-200 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-indigo-200 rounded w-full animate-pulse"></div>
        </div>

        {/* Market Cap */}
        <div className="space-y-1">
          <div className="h-3 bg-indigo-200 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-indigo-200 rounded w-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default StockQuoteSkeleton;
