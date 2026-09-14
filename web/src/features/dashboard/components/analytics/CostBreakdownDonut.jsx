import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CHART_COLORS } from "../../utils/chartColors";
import { AnalyticsCard } from "./AnalyticsCard";
import { MoneyDisplay } from "../../../../components/ui/MoneyDisplay";

export const CostBreakdownDonut = ({ data, isLoading }) => {
  const chartData = [
    { name: "Employee", value: data?.employeeCost || 0, color: CHART_COLORS.cashOut },
    { name: "Contractors", value: data?.contractorCost || 0, color: "rgb(var(--color-status-shipped))" }, // Purple semantic
    { name: "Materials", value: data?.materialsCost || 0, color: "rgb(var(--color-warning))" }, // Amber semantic
    { name: "Expenses", value: data?.generalExpenses || 0, color: "rgb(var(--text-secondary))" }, // Slate semantic
  ].filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-md">
          <p className="text-sm font-medium text-primary mb-1">{payload[0].name}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
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
    <AnalyticsCard title="Cost Breakdown" subtitle="Where your money goes" isLoading={isLoading}>
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
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted text-sm">
          No cost data available for this period.
        </div>
      )}
    </AnalyticsCard>
  );
};
