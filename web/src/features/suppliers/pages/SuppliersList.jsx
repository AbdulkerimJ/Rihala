import { useMemo, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createSupplier, getSuppliers, updateSupplier, deleteSupplier } from "../api";

import toast from "react-hot-toast";
import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";
import { STATUS_FILTER_OPTIONS } from "../../../constants/options";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";
import { SupplierForm } from "../components/SupplierForm";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";



export const SuppliersList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => getSuppliers(params),
    placeholderData: keepPreviousData,
    enabled: can("suppliers.read"),
  });
  const { items: suppliers, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created successfully");
      setIsOpen(false);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted successfully");
      setDeletingSupplier(null);
    },
    onError: () => {
      setDeletingSupplier(null);
    },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { header: "Phone", accessor: "phone", className: "text-secondary" },
    { 
      header: "Balance", 
      accessor: (row) => {
        const bal = row.balance || 0;
        const variant = bal > 0 ? "financeOut" : bal < 0 ? "financeIn" : "default";
        return <MoneyDisplay amount={bal} variant={variant} />;
      }
    },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { header: "Created", accessor: (row) => formatDateTime(row.createdAt), className: "text-secondary hidden lg:table-cell", hiddenOnMobile: true },
    {
      header: "Actions",
      isActions: true,
      accessor: (row) => (
        <div className="flex gap-1 justify-end">
          <Can permission="suppliers.update">
            <Button
              variant="ghost"
              size="icon"
              leftIcon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                setEditingSupplier(row);
                setIsOpen(true);
              }}
            />
          </Can>
          <Can permission="suppliers.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              leftIcon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                setDeletingSupplier(row);
              }}
            />
          </Can>
        </div>
      ),
    },
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load suppliers.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage workshop suppliers and material vendors."
        actions={
          <Can permission="suppliers.create">
            <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingSupplier(null); setIsOpen(true); }}>New Supplier</Button>
          </Can>
        }
      />

      <FilterBar 
        filters={filters}
        searchPlaceholder="Search suppliers..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={filters.search || filters.status ? () => { setFilters({ search: "", status: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={STATUS_FILTER_OPTIONS}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={suppliers}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/suppliers/${row._id}`)}
        mobileRow={(row) => ({
          to: `/suppliers/${row._id}`,
          title: row.name,
          subtitle: row.phone || "-",
          right: (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs sm:text-sm font-bold tracking-tight shrink-0">
                <MoneyDisplay amount={row.balance || 0} variant={(row.balance || 0) > 0 ? "financeOut" : (row.balance || 0) < 0 ? "financeIn" : "default"} />
              </span>
              <StatusBadge status={row.status} className="shrink-0" />
            </div>
          ),
          actions: (
            <>
              <Can permission="suppliers.update">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Edit}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSupplier(row);
                    setIsOpen(true);
                  }}
                >
                  Edit
                </Button>
              </Can>
              <Can permission="suppliers.delete">
                <Button
                  variant="danger-ghost"
                  size="sm"
                  leftIcon={Trash2}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingSupplier(row);
                  }}
                >
                  Delete
                </Button>
              </Can>
            </>
          )
        })}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No suppliers found"
            description="Add your first supplier to start managing material purchases."
            actionLabel={can("suppliers.create") ? "New Supplier" : null}
            onAction={can("suppliers.create") ? () => {  setEditingSupplier(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title={editingSupplier ? "Edit Supplier" : "New Supplier"} onClose={() => setIsOpen(false)}>
        <SupplierForm
          initialData={editingSupplier}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => editingSupplier ? updateMutation.mutateAsync({ id: editingSupplier._id, data }) : createMutation.mutateAsync(data)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingSupplier}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${deletingSupplier?.name}"? You can only delete suppliers with a zero balance.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteMutation.mutateAsync(deletingSupplier._id)}
        onCancel={() => setDeletingSupplier(null)}
        variant="danger"
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
};

