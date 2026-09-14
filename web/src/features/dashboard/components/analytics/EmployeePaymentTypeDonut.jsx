import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AnalyticsCard } from "./AnalyticsCard";

const PAYMENT_TYPE_COLORS = {
  regular: "rgb(var(--color-accent))",
  overtime: "rgb(var(--color-status-processing))",
  bonus: "rgb(var(--color-success))",
  advance: "rgb(var(--color-warning))",
  contractor: "rgb(var(--color-status-shipped))",
  other: "rgb(var(--text-secondary))",
};

export const EmployeePaymentTypeDonut = ({ data, isLoading }) => {
  const chartData = data && Array.isArray(data) ? data : [];
  
  const total = chartData.reduce((sum, item) => sum + item.total, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-md">
          <p className="text-sm font-medium text-primary mb-1 capitalize">{payload[0].name}</p>
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
    <AnalyticsCard title="Payments by Type" subtitle="Breakdown by payment type" isLoading={isLoading}>
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
              nameKey="type"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PAYMENT_TYPE_COLORS[entry.type] || PAYMENT_TYPE_COLORS.other} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="capitalize">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted text-sm">
          No payments in this period.
        </div>
      )}
    </AnalyticsCard>
  );
};
