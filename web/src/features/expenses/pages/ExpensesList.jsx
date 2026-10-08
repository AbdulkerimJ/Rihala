import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMemo, useState } from "react";
import { Save, X, Receipt, Edit } from "lucide-react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  createExpense,
  voidExpense,
  getExpenses,
  updateExpense,
} from "../api";
import { EXPENSE_CATEGORIES } from "../constants";
import { useForm, Controller } from "react-hook-form";
import { FormRootError } from "../../../components/ui/FormRootError";
import { FormField } from "../../../components/ui/FormField";
import { Select } from "../../../components/ui/Select";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Can } from "../../../components/Can";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { FilterBar } from "../../../components/ui/FilterBar";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  applyServerErrors,
  cleanFilterParams,
  getApiErrorMessage,
  unwrapListResponse,
} from "../../../utils/apiResponse";
import { formatDate, getLocalISODate } from "../../../utils/formatters";

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
  status: "",
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
          date: getLocalISODate(),
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
              disabled={!!initialData}
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
          disabled={!!initialData}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>
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
  const debouncedSearch = useDebounce(filters.search, 300);
  const [editingExpense, setEditingExpense] = useState(null);
  const [voidingExpense, setVoidingExpense] = useState(null);
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
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Expense created successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Expense updated successfully");
      setIsOpen(false);
    },
  });

  const voidMutation = useMutation({
    mutationFn: voidExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Expense voided successfully");
      setVoidingExpense(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to void expense"));
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
      accessor: (row) => (
        <MoneyDisplay 
          amount={row.amount} 
          variant="danger" 
          className={row.status === 'voided' ? 'line-through opacity-50' : ''} 
        />
      ),
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
      header: "Status",
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="expenses.update">
            <Button
              variant="ghost"
              size="icon"
              leftIcon={Edit}
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                setEditingExpense(row);
                setIsOpen(true);
              }}
              title="Edit"
            />
          </Can>
          <Can permission="expenses.void">
            {row.status !== "voided" && (
              <Button
                variant="danger-ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  setVoidingExpense(row);
                }}
              >
                Void
              </Button>
            )}
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
              leftIcon={Receipt}
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
        filters={filters}
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

        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "Active" },
            { value: "voided", label: "Voided" },
            { value: "all", label: "All Statuses" },
          ]}
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
        mobileRow={(row) => ({
          title: (
            <span className="flex items-center gap-2 min-w-0">
              <StatusBadge status={row.category} label={row.category} className="shrink-0" />
              <span className="truncate">{row.description || "-"}</span>
            </span>
          ),
          subtitle: `${formatDate(row.date)} • by ${row.createdBy?.name || "Unknown"}`,
          right: (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold text-danger ${row.status === 'voided' ? 'line-through opacity-50 text-secondary' : ''}`}>
                -<MoneyDisplay amount={row.amount} className="text-inherit font-bold" />
              </span>
              <StatusBadge status={row.status} />
            </div>
          ),
          actions: (
            <>
              <Can permission="expenses.update">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Edit}
                  onClick={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    setEditingExpense(row);
                    setIsOpen(true);
                  }}
                >
                  Edit
                </Button>
              </Can>
              <Can permission="expenses.void">
                {row.status !== "voided" && (
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      setVoidingExpense(row);
                    }}
                  >
                    Void
                  </Button>
                )}
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
            title="No expenses found"
            description="Create the first expense for this workshop."
            actionLabel={can("expenses.create") ? "New Expense" : null}
            actionIcon={Receipt}
            onAction={can("expenses.create") ? () => { setEditingExpense(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal
        isOpen={isOpen}
        title={editingExpense ? "Edit Expense" : "New Expense"}
        onClose={() => setIsOpen(false)}
      >
        <ExpenseForm
          initialData={editingExpense}
          onSubmit={(data) =>
            editingExpense
              ? updateMutation.mutateAsync({ 
                  id: editingExpense._id, 
                  data: { category: data.category, description: data.description } 
                })
              : createMutation.mutateAsync(data)
          }
          onClose={() => setIsOpen(false)}
        />
      </Modal>

      <VoidReasonDialog
        isOpen={!!voidingExpense}
        title="Void Expense"
        description={`Are you sure you want to void this expense of ${voidingExpense?.amount} ETB?`}
        onCancel={() => setVoidingExpense(null)}
        onConfirm={(reason) => voidMutation.mutate({ id: voidingExpense._id, voidReason: reason })}
        isSubmitting={voidMutation.isPending}
        confirmLabel="Void Expense"
      />
    </div>
  );
};
