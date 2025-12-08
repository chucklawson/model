import React from 'react';
import type { TableRow } from '../../Lib/KeyMetricsData/KeyMetricsDataTransformer';

interface Props {
  columns: string[];
  rows: TableRow[];
}

const KeyMetricsTable: React.FC<Props> = ({ columns, rows }) => {
  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="text-center p-8 text-slate-500">
        <p className="text-lg">Enter a ticker to view key metrics</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] rounded-xl border border-slate-200 shadow-lg">
      <table className="min-w-max">
        <thead className="bg-gradient-to-r from-slate-100 to-slate-200 border-b-2 border-slate-300 sticky top-0 z-20">
          <tr>
            <th className="p-1 font-bold text-slate-700 uppercase text-xs tracking-wide text-left w-[140px] min-w-[140px] max-w-[140px] sticky left-0 bg-gradient-to-r from-slate-100 to-slate-200 z-30">
              Metric
            </th>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`p-1 font-bold text-slate-700 uppercase text-xs tracking-wide text-right min-w-[100px] ${
                  column === 'Average' ? 'bg-blue-100' : ''
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-slate-200 hover:bg-blue-50 transition-colors ${
                rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              <td className="p-1 font-semibold text-slate-700 text-xs w-[140px] min-w-[140px] max-w-[140px] sticky left-0 bg-inherit z-10 truncate" title={row.label}>
                {row.label}
              </td>
              {row.values.map((value, valIdx) => (
                <td
                  key={valIdx}
                  className="p-1 text-slate-700 text-sm font-mono text-right whitespace-nowrap"
                >
                  {value}
                </td>
              ))}
              {row.average !== undefined && (
                <td className="p-1 text-blue-600 font-bold text-sm font-mono text-right bg-blue-50 whitespace-nowrap">
                  {row.average}
                </td>
              )}
              {row.average === undefined && (
                <td className="p-1 text-slate-400 text-sm text-right bg-blue-50 whitespace-nowrap">
                  —
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default KeyMetricsTable;
