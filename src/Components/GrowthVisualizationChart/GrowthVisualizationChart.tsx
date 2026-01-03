import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import type RuleOf72Projection from '../../Lib/RuleOf72Projection';

interface GrowthVisualizationChartProps {
  projections: RuleOf72Projection[];
  principal: number;
  showMilestones?: boolean;
}

export default function GrowthVisualizationChart({
  projections,
  showMilestones = true
}: GrowthVisualizationChartProps) {

  // Format currency for tooltips
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Custom tooltip with kid-friendly emojis
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { year: number; value: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as RuleOf72Projection;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-green-400">
          <p className="font-bold text-green-700 mb-2">Year {data.year}</p>
          <p className="text-slate-700">
            <span className="font-semibold">Value:</span> {formatCurrency(data.value)}
          </p>
          <p className="text-slate-700">
            <span className="font-semibold">Growth:</span> {formatCurrency(data.growth)}
          </p>
          {data.totalContributions > 0 && (
            <p className="text-slate-700">
              <span className="font-semibold">Contributed:</span> {formatCurrency(data.totalContributions)}
            </p>
          )}
          {data.isDoublingYear && (
            <p className="text-purple-600 font-bold mt-2">
              ⭐ Money Doubled!
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Get doubling events for milestone markers
  const doublingEvents = projections.filter(p => p.isDoublingYear);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={projections} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
            stroke="#64748b"
          />
          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            stroke="#64748b"
          />
          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#greenGradient)"
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />

          {showMilestones && doublingEvents.map((event, index) => (
            <ReferenceDot
              key={`doubling-${index}`}
              x={event.year}
              y={event.value}
              r={8}
              fill="#f59e0b"
              stroke="#fff"
              strokeWidth={2}
              label={{
                value: '⭐',
                position: 'top',
                fontSize: 20
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {showMilestones && doublingEvents.length > 0 && (
        <div className="mt-2 text-center">
          <p className="text-xs text-slate-500">
            ⭐ Stars show when your money doubles!
          </p>
        </div>
      )}
    </div>
  );
}
