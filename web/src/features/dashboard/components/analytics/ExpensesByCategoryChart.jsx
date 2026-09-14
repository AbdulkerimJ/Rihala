import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { CHART_COLORS } from "../../utils/chartColors";
import { AnalyticsCard } from "./AnalyticsCard";

const EXPENSE_COLORS = [
  "rgb(var(--color-finance-out))",
  "rgb(var(--color-warning))",
  "rgb(var(--color-accent))",
  "rgb(var(--color-status-processing))",
  "rgb(var(--text-secondary))",
  "rgb(var(--color-status-pending))",
  "rgb(var(--color-status-shipped))",
];

export const ExpensesByCategoryChart = ({ data, isLoading }) => {
  const chartData = data && Array.isArray(data) ? data : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-md">
          <p className="text-sm font-medium text-primary mb-1">{label}</p>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
             <p className="text-sm text-secondary font-mono">
               {payload[0].value.toLocaleString()} ETB
             </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <AnalyticsCard title="Expenses by Category" subtitle="Top operating expenses" isLoading={isLoading}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--text-muted))" />
            <XAxis 
              dataKey="category" 
              axisLine={false} 
              tickLine={false}
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
            <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted text-sm">
          No expenses recorded for this period.
        </div>
      )}
    </AnalyticsCard>
  );
};
