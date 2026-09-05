import { Users, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

export const RollCallSummaryStats = ({
  employees = [],
  todayAttendances = [],
}) => {
  const totalEmployees = employees.length;

  let presentCount = 0;
  let absentCount = 0;
  let excusedCount = 0;

  todayAttendances.forEach((record) => {
    const morning = record.morningStatus;
    const afternoon = record.afternoonStatus;

    if (morning === "PRESENT" || afternoon === "PRESENT") {
      presentCount++;
    } else if (morning === "PERMISSION" || afternoon === "PERMISSION") {
      excusedCount++;
    } else if (morning === "ABSENT" && afternoon === "ABSENT") {
      absentCount++;
    }
  });

  const recordedEmployeesCount = todayAttendances.filter((record) => {
    const empId = record.employee?._id || record.employee;
    return employees.some((e) => e._id === empId);
  }).length;

  const pendingCount = Math.max(0, totalEmployees - recordedEmployeesCount);

  const stats = [
    {
      label: "Total Staff",
      value: totalEmployees,
      icon: Users,
      color: "text-primary",
      bg: "bg-surface border-border",
    },
    {
      label: "Present",
      value: presentCount,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/5 border-success/20",
    },
    {
      label: "Absent",
      value: absentCount,
      icon: XCircle,
      color: "text-danger",
      bg: "bg-danger/5 border-danger/20",
    },
    {
      label: "Excused",
      value: excusedCount,
      icon: AlertCircle,
      color: "text-warning",
      bg: "bg-warning/5 border-warning/20",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock,
      color: "text-secondary",
      bg: "bg-main/60 border-border",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`flex items-center justify-between p-3 rounded-xl border ${stat.bg} shadow-xs`}
          >
            <div className="min-w-0 flex flex-col">
              <span className="text-[11px] font-medium text-secondary truncate">
                {stat.label}
              </span>
              <span className={`text-lg sm:text-xl font-bold tracking-tight ${stat.color}`}>
                {stat.value}
              </span>
            </div>
            <div className={`p-2 rounded-lg ${stat.color} shrink-0`}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
