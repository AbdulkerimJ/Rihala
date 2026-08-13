import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/Button";
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
      description: "",
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-lg bg-surface shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-primary">
            {isEditing ? "Edit Role" : "Create New Role"}
          </h3>
          <Button variant="ghost" size="icon" onClick={isSubmitting ? undefined : onClose} disabled={isSubmitting}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Role Name
              </label>
              <input
                {...register("name")}
                type="text"
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-main text-primary"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-danger">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {errors.root && (
            <div className="mt-4 rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
              {errors.root.message}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
