
export const DetailSection = ({ title, children, className = "" }) => {
  return (
    <div className={`rounded-xl border border-border bg-surface shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="border-b border-border bg-main/30 px-5 py-3">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-widest">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
};

export const DetailItem = ({ label, value, className = "", variant = "default" }) => {
  if (variant === "prominent") {
    return (
      <div className={`flex flex-col gap-1 py-3 border-b border-border/50 last:border-0 ${className}`}>
        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{label}</span>
        <div className="text-2xl font-black text-primary tabular-nums">{value}</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-4 py-3 border-b border-border/50 last:border-0 ${className}`}>
      <span className="text-sm font-medium text-secondary shrink-0">{label}</span>
      <div className="text-sm text-primary font-semibold text-right min-w-0 truncate">{value}</div>
    </div>
  );
};
