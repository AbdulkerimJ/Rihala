import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCustomer, getCustomers, updateCustomer } from "../api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  getApiErrorMessage,
  unwrapListResponse,
} from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

const CustomerForm = ({ initialData, onSubmit, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      status: "active",
    },
  });

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <input
        placeholder="Name"
        {...register("name")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      />
      <input
        placeholder="Phone"
        {...register("phone")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      />
      <input
        placeholder="Email"
        {...register("email")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      />
      <input
        placeholder="Address"
        {...register("address")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      />
      <textarea
        placeholder="Notes"
        {...register("notes")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      />
      <select
        {...register("status")}
        className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

export const CustomersList = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customers", page],
    queryFn: () => getCustomers({ page, limit: 20 }),
  });
  const { items: customers, pagination } = unwrapListResponse(data);

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to create customer")),
  });
  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to update customer")),
  });

  if (isLoading) return <LoadingSkeleton variant="default" rowCount={6} />;
  if (isError)
    return (
      <ErrorState
        description={getApiErrorMessage(error, "Failed to load customers.")}
      />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage workshop customers and their contact information."
        actions={
          <Can permission="customers.create">
            <Button
              onClick={() => {
                setEditingCustomer(null);
                setIsOpen(true);
              }}
            >
              New Customer
            </Button>
          </Can>
        }
      />
      {customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Create a customer to start tracking orders."
          actionLabel="New Customer"
          onAction={() => setIsOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-main">
              <tr>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs uppercase text-secondary">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs uppercase text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td className="px-6 py-4 text-sm text-primary">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {customer.email || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={customer.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {formatDateTime(customer.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Can permission="customers.update">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        isOpen={isOpen}
        title={editingCustomer ? "Edit Customer" : "New Customer"}
        onClose={() => setIsOpen(false)}
      >
        <CustomerForm
          initialData={editingCustomer}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) =>
            editingCustomer
              ? updateMutation.mutateAsync({ id: editingCustomer._id, data })
              : createMutation.mutateAsync(data)
          }
        />
      </Modal>
      {pagination && (
        <div className="flex items-center justify-between text-sm text-secondary">
          <div>
            Page {pagination.page} of {pagination.totalPages || 1}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setPage((value) =>
                  pagination.totalPages
                    ? Math.min(pagination.totalPages, value + 1)
                    : value + 1,
                )
              }
              disabled={
                pagination.totalPages ? page >= pagination.totalPages : false
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
