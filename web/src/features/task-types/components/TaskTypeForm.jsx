import React from "react";
import { Save, X, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import { Button } from "../../../components/ui/Button";
import { FormRootError } from "../../../components/ui/FormRootError";
import { applyServerErrors } from "../../../utils/apiResponse";

const taskTypeSchema = z.object({
  name: z
    .string({ error: "Task type name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  isActive: z.boolean().default(true),
});

export const TaskTypeForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskTypeSchema),
    defaultValues: initialData || {
      name: "",
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
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <FormField label="Name" required error={errors.name?.message}>
        <Input
          {...register("name")}
          placeholder="e.g. Painting, Finishing"
          error={errors.name?.message}
        />
      </FormField>

      <div className="pt-2">
        <Checkbox
          id="isActive"
          label="Active"
          {...register("isActive")}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>
          Save Task Type
        </Button>
      </div>
    </form>
  );
};
