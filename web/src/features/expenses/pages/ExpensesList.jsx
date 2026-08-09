import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import {
  getApiErrorMessage,
  unwrapListResponse,
} from "../../../utils/apiResponse";

const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  date: z.string().min(1),
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
    handleSubmit,
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

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="block text-sm text-primary">Category</label>
        <select
          {...register("category")}
          className="mt-1 w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
        >
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-xs text-danger">{errors.category.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm text-primary">Amount</label>
        <input
          type="number"
          step="0.01"
          {...register("amount")}
          className="mt-1 w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
        {errors.amount && (
          <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm text-primary">Description</label>
        <input
          {...register("description")}
          className="mt-1 w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
      </div>
      <div>
        <label className="block text-sm text-primary">Date</label>
        <input
          type="date"
          {...register("date")}
          className="mt-1 w-full rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
        {errors.date && (
          <p className="mt-1 text-xs text-danger">{errors.date.message}</p>
        )}
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};

export const ExpensesList = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const params = useMemo(
    () => ({
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value),
      ),
      page,
      limit: 20,
    }),
    [filters, page],
  );
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["expenses", params],
    queryFn: () => getExpenses(params),
  });
  const { items: expenses, pagination } = unwrapListResponse(data);

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense created successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to create expense")),
  });
  const updateMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense updated successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to update expense")),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted successfully");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to delete expense")),
  });

  if (isLoading)
    return <LoadingSkeleton variant="default" rowCount={6} showSearch />;
  if (isError)
    return (
      <ErrorState
        description={getApiErrorMessage(error, "Failed to load expenses.")}
      />
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
      <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-5 shadow-sm">
        <input
          placeholder="Search description"
          value={filters.search}
          onChange={(e) =>
            setFilters((p) => ({ ...p, search: e.target.value }))
          }
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((p) => ({ ...p, category: e.target.value }))
          }
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        />
        <select
          value={filters.sort}
          onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
          className="rounded-md border border-border bg-main px-3 py-2 text-primary"
        >
          <option value="-date">Newest date</option>
          <option value="date">Oldest date</option>
          <option value="amount">Amount ascending</option>
          <option value="-amount">Amount descending</option>
          <option value="createdAt">Created oldest</option>
          <option value="-createdAt">Created newest</option>
        </select>
      </div>
      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Create the first expense for this workshop."
          actionLabel="New Expense"
          onAction={() => setIsOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary">
                  Created by
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((expense) => (
                <tr key={expense._id} className="transition-colors hover:bg-main group">
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={expense.category}
                      label={expense.category}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {expense.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary">
                    {expense.createdBy?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Can permission="expenses.update">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          onClick={() => {
                            setEditingExpense(expense);
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
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          onClick={() => deleteMutation.mutate(expense._id)}
                          disabled={deleteMutation.isPending && deleteMutation.variables === expense._id}
                        >
                          Delete
                        </Button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        isOpen={isOpen}
        title={editingExpense ? "Edit Expense" : "New Expense"}
        onClose={() => setIsOpen(false)}
      >
        <ExpenseForm
          initialData={editingExpense}
          onSubmit={(data) =>
            editingExpense
              ? updateMutation.mutateAsync({ id: editingExpense._id, data })
              : createMutation.mutateAsync(data)
          }
          onClose={() => setIsOpen(false)}
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
