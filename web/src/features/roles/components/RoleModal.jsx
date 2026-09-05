import { useState } from "react";
import { Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { applyServerErrors } from "../../../utils/apiResponse";
import { FormRootError } from "../../../components/ui/FormRootError";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { PermissionsSelector } from "./PermissionsSelector";
import { Button } from "../../../components/ui/Button";

const roleSchema = z.object({
  name: z.string().trim().min(2, "Role name must be at least 2 characters"),
});

export const RoleForm = ({ initialData, onSubmit, onClose }) => {
  const [selectedPermissions, setSelectedPermissions] = useState(() => {
    const initialIds = (initialData?.permissions || []).map((p) =>
      typeof p === "string" ? p : p._id
    );
    return new Set(initialIds);
  });

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
      await onSubmit({ ...data, permissions: Array.from(selectedPermissions) });
      onClose();
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="p-6 overflow-y-auto space-y-6 flex-1">
        <FormRootError error={errors.root} />
        <FormField label="Role Name" required error={errors.name?.message}>
          <Input
            type="text"
            error={errors.name?.message}
            {...register("name")}
          />
        </FormField>

        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">Permissions</h4>
          <PermissionsSelector
            selectedPermissions={selectedPermissions}
            onChange={setSelectedPermissions}
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit(handleFormSubmit)} isLoading={isSubmitting} leftIcon={Save}>
          Save Role
        </Button>
      </div>
    </div>
  );
};
