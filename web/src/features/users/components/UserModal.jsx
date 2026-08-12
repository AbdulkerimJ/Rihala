import React, { useEffect, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../../roles/api";
import { X, CheckCircle, Mail } from "lucide-react";
import { Button } from "../../../components/ui/Button";

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

export const UserModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;
  const [invitationData, setInvitationData] = useState(null);
  const { can } = usePermission();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: { name: "", email: "", roles: [] },
  });

  const selectedRoles = watch("roles") || [];

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
    enabled: isOpen && can("roles.read"),
  });

  const availableRoles = rolesData?.data || [];

  useEffect(() => {
    if (isOpen) {
      setInvitationData(null);
      if (initialData) {
        const initialRoles = Array.isArray(initialData.roles)
          ? initialData.roles.map((r) => (typeof r === "object" ? r._id : r))
          : [];
        reset({ name: initialData.name || "", email: initialData.email || "", roles: initialRoles });
      } else {
        reset({ name: "", email: "", roles: [] });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

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
  };

  // Success state after invitation sent
  if (invitationData) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4">
        <div className="relative w-full max-w-md rounded-lg bg-surface shadow-2xl border border-border p-8 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-primary">
            Invitation Sent!
          </h3>
          <p className="text-sm text-secondary">
            An invitation email has been sent to{" "}
            <span className="font-medium text-primary">{invitationData.email}</span>.
            They'll receive a link to set their password and activate their
            account.
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
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-surface shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-primary">
            {isEditing ? "Edit User" : "Invite New User"}
          </h3>
          <Button variant="ghost" size="icon" onClick={isSubmitting ? undefined : onClose} disabled={isSubmitting} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Name
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

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-main text-primary"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

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
                      <label
                        key={role._id}
                        className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer hover:bg-surface transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role._id)}
                          onChange={() => toggleRole(role._id)}
                          className="rounded border-border text-brand focus:ring-brand accent-brand"
                        />
                        <span className="text-sm text-primary">
                          {role.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
          </div>

          {!isEditing && (
            <p className="mt-4 text-xs text-muted bg-main rounded-lg px-3 py-2 border border-border">
              An invitation email will be sent to this address with a secure
              link to set their password.
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
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
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Sending Invitation..."
                : isEditing
                  ? "Save Changes"
                  : "Send Invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
