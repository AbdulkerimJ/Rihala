import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
export const PageHeader = ({ title, description, actions, backTo, backLabel }) => {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
      {/* Top row: back + title + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {backTo && (
            <Link
              to={backTo}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main transition-colors shrink-0"
              title={backLabel || "Back"}
              aria-label={backLabel || "Back"}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary font-display leading-tight truncate">
              {title}
            </h1>
            {/* Description: hidden on mobile to save space, shown on sm+ */}
            {description && (
              <p className="hidden sm:block mt-1 text-sm text-secondary">{description}</p>
            )}
          </div>
        </div>

        {/* Actions — compact on mobile */}
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
