import React from "react";
import { Save, X, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePermission } from "../../../hooks/usePermission";
import { getTaskTypes, createTaskType } from "../../task-types/api";
import { TaskTypeForm } from "../../task-types/components/TaskTypeForm";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { CreatableSelect } from "../../../components/ui/CreatableSelect";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Button } from "../../../components/ui/Button";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { FormRootError } from "../../../components/ui/FormRootError";
import { applyServerErrors, unwrapListResponse } from "../../../utils/apiResponse";

const taskSchema = z.object({
  name: z
    .string({ error: "Task name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  taskType: z.string().min(1, "Task Type is required"),
  defaultUnitPrice: z.coerce.number({ error: "Default unit price is required" }).positive("Unit price must be positive"),
  isActive: z.boolean().default(true),
});

export const TaskForm = ({ initialData, onSubmit, onClose }) => {
  const { can } = usePermission();
  const { data: taskTypesData } = useQuery({ 
    queryKey: ["task-types", "list"], 
    queryFn: () => getTaskTypes({ limit: 1000, isActive: true }),
    enabled: can("taskTypes.read")
  });
  const taskTypes = unwrapListResponse(taskTypesData).items || [];

  const { register, handleSubmit, control, setError, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: initialData ? {
      ...initialData,
      taskType: initialData.taskType?._id || initialData.taskType,
    } : {
      name: "",
      taskType: "",
      defaultUnitPrice: "",
      isActive: true,
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-3 p-4 sm:p-5" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <FormField label="Name" required error={errors.name?.message}>
        <Input
          {...register("name")}
          placeholder="e.g. Paint 1 Door"
          error={errors.name?.message}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CreatableSelect
          label="Task Type"
          required
          name="taskType"
          register={register}
          setValue={setValue}
          error={errors.taskType?.message}
          options={taskTypes.map(tt => ({ value: tt._id, label: tt.name }))}
          placeholder="Select a task type"
          createTitle="New Task Type"
          FormComponent={TaskTypeForm}
          createMutationFn={createTaskType}
          queryKey={["task-types"]}
        />

        <FormField label="Default Unit Price (ETB)" required error={errors.defaultUnitPrice?.message}>
          <Controller
            name="defaultUnitPrice"
            control={control}
            render={({ field: { onChange, value, ref } }) => (
              <CurrencyInput
                ref={ref}
                value={value}
                onChange={onChange}
                placeholder="e.g. 500"
                error={errors.defaultUnitPrice?.message}
              />
            )}
          />
        </FormField>
      </div>

      <div className="pt-2">
        <Checkbox
          id="isActive"
          label="Active"
          {...register("isActive")}
        />
      </div>

      <div className="flex justify-end gap-2.5 pt-3 mt-1 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>
          Save Task
        </Button>
      </div>
    </form>
  );
};
