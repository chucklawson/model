import type AnnualProjection from '../../Lib/AnnualProjection';

interface AnnualProjectionTableProps {
  projections: AnnualProjection[];
  currentPrice: number;
}

export default function AnnualProjectionTable({
  projections,
  currentPrice
}: AnnualProjectionTableProps) {
  return (
    <div className="mt-6 bg-white rounded-lg border-2 border-blue-300 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3">
        <h3 className="text-lg font-bold text-white">
          Annual Projection Breakdown (with P/E Compression)
        </h3>
        <p className="text-xs text-blue-100">
          Shows year-by-year projection with linear P/E interpolation
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-slate-700">Year</th>
              <th className="px-4 py-3 text-right font-bold text-slate-700">EPS</th>
              <th className="px-4 py-3 text-right font-bold text-slate-700">P/E Ratio</th>
              <th className="px-4 py-3 text-right font-bold text-slate-700">Stock Price</th>
              <th className="px-4 py-3 text-right font-bold text-slate-700">Growth %</th>
              <th className="px-4 py-3 text-right font-bold text-slate-700">Cumulative Return</th>
            </tr>
          </thead>
          <tbody>
            {/* Current Year Row */}
            <tr className="border-t-2 border-slate-300 bg-blue-50">
              <td className="px-4 py-3 font-semibold text-slate-700">
                Current ({new Date().getFullYear()})
              </td>
              <td className="px-4 py-3 text-right font-mono">-</td>
              <td className="px-4 py-3 text-right font-mono">-</td>
              <td className="px-4 py-3 text-right font-mono font-bold">
                ${currentPrice.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right font-mono">-</td>
              <td className="px-4 py-3 text-right font-mono">0.00%</td>
            </tr>

            {/* Projection Rows */}
            {projections.map((proj, index) => {
              const isLastRow = index === projections.length - 1;
              return (
                <tr
                  key={proj.year}
                  className={`border-t border-slate-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } ${isLastRow ? 'border-b-2 border-blue-400' : ''} hover:bg-blue-50`}
                >
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    Year {proj.year} ({proj.calendarYear})
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-blue-600">
                    ${proj.eps.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-purple-600">
                    {proj.peRatio.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                    ${proj.stockPrice.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${
                    proj.annualGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {proj.annualGrowth >= 0 ? '+' : ''}{proj.annualGrowth.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${
                    proj.cumulativeReturn >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {proj.cumulativeReturn >= 0 ? '+' : ''}{proj.cumulativeReturn.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 px-4 py-3 border-t border-slate-300">
        <p className="text-xs text-slate-600">
          <strong>Note:</strong> P/E ratio uses linear interpolation from current to target value.
          Stock price calculated as EPS × P/E ratio for each year.
        </p>
      </div>
    </div>
  );
}
