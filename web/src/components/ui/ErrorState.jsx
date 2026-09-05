import { Button } from "./Button";

export const ErrorState = ({
  title = "Something went wrong",
  description,
  onRetry,
}) => {
  return (
    <div className="rounded-2xl border border-danger/20 bg-danger/5 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-danger">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-secondary">
        {description}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="danger" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
};
