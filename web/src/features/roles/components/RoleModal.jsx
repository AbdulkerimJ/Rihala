import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { FormRootError } from "../../../components/ui/FormRootError";
import { applyServerErrors } from "../../../utils/apiResponse";

const roleSchema = z.object({
  name: z.string().trim().min(2, "Role name must be at least 2 characters"),
});

export const RoleForm = ({ initialData, onSubmit, onClose }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
      <FormRootError error={errors.root} />
      <FormField label="Role Name" required error={errors.name?.message}>
        <Input
          type="text"
          error={errors.name?.message}
          {...register("name")}
        />
      </FormField>

      <div className="mt-6 flex justify-end gap-3 border-t border-border/50 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
};
