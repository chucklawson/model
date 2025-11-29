// ============================================
// FILE: src/components/TickerSummarySpreadsheet.tsx
// ============================================

import { useState } from 'react';
import {
  Eye,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Hash,
  Settings,
  EyeOff,
  ChevronDown,
  Briefcase,
  Building2,
  Percent
} from 'lucide-react';
import type { TickerSummary, Ticker } from '../types';
import ColumnCustomization, { type ColumnConfig } from './ColumnCustomization';

interface Props {
  summaries: TickerSummary[];
  onViewDetails: (ticker: string) => void;
  onUpdateTicker: (ticker: Ticker) => Promise<void>;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ticker', label: 'Ticker', icon: TrendingUp, required: true, visible: true },
  { id: 'companyName', label: 'Company', icon: Building2, visible: true },
  { id: 'baseYield', label: 'Yield %', icon: Percent, visible: true },
  { id: 'portfolios', label: 'Portfolios', icon: Briefcase, visible: true },
  { id: 'totalShares', label: 'Total Shares', icon: Package, visible: true },
  { id: 'totalCost', label: 'Total Cost', icon: DollarSign, visible: true },
  { id: 'avgCost', label: 'Avg Cost/Share', icon: DollarSign, visible: true },
  { id: 'lotCount', label: 'Lots', icon: Hash, visible: true },
  { id: 'dateRange', label: 'Date Range', icon: Calendar, visible: true },
  { id: 'actions', label: 'Actions', required: true, visible: true },
];

export default function TickerSummarySpreadsheet({
                                                   summaries,
                                                   onViewDetails,
                                                   onUpdateTicker,
                                                 }: Props) {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showCustomization, setShowCustomization] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    ticker: string;
    field: 'companyName' | 'baseYield';
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const visibleColumns = columns.filter(col => col.visible);
  const visibleColSpan = visibleColumns.length;

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId && !col.required ? { ...col, visible: !col.visible } : col
      )
    );
    setDropdownOpen(null);
  };

  const handleSaveEdit = async (ticker: string, field: 'companyName' | 'baseYield') => {
    try {
      const summary = summaries.find(s => s.ticker === ticker);
      if (!summary) return;

      const updatedTicker: Ticker = {
        id: '', // Will be set by handleUpdateTicker
        symbol: ticker,
        companyName: field === 'companyName' ? editValue : summary.companyName ?? '',
        baseYield: field === 'baseYield' ? parseFloat(editValue) || 0 : summary.baseYield,
      };

      await onUpdateTicker(updatedTicker);
      setEditingCell(null);
    } catch (err) {
      console.error('Error saving ticker edit:', err);
      alert('Failed to save changes');
    }
  };

  const renderCellContent = (colId: string, summary: TickerSummary) => {
    switch (colId) {
      case 'ticker':
        return <span className="font-bold text-blue-600 text-xl">{summary.ticker}</span>;

      case 'companyName':
        const isEditingCompany = editingCell?.ticker === summary.ticker &&
                                 editingCell?.field === 'companyName';

        if (isEditingCompany) {
          return (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleSaveEdit(summary.ticker, 'companyName')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit(summary.ticker, 'companyName');
                if (e.key === 'Escape') setEditingCell(null);
              }}
              autoFocus
              className="w-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          );
        }

        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setEditingCell({ ticker: summary.ticker, field: 'companyName' });
              setEditValue(summary.companyName ?? '');
            }}
            className="cursor-text hover:bg-blue-50 px-2 py-1 rounded min-h-[28px] transition-colors"
            title="Click to edit company name"
          >
            {summary.companyName || (
              <span className="text-slate-400 italic text-sm">Add name...</span>
            )}
          </div>
        );

      case 'baseYield':
        const isEditingYield = editingCell?.ticker === summary.ticker &&
                               editingCell?.field === 'baseYield';

        if (isEditingYield) {
          return (
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveEdit(summary.ticker, 'baseYield')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(summary.ticker, 'baseYield');
                  if (e.key === 'Escape') setEditingCell(null);
                }}
                autoFocus
                className="w-20 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none pr-6"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="absolute right-2 top-1 text-slate-500">%</span>
            </div>
          );
        }

        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setEditingCell({ ticker: summary.ticker, field: 'baseYield' });
              setEditValue(summary.baseYield.toString());
            }}
            className="cursor-text hover:bg-blue-50 px-2 py-1 rounded font-mono transition-colors"
            title="Click to edit base yield"
          >
            {summary.baseYield.toFixed(2)}%
          </div>
        );

      case 'portfolios':
        const portfolioCount = summary.portfolios.length;
        const portfolioList = summary.portfolios.join(', ');

        return (
          <div className="group relative">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold cursor-help">
              <Briefcase size={14} />
              {portfolioCount} {portfolioCount === 1 ? 'Portfolio' : 'Portfolios'}
            </span>

            {/* Tooltip */}
            <div className="invisible group-hover:visible absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
              {portfolioList}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        );
      case 'totalShares':
        return <span className="text-slate-700 font-semibold text-lg">{summary.totalShares.toLocaleString()}</span>;
      case 'totalCost':
        return <span className="font-bold text-green-600 text-lg">${summary.totalCost.toFixed(2)}</span>;
      case 'avgCost':
        return <span className="text-slate-700 font-mono font-semibold">${summary.averageCostPerShare.toFixed(2)}</span>;
      case 'lotCount':
        return <span className="text-slate-600 font-semibold">{summary.lotCount}</span>;
      case 'dateRange':
        return (
          <div className="text-slate-600 text-sm">
            <div>
              {new Date(summary.earliestPurchase).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="text-slate-400">to</div>
            <div>
              {new Date(summary.latestPurchase).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        );
      case 'actions':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(summary.ticker);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md"
          >
            <Eye size={18} />
            View Details
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowCustomization(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border border-slate-300"
        >
          <Settings size={18} />
          Customize Columns
        </button>
      </div>

      <div className="overflow-auto max-h-[calc(100vh-400px)] rounded-xl border border-slate-200 shadow-lg">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-100 to-slate-200 border-b-2 border-slate-300">
          <tr>
            {visibleColumns.map(col => {
              const Icon = col.icon;
              return (
                <th
                  key={col.id}
                  className={`p-4 font-bold text-slate-700 uppercase text-xs tracking-wide ${
                    col.id === 'actions' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div className="flex items-center gap-2 relative">
                    {Icon && <Icon size={16} />}
                    <span>{col.label}</span>
                    {!col.required && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpen(dropdownOpen === col.id ? null : col.id);
                        }}
                        className="ml-1 p-1 hover:bg-slate-300 rounded transition-colors"
                        title="Column options"
                      >
                        <ChevronDown size={14} />
                      </button>
                    )}
                    {dropdownOpen === col.id && (
                      <div
                        className="absolute top-full left-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-10 min-w-[160px]"
                        onMouseLeave={() => setDropdownOpen(null)}
                      >
                        <button
                          onClick={() => toggleColumnVisibility(col.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 transition-colors text-left"
                        >
                          <EyeOff size={16} />
                          <span className="text-sm font-normal normal-case">Hide Column</span>
                        </button>
                      </div>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
          </thead>
          <tbody>
          {summaries.length === 0 ? (
            <tr>
              <td colSpan={visibleColSpan} className="p-12 text-center text-slate-400">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-lg">No tickers yet. Add your first lot to get started!</p>
              </td>
            </tr>
          ) : (
            summaries.map((summary, idx) => (
              <tr
                key={summary.ticker}
                className={`border-b border-slate-200 hover:bg-blue-50 transition-colors cursor-pointer ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                }`}
                onClick={() => onViewDetails(summary.ticker)}
              >
                {visibleColumns.map(col => (
                  <td key={col.id} className={`p-4 ${col.id === 'actions' ? 'text-right' : ''}`}>
                    {renderCellContent(col.id, summary)}
                  </td>
                ))}
              </tr>
            ))
          )}
          </tbody>
        </table>
      </div>

      {showCustomization && (
        <ColumnCustomization
          columns={columns}
          onApply={setColumns}
          onClose={() => setShowCustomization(false)}
        />
      )}
    </>
  );
}
