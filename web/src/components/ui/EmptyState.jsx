import { Button } from "./Button";
export const EmptyState = ({ title, description, actionLabel, actionIcon: ActionIcon, onAction }) => {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <h3 className="text-2xl font-bold tracking-tight text-primary font-display">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-secondary">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction} leftIcon={ActionIcon}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
};
