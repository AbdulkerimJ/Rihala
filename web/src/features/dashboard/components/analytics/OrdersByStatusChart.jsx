import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { CHART_COLORS } from "../../utils/chartColors";
import { AnalyticsCard } from "./AnalyticsCard";

export const OrdersByStatusChart = ({ data, isLoading }) => {
  const chartData = [
    { name: "Pending", value: data?.pending || 0, color: CHART_COLORS.pending },
    { name: "In Progress", value: data?.in_progress || 0, color: CHART_COLORS.inProgress },
    { name: "Ready", value: data?.ready || 0, color: CHART_COLORS.ready },
    { name: "Completed", value: data?.completed || 0, color: CHART_COLORS.completed },
  ].filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-md">
          <p className="text-sm font-medium text-primary mb-1">{payload[0].name}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
            <span className="text-sm text-secondary font-medium">
              {payload[0].value} order{payload[0].value !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            {((payload[0].value / total) * 100).toFixed(1)}% of active
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <AnalyticsCard title="Orders Pipeline" subtitle="Current status of active orders" isLoading={isLoading}>
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
          No active orders in the pipeline.
        </div>
      )}
    </AnalyticsCard>
  );
};
