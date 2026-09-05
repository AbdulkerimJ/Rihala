
export const FullScreenLoader = ({ message = "Loading Rihala..." }) => {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-main p-4">
      <div className="flex flex-col items-center gap-5">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand" />
        {message && (
          <span className="text-xs font-medium text-secondary">{message}</span>
        )}
      </div>
    </div>
  );
};
