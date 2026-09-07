import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserById, updateUser } from "../api";
import { ShieldCheck, Mail, Key, Calendar, Activity, CheckCircle, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { formatDateTime } from "../../../utils/formatters";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { usePermission } from "../../../hooks/usePermission";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Modal } from "../../../components/ui/Modal";
import { InfoBlock, InfoRow } from "../../../components/ui/InfoBlock";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { AssignRolesForm } from "../components/AssignRolesModal";

export const UserDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", id],
    queryFn: () => getUserById(id),
    enabled: !!id && can("users.read"),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Roles updated successfully");
      setIsRolesModalOpen(false);
    },
  });

  const handleAssignRolesSubmit = async (formData) => {
    await updateMutation.mutateAsync({ id, data: formData });
  };

  const user = unwrapEntityResponse(data);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !user) return <ErrorState description={getApiErrorMessage(error, "Failed to load user details.")} />;

  // Deduplicate permissions across all roles for a summary view
  const allPermissions = user.roles?.reduce((acc, role) => {
    role.permissions?.forEach(p => {
      if (!acc.some(existing => existing.name === p.name)) {
        acc.push(p);
      }
    });
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description="System user account and permissions."
        backTo="/users"
        backLabel="Back to users"
        titleCustom={
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">{user.name}</h1>
            <StatusBadge status={user.status} />
            {user.emailVerified && <StatusBadge status="verified" label="Verified" />}
          </div>
        }
        actions={
          <Can permission="users.assign-role">
            <Button variant="primary" leftIcon={ShieldCheck} onClick={() => setIsRolesModalOpen(true)}>
              Assign Roles
            </Button>
          </Can>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Email Address" value={<span className="text-sm truncate block">{user.email}</span>} icon={Mail} />
        <SummaryCard title="Account Status" value={<StatusBadge status={user.status} />} icon={Activity} />
        <SummaryCard title="Total Roles" value={`${user.roles?.length || 0} Roles`} icon={Key} />
        <SummaryCard title="Created On" value={<span className="text-sm">{formatDateTime(user.createdAt)}</span>} icon={Calendar} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Roles & Permissions Breakdown</h3>
            {user.roles?.length > 0 ? (
              <div className="space-y-4">
                {user.roles.map(role => (
                  <div key={role._id} className="bg-surface border border-border/50 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-main/30 px-5 py-3 border-b border-border/50 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-accent" />
                      <h3 className="font-bold text-primary">{role.name}</h3>
                      {role.isSystemRole && <span className="text-[10px] uppercase tracking-wider font-bold bg-danger/10 text-danger px-2 py-0.5 rounded-full">System</span>}
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Grants Access To:</p>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions?.map(perm => (
                          <span key={perm._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/5 border border-accent/10 text-xs font-medium text-primary">
                            <CheckCircle className="w-3 h-3 text-accent" />
                            {perm.name}
                          </span>
                        ))}
                        {(!role.permissions || role.permissions.length === 0) && (
                          <span className="text-sm text-secondary italic">No explicit permissions</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-xl bg-surface/30">
                <Shield className="h-8 w-8 text-muted mb-3" />
                This user has no assigned roles. They will not be able to access any system features.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <InfoBlock title="Security Summary">
            <InfoRow label="Effective Permissions" value={allPermissions.length} />
            <InfoRow label="Email Verified" value={user.emailVerified ? "Yes" : "No"} />
            <InfoRow label="Status" value={<StatusBadge status={user.status} />} />
          </InfoBlock>

          <SystemInfoSection 
            id={user._id} 
            idLabel="User ID" 
            createdAt={user.createdAt} 
            updatedAt={user.updatedAt} 
          />
        </div>
      </div>

      <Modal isOpen={isRolesModalOpen} title="Assign Roles" onClose={() => setIsRolesModalOpen(false)} maxWidth="max-w-lg">
        <AssignRolesForm onClose={() => setIsRolesModalOpen(false)} onSubmit={handleAssignRolesSubmit} user={user} isSubmitting={updateMutation.isPending} />
      </Modal>
    </div>
  );
};
