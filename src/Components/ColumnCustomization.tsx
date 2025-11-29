// ============================================
// FILE: src/components/ColumnCustomization.tsx
// ============================================

import { Settings, X, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export interface ColumnConfig {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  required?: boolean; // If true, cannot be hidden
  visible: boolean;
}

interface Props {
  columns: ColumnConfig[];
  onApply: (columns: ColumnConfig[]) => void;
  onClose: () => void;
}

export default function ColumnCustomization({ columns, onApply, onClose }: Props) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>([...columns]);

  const toggleVisibility = (id: string) => {
    setLocalColumns(prev =>
      prev.map(col =>
        col.id === id && !col.required ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newColumns = [...localColumns];
    [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
    setLocalColumns(newColumns);
  };

  const moveDown = (index: number) => {
    if (index === localColumns.length - 1) return;
    const newColumns = [...localColumns];
    [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    setLocalColumns(newColumns);
  };

  const handleApply = () => {
    onApply(localColumns);
    onClose();
  };

  const visibleCount = localColumns.filter(col => col.visible).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <Settings size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Customize Columns</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Column List */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-slate-600 mb-4">
            {visibleCount} of {localColumns.length} columns visible
          </p>
          <div className="space-y-2">
            {localColumns.map((col, index) => {
              const Icon = col.icon;
              return (
                <div
                  key={col.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {/* Visibility Toggle */}
                  <button
                    onClick={() => toggleVisibility(col.id)}
                    className={`flex-shrink-0 p-1 rounded transition-colors ${
                      col.required
                        ? 'opacity-50 cursor-not-allowed'
                        : col.visible
                        ? 'text-blue-600 hover:bg-blue-100'
                        : 'text-slate-400 hover:bg-slate-200'
                    }`}
                    disabled={col.required}
                    title={col.required ? 'Required column' : col.visible ? 'Hide column' : 'Show column'}
                  >
                    {col.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>

                  {/* Column Label */}
                  <div className="flex-1 flex items-center gap-2 text-slate-600">
                    {Icon && <Icon size={16} />}
                    <span className={`font-medium ${col.visible ? 'text-slate-800' : 'text-slate-400'}`}>
                      {col.label}
                    </span>
                    {col.required && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-slate-600 hover:bg-slate-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === localColumns.length - 1}
                      className="p-1 text-slate-600 hover:bg-slate-200 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
