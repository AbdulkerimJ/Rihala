import { useState, useMemo } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { getContractors, createContractor, updateContractor, deleteContractor } from "../api";
import toast from "react-hot-toast";
import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";
import { STATUS_FILTER_OPTIONS } from "../../../constants/options";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";
import { ContractorForm } from "../components/ContractorForm";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
export const ContractorsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState(null);
  const [deletingContractor, setDeletingContractor] = useState(null);

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["contractors", params],
    queryFn: () => getContractors(params),
    placeholderData: keepPreviousData,
  });

  const { items: contractors, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["contractors"],
    queryFn: getContractors,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contractor created successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contractor updated successfully");
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contractor deleted successfully");
      setDeletingContractor(null);
    },
    onError: () => {
      setDeletingContractor(null);
    },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { header: "Phone", accessor: (row) => row.phone || "-", className: "text-secondary" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { header: "Created", accessor: (row) => formatDateTime(row.createdAt), className: "text-secondary hidden md:table-cell" },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="contractors.update">
            <Button
              variant="ghost"
              size="icon"
              leftIcon={Edit}
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setEditingContractor(row);
                setIsOpen(true);
              }}
              title="Edit"
            />
          </Can>
          <Can permission="contractors.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              leftIcon={Trash2}
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setDeletingContractor(row);
              }}
              title="Delete"
            />
          </Can>
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load contractors.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractors"
        description="Manage independent contractors."
        actions={
          <Can permission="contractors.create">
            <Button leftIcon={Plus} onClick={() => { setEditingContractor(null); setIsOpen(true); }}>
              New Contractor
            </Button>
          </Can>
        }
      />

      <FilterBar 
        filters={filters}
        searchPlaceholder="Search contractors..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={(filters.search || filters.status !== "") ? () => { setFilters({ search: "", status: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={STATUS_FILTER_OPTIONS}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={contractors}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/contractors/${row._id}`)}
        mobileRow={(row) => ({
          to: `/contractors/${row._id}`,
          title: row.name,
          subtitle: row.phone || "-",
          right: <StatusBadge status={row.status} />,
          actions: (
            <>
              <Can permission="contractors.update">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Edit}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingContractor(row);
                    setIsOpen(true);
                  }}
                >
                  Edit
                </Button>
              </Can>
              <Can permission="contractors.delete">
                <Button
                  variant="danger-ghost"
                  size="sm"
                  leftIcon={Trash2}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletingContractor(row);
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
            title="No contractors found"
            description="Create a contractor to start assigning tasks."
            actionLabel={can("contractors.create") ? "New Contractor" : null}
            onAction={can("contractors.create") ? () => { setEditingContractor(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal
        isOpen={isOpen}
        title={editingContractor ? "Edit Contractor" : "New Contractor"}
        onClose={() => setIsOpen(false)}
      >
        <ContractorForm
          initialData={editingContractor}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) =>
            editingContractor
              ? updateMutation.mutateAsync({ id: editingContractor._id, data })
              : createMutation.mutateAsync(data)
          }
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingContractor}
        title="Delete Contractor"
        description={`Are you sure you want to delete "${deletingContractor?.name}"? This action cannot be undone. You can only delete contractors that have no associated contracts.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteMutation.mutateAsync(deletingContractor._id)}
        onCancel={() => setDeletingContractor(null)}
        variant="danger"
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
};
