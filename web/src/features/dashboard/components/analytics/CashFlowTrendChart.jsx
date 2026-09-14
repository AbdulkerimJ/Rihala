import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { CHART_COLORS } from "../../utils/chartColors";
import { AnalyticsCard } from "./AnalyticsCard";

export const CashFlowTrendChart = ({ data, isLoading }) => {
  const chartData = data && Array.isArray(data) ? data : [];

  const formatLabel = (val) => {
    if (!val) return "";
    const parts = val.split('-');
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return new Date(parts[0], parts[1] - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-md">
          <p className="text-sm font-medium text-primary mb-2">{formatLabel(label)}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-secondary">{entry.name}</span>
              </div>
              <span className="text-sm font-mono text-primary">
                {entry.value.toLocaleString()} ETB
              </span>
            </div>
          ))}
          {payload.length === 2 && (
            <div className="mt-2 pt-2 border-t border-border flex justify-between gap-4">
              <span className="text-xs text-muted">Net</span>
              <span className={`text-xs font-mono font-medium ${payload[0].value - payload[1].value >= 0 ? 'text-finance-in' : 'text-finance-out'}`}>
                {(payload[0].value - payload[1].value).toLocaleString()} ETB
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const formatXAxis = (tickItem) => {
    if (!tickItem) return "";
    const parts = tickItem.split('-');
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return new Date(parts[0], parts[1] - 1).toLocaleDateString('en-US', { month: 'short' });
  };

  return (
    <AnalyticsCard title="Cash Flow Trend" subtitle="Monthly money in vs. money out" isLoading={isLoading} className="lg:col-span-2">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--text-muted))" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tickFormatter={formatXAxis}
              tick={{ fill: 'var(--color-secondary)', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-secondary)', fontSize: 12 }}
              width={60}
              tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="cashIn" name="Money In" fill={CHART_COLORS.cashIn} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="cashOut" name="Money Out" fill={CHART_COLORS.cashOut} radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted text-sm">
          No cash flow data available for this period.
        </div>
      )}
    </AnalyticsCard>
  );
};
