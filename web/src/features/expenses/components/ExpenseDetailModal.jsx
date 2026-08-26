import React from "react";
import { Modal } from "../../../components/ui/Modal";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { formatDate } from "../../../utils/formatters";

export const ExpenseDetailModal = ({ isOpen, onClose, expense }) => {
  if (!expense) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense Details" maxWidth="md">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-main/50 border border-border/50">
          <div>
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">Category</span>
            <StatusBadge status={expense.category} label={expense.category} />
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">Amount</span>
            <MoneyDisplay amount={expense.amount} variant="danger" className="text-xl font-bold" />
          </div>
        </div>

        <DetailSection title="Information">
          <DetailItem label="Date" value={formatDate(expense.date)} />
          <DetailItem label="Description" value={expense.description || "No description provided."} />
          <DetailItem label="Recorded By" value={expense.createdBy?.name || expense.createdByName || "Unknown"} />
        </DetailSection>

        {expense.status === "voided" && (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 space-y-2">
            <h4 className="text-sm font-bold text-danger flex items-center gap-2">
              Voided Record
            </h4>
            <p className="text-sm text-danger/80">
              <span className="font-semibold">Reason:</span> {expense.voidReason || "Not provided"}
            </p>
            {(expense.voidedBy || expense.voidedAt) && (
              <p className="text-xs text-danger/60">
                By {expense.voidedByName || "Unknown"} on {expense.voidedAt ? formatDate(expense.voidedAt) : "Unknown date"}
              </p>
            )}
          </div>
        )}

        <SystemInfoSection
          id={expense._id}
          idLabel="Expense ID"
          createdAt={expense.createdAt}
          updatedAt={expense.updatedAt}
        />
      </div>
    </Modal>
  );
};
