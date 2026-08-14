import React, { useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../../roles/api";
import { applyServerErrors } from "../../../utils/apiResponse";
import { CheckCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import { FormRootError } from "../../../components/ui/FormRootError";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  roles: z.array(z.string()).optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
    roles: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

export const UserForm = ({ onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;
  const [invitationData, setInvitationData] = useState(null);
  const { can } = usePermission();

  const initialRoles = initialData?.roles
    ? (Array.isArray(initialData.roles)
        ? initialData.roles.map((r) => (typeof r === "object" ? r._id : r))
        : [])
    : [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      roles: initialRoles,
    },
  });

  const selectedRoles = watch("roles") || [];

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
    enabled: can("roles.read"),
  });

  const availableRoles = rolesData?.data || [];

  const toggleRole = (roleId) => {
    const current = selectedRoles;
    if (current.includes(roleId)) {
      setValue(
        "roles",
        current.filter((id) => id !== roleId),
      );
    } else {
      setValue("roles", [...current, roleId]);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      const response = await onSubmit(data);
      
      if (response?.data?.invitationCode) {
        setInvitationData({
          email: response.data.user.email,
          code: response.data.invitationCode,
        });
      } else if (!isEditing) {
        setInvitationData({
          email: data.email,
          code: null,
        });
      } else {
        onClose();
      }
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  // Success state after invitation sent
  if (invitationData) {
    return (
      <div className="p-8 flex flex-col items-center text-center gap-4">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold text-primary">
          Invitation Sent!
        </h3>
        <p className="text-sm text-secondary">
          An invitation email has been sent to{" "}
          <span className="font-medium text-primary">{invitationData.email}</span>.
          They'll receive a link to set their password and activate their account.
        </p>
        
        {invitationData.code && (
          <div className="mt-4 w-full rounded-md border border-border bg-main p-4">
            <p className="text-sm font-medium text-primary mb-2">
              Secure Verification Code
            </p>
            <div className="text-2xl font-mono font-bold tracking-widest text-brand">
              {invitationData.code}
            </div>
            <p className="mt-2 text-xs text-secondary">
              Please securely communicate this code to the user. They will need it to accept the invitation.
            </p>
          </div>
        )}

        <Button
          onClick={onClose}
          fullWidth
          className="mt-2"
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
      <FormRootError error={errors.root} />
      {/* Name */}
      <FormField label="Name" required error={errors.name?.message}>
        <Input
          type="text"
          error={errors.name?.message}
          {...register("name")}
        />
      </FormField>

      {/* Email */}
      <FormField label="Email" required error={errors.email?.message}>
        <Input
          type="email"
          error={errors.email?.message}
          {...register("email")}
        />
      </FormField>

      {/* Role Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-primary">
          Assign Roles{" "}
          <span className="text-muted font-normal">(optional)</span>
        </label>
        {availableRoles.length === 0 ? (
          <p className="text-sm text-muted italic">Loading roles...</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border border-border p-2 bg-main">
            {availableRoles.map((role) => (
              <Checkbox
                key={role._id}
                label={role.name}
                checked={selectedRoles.includes(role._id)}
                onChange={() => toggleRole(role._id)}
              />
            ))}
          </div>
        )}
      </div>

      {!isEditing && (
        <p className="mt-4 text-xs text-muted bg-main rounded-lg px-3 py-2 border border-border">
          An invitation email will be sent to this address with a secure link to set their password.
        </p>
      )}

      {errors.root && (
        <div className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
          {errors.root.message}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-border/50 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {isEditing ? "Save Changes" : "Send Invitation"}
        </Button>
      </div>
    </form>
  );
};
