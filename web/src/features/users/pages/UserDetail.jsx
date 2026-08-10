import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDateTime } from "../../../utils/formatters";
import {
  getApiErrorMessage,
  unwrapEntityResponse,
} from "../../../utils/apiResponse";

export const UserDetail = () => {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  });

  const user = unwrapEntityResponse(data);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !user) {
    return (
      <ErrorState
        description={getApiErrorMessage(error, "Failed to load user details.")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">{user.name}</h1>
        <p className="mt-1 text-sm text-secondary">
          User details and account status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Email</div>
          <div className="mt-2 text-base text-primary">{user.email}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Status</div>
          <div className="mt-2">
            <StatusBadge status={user.status} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Roles</div>
          <div className="mt-2 text-base text-primary">
            {user.roles?.length
              ? user.roles.map((role) => role.name || role).join(", ")
              : "-"}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Created</div>
          <div className="mt-2 text-base text-primary">
            {formatDateTime(user.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};
