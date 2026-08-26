import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../api";
import { EXPENSE_CATEGORIES } from "../constants";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { FormRootError } from "../../../components/ui/FormRootError";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  applyServerErrors,
  cleanFilterParams,
  getApiErrorMessage,
  unwrapListResponse,
} from "../../../utils/apiResponse";
import { ExpenseDetailModal } from "../components/ExpenseDetailModal";

const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: "Category is required" }),
  }),
  amount: z.coerce.number({ error: "Amount is required" }).positive("Amount must be greater than 0"),
  description: z.string().trim().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
});

const initialFilters = {
  search: "",
  category: "",
  from: "",
  to: "",
  sort: "-date",
};

const ExpenseForm = ({ initialData, onSubmit, onClose }) => {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData
      ? {
          category: initialData.category || EXPENSE_CATEGORIES[0],
          amount: initialData.amount || "",
          description: initialData.description || "",
          date: initialData.date ? String(initialData.date).slice(0, 10) : "",
        }
      : {
          category: EXPENSE_CATEGORIES[0],
          amount: "",
          description: "",
          date: "",
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
      <FormField label="Category" required error={errors.category?.message}>
        <Select
          {...register("category")}
          error={errors.category?.message}
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </FormField>

      <FormField label="Amount (ETB)" required error={errors.amount?.message}>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              {...field}
              error={errors.amount?.message}
              placeholder="0"
            />
          )}
        />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <Input
          {...register("description")}
          error={errors.description?.message}
          placeholder="Optional description"
        />
      </FormField>

      <FormField label="Date" required error={errors.date?.message}>
        <Input
          type="date"
          {...register("date")}
          error={errors.date?.message}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save Expense
        </Button>
      </div>
    </form>
  );
};

export const ExpensesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const params = useMemo(
    () => cleanFilterParams(filters, { page, limit: 20 }),
    [filters, page],
  );

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["expenses", params],
    queryFn: () => getExpenses(params),
    placeholderData: keepPreviousData,
  });
  const { items: expenses, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["expenses"],
    queryFn: getExpenses,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense created successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense updated successfully");
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted successfully");
    },
  });

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const columns = [
    {
      header: "Category",
      accessor: (row) => <StatusBadge status={row.category} label={row.category} />,
    },
    {
      header: "Amount",
      accessor: (row) => <MoneyDisplay amount={row.amount} variant="danger" />,
    },
    {
      header: "Description",
      accessor: (row) => row.description || "-",
      className: "text-secondary",
    },
    {
      header: "Date",
      accessor: (row) => formatDate(row.date),
      className: "text-secondary",
    },
    {
      header: "Created By",
      accessor: (row) => row.createdBy?.name || "-",
      className: "text-secondary hidden md:table-cell",
      hiddenOnMobile: true,
    },
    {
      header: "Actions",
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="expenses.update">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingExpense(row);
                setIsOpen(true);
              }}
            >
              Edit
            </Button>
          </Can>
          <Can permission="expenses.delete">
            <Button
              variant="ghostDanger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteMutation.mutate(row._id);
              }}
              isLoading={deleteMutation.isPending && deleteMutation.variables === row._id}
            >
              Delete
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(error, "Failed to load expenses.")}
      />
    );
  }

  const hasActiveFilters = Object.values(filters).some(
    (val) => val !== "" && val !== "-date"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track workshop spending with filters and search."
        actions={
          <Can permission="expenses.create">
            <Button
              onClick={() => {
                setEditingExpense(null);
                setIsOpen(true);
              }}
            >
              New Expense
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchPlaceholder="Search description..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={hasActiveFilters ? handleClearFilters : undefined}
      >
        <Select
          value={filters.category}
          onChange={(e) => { setFilters(p => ({ ...p, category: e.target.value })); setPage(1); }}
          placeholder="All categories"
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />

        <Input
          type="date"
          value={filters.from}
          onChange={(e) => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
        />

        <Input
          type="date"
          value={filters.to}
          onChange={(e) => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
        />

        <Select
          value={filters.sort}
          onChange={(e) => { setFilters(p => ({ ...p, sort: e.target.value })); setPage(1); }}
          options={[
            { value: "-date", label: "Newest date" },
            { value: "date", label: "Oldest date" },
            { value: "amount", label: "Amount ascending" },
            { value: "-amount", label: "Amount descending" },
            { value: "-createdAt", label: "Created newest" },
            { value: "createdAt", label: "Created oldest" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={expenses}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => setViewingExpense(row)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        mobileRenderer={(row) => (
          <div className="flex flex-col gap-2.5 p-4" onClick={() => setViewingExpense(row)}>
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={row.category} label={row.category} />
              <MoneyDisplay amount={row.amount} variant="danger" className="text-sm font-bold" />
            </div>
            
            {row.description && (
              <p className="text-sm text-secondary mt-1">{row.description}</p>
            )}
            
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Date</span>
                <span className="text-sm text-secondary font-medium">{formatDate(row.date)}</span>
              </div>
              
              <div className="flex gap-2 justify-end mt-2">
                <Can permission="expenses.update">
                  <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setEditingExpense(row); setIsOpen(true); }}>
                    Edit
                  </Button>
                </Can>
                <Can permission="expenses.delete">
                  <Button 
                    variant="ghostDanger" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(row._id); }}
                    isLoading={deleteMutation.isPending && deleteMutation.variables === row._id}
                  >
                    Delete
                  </Button>
                </Can>
              </div>
            </div>
          </div>
        )}
        emptyState={
          <EmptyState
            title="No expenses found"
            description="Create the first expense for this workshop."
            actionLabel={can("expenses.create") ? "New Expense" : null}
            onAction={can("expenses.create") ? () => { setEditingExpense(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title={editingExpense ? "Edit Expense" : "Record Expense"} onClose={() => setIsOpen(false)}>
        <ExpenseForm
          initialData={editingExpense}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => {
            if (editingExpense) {
              return updateMutation.mutateAsync({ id: editingExpense._id, data });
            }
            return createMutation.mutateAsync(data);
          }}
        />
      </Modal>

      <ExpenseDetailModal 
        isOpen={!!viewingExpense} 
        onClose={() => setViewingExpense(null)} 
        expense={viewingExpense} 
      />
    </div>
  );
};
