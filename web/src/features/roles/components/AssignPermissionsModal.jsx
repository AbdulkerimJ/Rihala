import { useState } from "react";
import { X } from "lucide-react";
import { getApiErrorMessage } from "../../../utils/apiResponse";
import { PermissionsSelector } from "./PermissionsSelector";
import { Button } from "../../../components/ui/Button";

export const AssignPermissionsForm = ({ onClose, onSubmit, role, isSubmitting }) => {
  const [selectedPermissions, setSelectedPermissions] = useState(() => {
    const initialIds = (role?.permissions || []).map((p) =>
      typeof p === "string" ? p : p._id
    );
    return new Set(initialIds);
  });
  const [submitError, setSubmitError] = useState(null);

  const handleSave = async () => {
    try {
      setSubmitError(null);
      await onSubmit({ permissions: Array.from(selectedPermissions) });
      onClose();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  return (
    <div className="relative">
      <div className="p-6 space-y-6">
        <p className="text-sm text-secondary">
          Role: <span className="font-medium text-brand">{role?.name}</span>
        </p>

        <PermissionsSelector
          selectedPermissions={selectedPermissions}
          onChange={setSelectedPermissions}
        />

        {submitError && (
          <div className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
            {submitError}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-2 flex justify-end gap-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Button type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting} leftIcon={X}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Save Permissions
        </Button>
      </div>
    </div>
  );
};
