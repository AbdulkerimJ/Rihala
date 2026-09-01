import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { Plus, Edit } from "lucide-react";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createCustomer, getCustomers, updateCustomer } from "../api";
import { CustomerForm } from "../components/CustomerForm";
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



export const CustomersList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

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
            variant="ghost"
            size="icon"
            leftIcon={Edit}
            onClick={(e) => {
              e.stopPropagation();
              setEditingCustomer(row);
              setIsOpen(true);
            }}
            title="Edit"
          />
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
              leftIcon={Plus}
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
        filters={filters}
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
