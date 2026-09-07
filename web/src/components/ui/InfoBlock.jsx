export const InfoBlock = ({ title, children, className = "" }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h3 className="text-xs font-bold text-secondary uppercase tracking-widest px-1">
          {title}
        </h3>
      )}
      <div className="bg-surface border border-border/50 rounded-xl p-4 sm:p-5 flex flex-col gap-3 shadow-sm">
        {children}
      </div>
    </div>
  );
};

export const InfoRow = ({ label, value, className = "" }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 ${className}`}>
      <span className="text-sm font-medium text-secondary shrink-0">{label}</span>
      <span className="text-sm font-semibold text-primary text-left sm:text-right min-w-0 truncate">{value}</span>
    </div>
  );
};
