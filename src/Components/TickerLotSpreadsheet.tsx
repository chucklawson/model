// ============================================
// FILE: src/components/TickerLotSpreadsheet.tsx
// ============================================

import { useState } from 'react';
import {
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Settings,
  EyeOff,
  ChevronDown,
  FileText,
  Briefcase
} from 'lucide-react';
import type { TickerLot } from '../types';
import ColumnCustomization, { type ColumnConfig } from './ColumnCustomization';

interface Props {
  lots: TickerLot[];
  onEdit: (lot: TickerLot) => void;
  onDelete: (id: string) => void;
  selectedRows: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'checkbox', label: 'Select', required: true, visible: true },
  { id: 'ticker', label: 'Ticker', icon: TrendingUp, visible: true },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase, visible: true },
  { id: 'shares', label: 'Shares', icon: Package, visible: true },
  { id: 'costPerShare', label: 'Cost/Share', icon: DollarSign, visible: true },
  { id: 'totalCost', label: 'Total Cost', icon: DollarSign, visible: true },
  { id: 'purchaseDate', label: 'Purchase Date', icon: Calendar, visible: true },
  { id: 'calculatePL', label: 'Calc P/L', visible: false },
  { id: 'baseYield', label: 'Base Yield', visible: false },
  { id: 'notes', label: 'Notes', icon: FileText, visible: true },
  { id: 'actions', label: 'Actions', required: true, visible: true },
];

export default function TickerLotSpreadsheet({
                                               lots,
                                               onEdit,
                                               onDelete,
                                               selectedRows,
                                               onToggleRow,
                                               onToggleAll,
                                             }: Props) {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showCustomization, setShowCustomization] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const allSelected = lots.length > 0 && selectedRows.size === lots.length;
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

  const renderCellContent = (colId: string, lot: TickerLot) => {
    switch (colId) {
      case 'checkbox':
        return (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300"
            checked={selectedRows.has(lot.id)}
            onChange={() => onToggleRow(lot.id)}
          />
        );
      case 'ticker':
        return <span className="font-bold text-blue-600 text-lg">{lot.ticker}</span>;
      case 'portfolio':
        const portfolioCount = lot.portfolios.length;
        const portfolioList = lot.portfolios.join(', ');

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
      case 'shares':
        return <span className="text-slate-700 font-semibold">{lot.shares.toLocaleString()}</span>;
      case 'costPerShare':
        return <span className="text-slate-700 font-mono">${lot.costPerShare.toFixed(2)}</span>;
      case 'totalCost':
        return <span className="font-bold text-green-600 text-lg">${lot.totalCost.toFixed(2)}</span>;
      case 'purchaseDate':
        return (
          <span className="text-slate-600">
            {new Date(lot.purchaseDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        );
      case 'calculatePL':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            lot.calculateAccumulatedProfitLoss
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {lot.calculateAccumulatedProfitLoss ? 'Yes' : 'No'}
          </span>
        );
      case 'baseYield':
        return (
          <span className="text-slate-700 font-mono">
            {lot.baseYield.toFixed(2)}%
          </span>
        );
      case 'notes':
        return <span className="text-slate-600 text-sm max-w-xs truncate">{lot.notes || '-'}</span>;
      case 'actions':
        return (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => onEdit(lot)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
              title="Edit Lot"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this lot?')) {
                  onDelete(lot.id);
                }
              }}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
              title="Delete Lot"
            >
              <Trash2 size={18} />
            </button>
          </div>
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

      <div className="overflow-auto max-h-[calc(100vh-500px)] rounded-xl border border-slate-200 shadow-lg">
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
                  {col.id === 'checkbox' ? (
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300"
                      checked={allSelected}
                      onChange={onToggleAll}
                    />
                  ) : (
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
                  )}
                </th>
              );
            })}
          </tr>
          </thead>
          <tbody>
          {lots.length === 0 ? (
            <tr>
              <td colSpan={visibleColSpan} className="p-12 text-center text-slate-400">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-lg">No lots for this ticker yet</p>
              </td>
            </tr>
          ) : (
            lots.map((lot, idx) => (
              <tr
                key={lot.id}
                className={`border-b border-slate-200 hover:bg-blue-50 transition-colors ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                {visibleColumns.map(col => (
                  <td key={col.id} className={`p-4 ${col.id === 'actions' ? 'text-right' : ''}`}>
                    {renderCellContent(col.id, lot)}
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