import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../../roles/api";
import { X, CheckCircle, Mail } from "lucide-react";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  roles: z.array(z.string()).optional(),
});

const updateUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email address").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

export const UserModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;
  const [invitedEmail, setInvitedEmail] = useState(null);

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
    enabled: isOpen && !isEditing,
  });

  const availableRoles = rolesData?.data || [];

  useEffect(() => {
    if (isOpen) {
      setInvitedEmail(null);
      if (initialData) {
        reset({ name: initialData.name || "", email: initialData.email || "" });
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
    await onSubmit(data);
    if (!isEditing) {
      setInvitedEmail(data.email);
    } else {
      onClose();
    }
  };

  // Success state after invitation sent
  if (invitedEmail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4">
        <div className="relative w-full max-w-md rounded-xl bg-surface shadow-2xl border border-border p-8 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-primary">
            Invitation Sent!
          </h3>
          <p className="text-sm text-secondary">
            An invitation email has been sent to{" "}
            <span className="font-medium text-primary">{invitedEmail}</span>.
            They'll receive a link to set their password and activate their
            account.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-main border border-border">
            <Mail className="h-4 w-4 text-brand" />
            <span className="text-sm text-secondary">
              Check the backend console for the invite link
            </span>
          </div>
          <button
            onClick={onClose}
            className="mt-2 w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-surface shadow-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-primary">
            {isEditing ? "Edit User" : "Invite New User"}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="h-5 w-5" />
          </button>
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

            {/* Role Selection — only for new users */}
            {!isEditing && (
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
            )}
          </div>

          {!isEditing && (
            <p className="mt-4 text-xs text-muted bg-main rounded-lg px-3 py-2 border border-border">
              An invitation email will be sent to this address with a secure
              link to set their password.
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Sending Invitation..."
                : isEditing
                  ? "Save Changes"
                  : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
