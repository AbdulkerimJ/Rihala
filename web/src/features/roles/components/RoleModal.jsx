import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { applyServerErrors } from "../../../utils/apiResponse";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
});

export const RoleModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name || "",
        });
      } else {
        reset({
          name: "",
        });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? "Edit Role" : "Create New Role"}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
        <FormField label="Role Name" required error={errors.name?.message}>
          <Input
            type="text"
            error={errors.name?.message}
            {...register("name")}
          />
        </FormField>

        {errors.root && (
          <div className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
            {errors.root.message}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 border-t border-border/50 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
