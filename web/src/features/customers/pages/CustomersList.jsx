import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import React, { useMemo, useState } from "react";
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
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  applyServerErrors,
  cleanFilterParams,
  getApiErrorMessage,
  unwrapListResponse,
} from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";
import { ethiopianPhone, optionalEmail } from "../../../utils/validation";
import { ACTIVE_INACTIVE_OPTIONS, STATUS_FILTER_OPTIONS } from "../../../constants/options";

const customerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: ethiopianPhone,
  email: optionalEmail,
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

const CustomerForm = ({ initialData, onSubmit, onClose }) => {
  const {
    register,
    handleSubmit,
    setError,
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

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <FormField label="Name" required error={errors.name?.message}>
        <Input
          {...register("name")}
          error={errors.name?.message}
          placeholder="e.g. Ahmed Ali"
        />
      </FormField>
      
      <FormField label="Phone" required error={errors.phone?.message}>
        <Input
          {...register("phone")}
          error={errors.phone?.message}
          placeholder="e.g. 0911234567 or +251911234567"
        />
      </FormField>

      <FormField label="Email" error={errors.email?.message}>
        <Input
          {...register("email")}
          type="email"
          error={errors.email?.message}
          placeholder="Optional"
        />
      </FormField>

      <FormField label="Address" error={errors.address?.message}>
        <Input
          {...register("address")}
          error={errors.address?.message}
          placeholder="Optional"
        />
      </FormField>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea
          {...register("notes")}
          rows={3}
          error={errors.notes?.message}
          placeholder="Optional notes"
        />
      </FormField>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register("status")}
          error={errors.status?.message}
          options={ACTIVE_INACTIVE_OPTIONS}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save Customer
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

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["customers", params],
    queryFn: () => getCustomers(params),
    placeholderData: keepPreviousData,
  });
  const { items: customers, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["customers"],
    queryFn: getCustomers,
    pagination,
    params,
    page,
  });

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
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={STATUS_FILTER_OPTIONS}
        />
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
