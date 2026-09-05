import { Save, X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { FormRootError } from "../../../components/ui/FormRootError";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { Button } from "../../../components/ui/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ethiopianPhone } from "../../../utils/validation";
import { ACTIVE_INACTIVE_OPTIONS } from "../../../constants/options";
import { applyServerErrors } from "../../../utils/apiResponse";
import { getLocalISODate } from "../../../utils/formatters";

const employeeSchema = z
  .object({
    name: z
      .string({ error: "Employee name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters"),
    phone: ethiopianPhone,
    employmentStartDate: z.string().min(1, "Employment start date is required"),
    employmentEndDate: z.string().optional().or(z.literal("")),
    status: z.enum(["active", "inactive"]).default("active"),
    initialDailyRate: z.coerce.number().positive("Rate must be positive").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.employmentEndDate || !data.employmentStartDate) return true;
      return new Date(data.employmentEndDate) >= new Date(data.employmentStartDate);
    },
    {
      message: "Employment end date cannot be before start date",
      path: ["employmentEndDate"],
    }
  );

export const EmployeeForm = ({ initialData, onSubmit, onClose }) => {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          phone: initialData.phone || "",
          employmentStartDate: initialData.employmentStartDate
            ? getLocalISODate(initialData.employmentStartDate)
            : getLocalISODate(),
          employmentEndDate: initialData.employmentEndDate
            ? getLocalISODate(initialData.employmentEndDate)
            : "",
          status: initialData.status || "active",
        }
      : {
          name: "",
          phone: "",
          employmentStartDate: getLocalISODate(),
          employmentEndDate: "",
          status: "active",
          initialDailyRate: "",
        },
  });

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        employmentEndDate: data.employmentEndDate ? data.employmentEndDate : undefined,
        initialDailyRate: data.initialDailyRate ? data.initialDailyRate : undefined,
      };
      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-3 p-4 sm:p-5" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Full Name" required error={errors.name?.message}>
          <Input {...register("name")} error={errors.name?.message} placeholder="e.g. Abebe Bikila" />
        </FormField>

        <FormField label="Phone Number" required error={errors.phone?.message}>
          <Input {...register("phone")} inputMode="tel" error={errors.phone?.message} placeholder="e.g. 0911234567" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Employment Start Date" required error={errors.employmentStartDate?.message}>
          <Input type="date" {...register("employmentStartDate")} error={errors.employmentStartDate?.message} />
        </FormField>

        <FormField label="Employment End Date (Optional)" error={errors.employmentEndDate?.message}>
          <Input type="date" {...register("employmentEndDate")} error={errors.employmentEndDate?.message} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Status" error={errors.status?.message}>
          <Select
            {...register("status")}
            error={errors.status?.message}
            options={ACTIVE_INACTIVE_OPTIONS}
          />
        </FormField>

        {!initialData && (
          <FormField label="Initial Daily Rate (Optional)" error={errors.initialDailyRate?.message}>
            <Controller
              name="initialDailyRate"
              control={control}
              render={({ field: { onChange, value } }) => (
                <CurrencyInput
                  value={value}
                  onValueChange={onChange}
                  placeholder="e.g. 500"
                  error={errors.initialDailyRate?.message}
                />
              )}
            />
          </FormField>
        )}
      </div>

      <div className="flex justify-end gap-2.5 pt-3 mt-1 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>
          Save Employee
        </Button>
      </div>
    </form>
  );
};
