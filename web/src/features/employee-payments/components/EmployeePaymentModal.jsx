import React from "react";
import { Save, X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePermission } from "../../../hooks/usePermission";
import { getEmployees, createEmployee } from "../../employees/api";
import { EmployeeForm } from "../../employees/components/EmployeeForm";
import { unwrapListResponse, applyServerErrors } from "../../../utils/apiResponse";

import { Modal } from "../../../components/ui/Modal";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { CreatableSelect } from "../../../components/ui/CreatableSelect";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { FormRootError } from "../../../components/ui/FormRootError";
import { Select } from "../../../components/ui/Select";

const paymentSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  amount: z.coerce.number({ error: "Amount is required" }).positive("Amount must be greater than 0"),
  type: z.enum(["regular", "advance"]).default("regular"),
  paymentDate: z.string().min(1, "Payment date is required"),
  note: z.string().trim().optional().or(z.literal("")),
});

export const EmployeePaymentModal = ({
  isOpen,
  onClose,
  onSubmit,
  preSelectedEmployee = null,
}) => {
  const { can } = usePermission();

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000, status: "active" }),
    enabled: can("employees.read") && isOpen && !preSelectedEmployee
  });
  const employees = unwrapListResponse(employeesData).items || [];
  
  const { register, control, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      employee: preSelectedEmployee?._id || preSelectedEmployee || "",
      amount: "",
      type: "regular",
      paymentDate: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        employee: data.employee,
        amount: data.amount,
        type: data.type,
        paymentDate: new Date(data.paymentDate).toISOString(),
        note: data.note || undefined,
      };

      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <Modal isOpen={isOpen} title="Record Employee Payment" onClose={onClose}>
      <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
        <FormRootError error={errors.root} />
        <CreatableSelect
          label="Employee"
          required
          name="employee"
          register={register}
          setValue={setValue}
          error={errors.employee?.message}
          options={
            preSelectedEmployee
              ? [{ value: preSelectedEmployee._id || preSelectedEmployee, label: preSelectedEmployee.name || "Selected Employee" }]
              : employees.map(e => ({ value: e._id, label: e.name }))
          }
          placeholder="Select an employee"
          disabled={!!preSelectedEmployee}
          createTitle="New Employee"
          FormComponent={EmployeeForm}
          createMutationFn={createEmployee}
          queryKey={["employees"]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Payment Type" required error={errors.type?.message}>
            <Select
              {...register("type")}
              options={[
                { value: "regular", label: "Regular Salary" },
                { value: "advance", label: "Salary Advance" },
              ]}
              error={errors.type?.message}
            />
          </FormField>

          <FormField label="Amount (ETB)" required error={errors.amount?.message}>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  {...field}
                  error={errors.amount?.message}
                />
              )}
            />
          </FormField>
        </div>

        <FormField label="Payment Date" required error={errors.paymentDate?.message}>
          <Input type="date" {...register("paymentDate")} error={errors.paymentDate?.message} />
        </FormField>

        <FormField label="Notes (Optional)" error={errors.note?.message}>
          <Textarea {...register("note")} rows={2} error={errors.note?.message} placeholder="Optional notes" />
        </FormField>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Record Payment</Button>
        </div>
      </form>
    </Modal>
  );
};
