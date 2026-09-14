import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CHART_COLORS } from "../../utils/chartColors";
import { AnalyticsCard } from "./AnalyticsCard";

export const OrdersTrendChart = ({ data, isLoading }) => {
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
          <p className="text-sm font-medium text-primary mb-1">{formatLabel(label)}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
            <span className="text-sm text-secondary font-medium">
              {payload[0].value} order{payload[0].value !== 1 ? 's' : ''}
            </span>
          </div>
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
    <AnalyticsCard title="Orders Trend" subtitle="New orders created per month" isLoading={isLoading} className="lg:col-span-2">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke={CHART_COLORS.accent} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorOrders)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted text-sm">
          No order data available for this period.
        </div>
      )}
    </AnalyticsCard>
  );
};
