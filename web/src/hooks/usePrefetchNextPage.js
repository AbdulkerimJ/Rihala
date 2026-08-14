import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Prefetches the next page of a paginated query if more pages are available.
 */
export const usePrefetchNextPage = ({ queryKey, queryFn, pagination, params, page }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: [...queryKey, nextParams],
        queryFn: () => queryFn(nextParams),
      });
    }
  }, [pagination, page, params, queryClient, queryKey, queryFn]);
};
