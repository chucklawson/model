// ============================================
// FILE: src/Components/PortfolioFilter.tsx
// ============================================

import { Check, Briefcase } from 'lucide-react';
import type { Portfolio } from '../types';

interface Props {
  portfolios: Portfolio[];
  selectedPortfolios: string[];
  onChange: (selected: string[]) => void;
}

export default function PortfolioFilter({
  portfolios,
  selectedPortfolios,
  onChange,
}: Props) {
  const isAllSelected = selectedPortfolios.length === 0;

  const handleAllClick = () => {
    onChange([]);
  };

  const handlePortfolioClick = (portfolioName: string) => {
    if (selectedPortfolios.includes(portfolioName)) {
      // Remove from selection
      onChange(selectedPortfolios.filter(p => p !== portfolioName));
    } else {
      // Add to selection
      onChange([...selectedPortfolios, portfolioName]);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center gap-3 mb-3">
        <Briefcase size={20} className="text-purple-600" />
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Filter by Portfolio
        </h3>
        {!isAllSelected && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
            {selectedPortfolios.length} selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* All Portfolios button */}
        <button
          onClick={handleAllClick}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
            isAllSelected
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
          }`}
        >
          {isAllSelected && <Check size={16} />}
          All Portfolios
        </button>

        {/* Individual portfolio buttons */}
        {portfolios.map((portfolio) => {
          const isSelected = selectedPortfolios.includes(portfolio.name);

          return (
            <button
              key={portfolio.id}
              onClick={() => handlePortfolioClick(portfolio.name)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
              title={portfolio.description || portfolio.name}
            >
              {isSelected && <Check size={16} />}
              {portfolio.name}
            </button>
          );
        })}
      </div>

      {/* Selected portfolios summary */}
      {!isAllSelected && selectedPortfolios.length > 0 && (
        <div className="mt-3 text-xs text-slate-600">
          Showing tickers from: <span className="font-semibold">{selectedPortfolios.join(', ')}</span>
        </div>
      )}
    </div>
  );
}
