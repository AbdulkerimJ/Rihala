import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AnalyticsCard } from "./AnalyticsCard";

// Using semantic color tokens mapped to the design system
const COLORS = [
  "rgb(var(--color-accent))",
  "rgb(var(--color-success))",
  "rgb(var(--color-warning))",
  "rgb(var(--color-danger))",
  "rgb(var(--color-status-shipped))",
  "rgb(var(--color-status-pending))",
  "rgb(var(--text-secondary))",
  "rgb(var(--color-status-processing))",
];

export const PurchasesByCategoryChart = ({ data, isLoading }) => {
  const chartData = data && Array.isArray(data) ? data : [];
  
  const total = chartData.reduce((sum, item) => sum + item.total, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-md">
          <p className="text-sm font-medium text-primary mb-1">{payload[0].name}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
            <span className="text-sm text-secondary font-mono">
              {payload[0].value.toLocaleString()} ETB
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            {((payload[0].value / total) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AnalyticsCard title="Material Spend" subtitle="Purchases by category" isLoading={isLoading}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="total"
              nameKey="category"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted text-sm">
          No material purchases in this period.
        </div>
      )}
    </AnalyticsCard>
  );
};
