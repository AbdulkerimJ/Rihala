import React from "react";
import { Save, X, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "../../../components/ui/Modal";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { FormRootError } from "../../../components/ui/FormRootError";
import { usePermission } from "../../../hooks/usePermission";
import { getEmployees } from "../../employees/api";
import { ATTENDANCE_STATUSES, attendanceSchema } from "../constants";
import { applyServerErrors, unwrapListResponse } from "../../../utils/apiResponse";

export const AttendanceFormModal = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
}) => {
  const { can } = usePermission();

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "list"],
    queryFn: () => getEmployees({ limit: 1000, status: "active" }),
    enabled: can("employees.read") && isOpen,
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(attendanceSchema),
    defaultValues: initialData
      ? {
          employee: initialData.employee?._id || initialData.employee,
          workDate: initialData.workDate
            ? new Date(initialData.workDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          morningStatus: initialData.morningStatus || "PRESENT",
          afternoonStatus: initialData.afternoonStatus || "PRESENT",
        }
      : {
          employee: "",
          workDate: new Date().toISOString().split("T")[0],
          morningStatus: "PRESENT",
          afternoonStatus: "PRESENT",
        },
  });

  const handleFormSubmit = async (data) => {
    try {
      const payload = initialData
        ? {
            morningStatus: data.morningStatus,
            afternoonStatus: data.afternoonStatus,
          }
        : {
            employee: data.employee,
            workDate: new Date(data.workDate).toISOString(),
            morningStatus: data.morningStatus,
            afternoonStatus: data.afternoonStatus,
          };
      await onSubmit(payload);
      reset();
      onClose();
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={initialData ? "Edit Attendance Record" : "Manual Attendance Entry"}
      onClose={onClose}
    >
      <form
        className="space-y-4 p-5 sm:p-6"
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        <FormRootError error={errors.root} />

        <FormField label="Employee" required error={errors.employee?.message}>
          <Select
            {...register("employee")}
            placeholder="Select an active employee"
            options={employees.map((e) => ({ value: e._id, label: e.name }))}
            error={errors.employee?.message}
            disabled={!!initialData}
          />
        </FormField>

        <FormField label="Work Date" required error={errors.workDate?.message}>
          <Input
            type="date"
            {...register("workDate")}
            error={errors.workDate?.message}
            disabled={!!initialData}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Morning Status"
            required
            error={errors.morningStatus?.message}
          >
            <Select
              {...register("morningStatus")}
              options={ATTENDANCE_STATUSES.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
              error={errors.morningStatus?.message}
            />
          </FormField>

          <FormField
            label="Afternoon Status"
            required
            error={errors.afternoonStatus?.message}
          >
            <Select
              {...register("afternoonStatus")}
              options={ATTENDANCE_STATUSES.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
              error={errors.afternoonStatus?.message}
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-border/50">
          <Button type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting} leftIcon={X}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>
            {initialData ? "Update Record" : "Save Record"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
