import { usePermission } from "../../../hooks/usePermission";
import React, { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createCustomer, getCustomers, updateCustomer } from "../api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
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
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
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
      <FormField label="Name" required error={errors.name?.message}>
        <input
          {...register("name")}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="e.g. Ahmed Ali"
        />
      </FormField>
      
      <FormField label="Phone" required error={errors.phone?.message}>
        <input
          {...register("phone")}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="e.g. +251 911 234 567"
        />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Optional"
        />
      </FormField>

      <FormField label="Address" error={errors.address?.message}>
        <input
          {...register("address")}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Optional"
        />
      </FormField>

      <FormField label="Notes" error={errors.notes?.message}>
        <textarea
          {...register("notes")}
          rows={3}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Optional notes"
        />
      </FormField>

      <FormField label="Status" error={errors.status?.message}>
        <select
          {...register("status")}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Customer"}
        </Button>
      </div>
    </form>
  );
};

export const CustomersList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["customers", params],
    queryFn: () => getCustomers(params),
    placeholderData: keepPreviousData,
  });
  const { items: customers, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["customers", nextParams],
        queryFn: () => getCustomers(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
      setIsOpen(false);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
      setIsOpen(false);
    },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { header: "Phone", accessor: "phone", className: "text-secondary" },
    { header: "Email", accessor: (row) => row.email || "-", className: "text-secondary hidden sm:table-cell", hiddenOnMobile: true },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { header: "Created", accessor: (row) => formatDateTime(row.createdAt), className: "text-secondary hidden md:table-cell", hiddenOnMobile: true },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <Can permission="customers.update">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingCustomer(row);
              setIsOpen(true);
            }}
          >
            Edit
          </Button>
        </Can>
      ) 
    }
  ];

  const handleClearFilters = () => {
    setFilters({ search: "", status: "" });
    setPage(1);
  };


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

      <FilterBar 
        searchPlaceholder="Search customers by name or phone..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={filters.search || filters.status ? handleClearFilters : undefined}
      >
        <select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterBar>

      <DataTable 
        columns={columns}
        data={customers}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No customers found"
            description="Create a customer to start tracking orders."
            actionLabel={can("customers.create") ? "New Customer" : null}
            onAction={can("customers.create") ? () => {  setEditingCustomer(null); setIsOpen(true); } : undefined}
          />
        }
      />

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
    </div>
  );
};
