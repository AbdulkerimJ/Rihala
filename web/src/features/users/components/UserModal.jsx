import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

const userSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

export const UserModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          email: initialData.email || '',
          password: '',
        });
      } else {
        reset({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    // If editing and password is empty, don't send it
    if (isEditing && !data.password) {
      delete data.password;
    }
    await onSubmit(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-surface shadow-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-primary">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                First Name
              </label>
              <input
                {...register('firstName')}
                type="text"
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-main text-primary"
              />
              {errors.firstName && <p className="mt-1 text-xs text-danger">{errors.firstName.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Last Name
              </label>
              <input
                {...register('lastName')}
                type="text"
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-main text-primary"
              />
              {errors.lastName && <p className="mt-1 text-xs text-danger">{errors.lastName.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-main text-primary"
              />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Password {isEditing && <span className="text-muted font-normal">(Leave blank to keep current)</span>}
              </label>
              <input
                {...register('password')}
                type="password"
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-main text-primary"
              />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>
          </div>

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
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
