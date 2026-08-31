import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, History, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { usePermission } from "../../../hooks/usePermission";
import {
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from "../api";

import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

import { AttendanceFormModal } from "../components/AttendanceFormModal";
import { AttendancesRollCallMode } from "../components/AttendancesRollCallMode";
import { AttendancesHistoryMode } from "../components/AttendancesHistoryMode";
import { Tabs } from "../../../components/ui/Tabs";

import { getApiErrorMessage } from "../../../utils/apiResponse";

export const AttendancesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();

  // Mode: "today" (Roll-Call) | "history"
  const [viewMode, setViewMode] = useState("today");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingAttendance, setDeletingAttendance] = useState(null);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      toast.success("Attendance record created successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to create attendance")),
  });

  const updateMutation = useMutation({
    mutationFn: updateAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      toast.success("Attendance record updated successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to update attendance")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      toast.success("Attendance record deleted successfully");
      setDeletingAttendance(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to delete attendance"));
    },
  });

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsOpen(true);
  };

  const handleDelete = (record) => {
    setDeletingAttendance(record);
  };

  return (
    <div className="space-y-4 lg:space-y-5 animate-[fadeSlideUp_0.3s_ease_both] pb-8">
      {/* ── Page Header ── */}
      <PageHeader
        title="Attendance"
        description="Daily employee roll-call and historical work logs."
        actions={
          <Can permission="attendances.create">
            <Button
              onClick={() => {
                setEditingRecord(null);
                setIsOpen(true);
              }}
              leftIcon={Plus}
              className="shadow-xs"
            >
              Manual Entry
            </Button>
          </Can>
        }
      />

      {/* ── Mode Switcher Tabs ── */}
      <Tabs
        tabs={[
          { id: "today", label: "Roll-Call", icon: Clock },
          { id: "history", label: "History", icon: History },
        ]}
        activeTab={viewMode}
        onChange={setViewMode}
        fullWidth={true}
      />

      {/* ── ACTIVE MODE COMPONENT ── */}
      {viewMode === "today" ? (
        <AttendancesRollCallMode />
      ) : (
        <AttendancesHistoryMode 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}

      {/* ── Modals ── */}
      <AttendanceFormModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialData={editingRecord}
        onSubmit={(data) => {
          if (editingRecord) {
            updateMutation.mutate({ id: editingRecord._id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deletingAttendance}
        title="Delete Attendance Record"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        onConfirm={() => deleteMutation.mutate(deletingAttendance._id)}
        onCancel={() => setDeletingAttendance(null)}
        isSubmitting={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};
