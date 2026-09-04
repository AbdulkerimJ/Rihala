import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { usePermission } from "../../../hooks/usePermission";
import { getAttendances, createAttendance, updateAttendance } from "../api";
import { getEmployees } from "../../employees/api";

import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { RollCallHeader } from "./RollCallHeader";
import { RollCallSummaryStats } from "./RollCallSummaryStats";
import { RollCallCard } from "./RollCallCard";

import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { isWorkday } from "../../../utils/validation";
import { getLocalISODate } from "../../../utils/formatters";

export const AttendancesRollCallMode = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();

  const todayStr = getLocalISODate();
  const [rollCallDate, setRollCallDate] = useState(todayStr);
  const isValidRollCallDate = isWorkday(rollCallDate);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Fetch active employees
  const { data: employeesData } = useQuery({
    queryKey: ["employees", "list"],
    queryFn: () => getEmployees({ limit: 1000, status: "active" }),
    enabled: can("employees.read"),
  });
  const employees = unwrapListResponse(employeesData).items || [];

  // Fetch roll-call attendances for selected date
  const { data: rollCallAttendancesData, isLoading: isLoadingRollCall } = useQuery({
    queryKey: ["attendances", "rollcall", rollCallDate],
    queryFn: () =>
      getAttendances({ from: rollCallDate, to: rollCallDate, limit: 1000 }),
    enabled: can("attendances.read"),
  });
  const rollCallAttendances = unwrapListResponse(rollCallAttendancesData).items || [];

  // Bulk "Mark All Present" Action
  const handleMarkAllPresent = async () => {
    if (!isValidRollCallDate) {
      toast.error("Cannot record attendance for Sundays.");
      return;
    }

    setIsMarkingAll(true);
    try {
      const promises = employees.map((emp) => {
        const existing = rollCallAttendances.find(
          (a) => a.employee?._id === emp._id || a.employee === emp._id
        );

        if (existing) {
          if (
            existing.morningStatus === "PRESENT" &&
            existing.afternoonStatus === "PRESENT"
          ) {
            return Promise.resolve();
          }
          return updateAttendance({
            id: existing._id,
            data: { morningStatus: "PRESENT", afternoonStatus: "PRESENT" },
          });
        }

        return createAttendance({
          employee: emp._id,
          workDate: new Date(rollCallDate).toISOString(),
          morningStatus: "PRESENT",
          afternoonStatus: "PRESENT",
        });
      });

      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("All active employees marked as Present!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to mark all present"));
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <RollCallHeader
        rollCallDate={rollCallDate}
        onDateChange={setRollCallDate}
        isWorkdayValid={isValidRollCallDate}
        onMarkAllPresent={handleMarkAllPresent}
        isMarkingAll={isMarkingAll}
        hasEmployees={employees.length > 0}
      />

      {!isValidRollCallDate ? (
        /* Sunday / Rest Day State */
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-surface/50 shadow-xs space-y-3">
          <Calendar className="h-10 w-10 mx-auto text-secondary" />
          <h3 className="text-base font-bold text-primary">
            Sunday is a Workshop Rest Day
          </h3>
          <p className="text-xs sm:text-sm text-secondary max-w-md mx-auto">
            Attendance records are only maintained for workdays (Monday through Saturday).
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const prev = new Date(rollCallDate);
              prev.setDate(prev.getDate() - 1);
              setRollCallDate(getLocalISODate(prev));
            }}
          >
            View Saturday Attendance
          </Button>
        </div>
      ) : (
        <>
          {/* Daily Summary Pulse */}
          <RollCallSummaryStats
            employees={employees}
            todayAttendances={rollCallAttendances}
          />

          {/* Employee Roll-Call Grid */}
          {isLoadingRollCall ? (
            <div className="flex flex-col items-center justify-center p-12 gap-2 text-secondary">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="text-xs font-medium">Loading active staff...</span>
            </div>
          ) : employees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {employees.map((employee) => {
                const record = rollCallAttendances.find(
                  (a) =>
                    a.employee?._id === employee._id ||
                    a.employee === employee._id
                );
                return (
                  <RollCallCard
                    key={employee._id}
                    employee={employee}
                    existingRecord={record}
                    workDate={rollCallDate}
                    isWorkdayValid={isValidRollCallDate}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Active Employees"
              description="You need active employees registered to take daily attendance."
            />
          )}
        </>
      )}
    </div>
  );
};
