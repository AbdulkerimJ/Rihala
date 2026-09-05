import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";
import { StatusSegmentedControl } from "./StatusSegmentedControl";
import { createAttendance, updateAttendance } from "../api";
import { getInitials } from "../constants";
import { getApiErrorMessage } from "../../../utils/apiResponse";

export const RollCallCard = ({
  employee,
  existingRecord,
  workDate,
  isWorkdayValid,
}) => {
  const queryClient = useQueryClient();

  const [morning, setMorning] = useState(
    existingRecord?.morningStatus || "PRESENT"
  );
  const [afternoon, setAfternoon] = useState(
    existingRecord?.afternoonStatus || "PRESENT"
  );

  // Sync state when existingRecord updates from query
  useEffect(() => {
    if (existingRecord) {
      setMorning(existingRecord.morningStatus);
      setAfternoon(existingRecord.afternoonStatus);
    } else {
      setMorning("PRESENT");
      setAfternoon("PRESENT");
    }
  }, [existingRecord]);

  const hasChanged =
    !existingRecord ||
    morning !== existingRecord.morningStatus ||
    afternoon !== existingRecord.afternoonStatus;

  const createMutation = useMutation({
    mutationFn: createAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`Recorded attendance for ${employee.name}`);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to record attendance")),
  });

  const updateMutation = useMutation({
    mutationFn: updateAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`Updated attendance for ${employee.name}`);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to update attendance")),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!isWorkdayValid) {
      toast.error("Cannot record attendance for Sundays.");
      return;
    }

    if (existingRecord) {
      updateMutation.mutate({
        id: existingRecord._id,
        data: { morningStatus: morning, afternoonStatus: afternoon },
      });
    } else {
      createMutation.mutate({
        employee: employee._id,
        workDate: new Date(workDate).toISOString(),
        morningStatus: morning,
        afternoonStatus: afternoon,
      });
    }
  };

  return (
    <div
      className={`
        p-4 sm:p-4.5 rounded-2xl border bg-surface shadow-xs transition-shadow duration-200 flex flex-col justify-between
        ${
          existingRecord && !hasChanged
            ? "border-success/30 hover:border-success/50"
            : hasChanged && existingRecord
            ? "border-warning/40 shadow-sm ring-1 ring-warning/20"
            : "border-border hover:border-border/90"
        }
      `}
    >
      <div>
        {/* Card Header: Avatar + Employee Info + Saved Indicator */}
        <div className="flex items-center justify-between gap-3 mb-3.5 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 border border-brand/20 text-brand font-bold text-xs shrink-0">
              {getInitials(employee.name)}
            </div>
            <div className="min-w-0 flex flex-col">
              <h4 className="font-bold text-sm text-primary leading-tight truncate">
                {employee.name}
              </h4>
              <span className="text-[11px] text-secondary truncate flex items-center gap-1 mt-0.5">
                <Phone className="h-3 w-3 text-muted" />
                {employee.phone || "No phone"}
              </span>
            </div>
          </div>

          {existingRecord && !hasChanged ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-md border border-success/20 shrink-0">
              <Check className="h-3 w-3" /> Saved
            </span>
          ) : hasChanged && existingRecord ? (
            <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-md border border-warning/20 shrink-0">
              Unsaved
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-muted bg-main px-2 py-0.5 rounded-md border border-border shrink-0">
              Pending
            </span>
          )}
        </div>

        {/* Morning & Afternoon Responsive Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
          <StatusSegmentedControl
            label="Morning"
            value={morning}
            onChange={setMorning}
            disabled={isPending || !isWorkdayValid}
          />
          <StatusSegmentedControl
            label="Afternoon"
            value={afternoon}
            onChange={setAfternoon}
            disabled={isPending || !isWorkdayValid}
          />
        </div>
      </div>

      {/* Footer: Save/Update Button */}
      <div className="pt-3 border-t border-border/50 flex justify-end">
        <Button
          size="sm"
          variant={existingRecord && !hasChanged ? "secondary" : "primary"}
          onClick={handleSave}
          isLoading={isPending}
          disabled={!hasChanged || !isWorkdayValid || isPending}
          className="w-full text-xs font-semibold h-8"
        >
          {existingRecord
            ? hasChanged
              ? "Update Record"
              : "Up to date"
            : "Save Record"}
        </Button>
      </div>
    </div>
  );
};
