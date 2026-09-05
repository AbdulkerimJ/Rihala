import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/apiResponse';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (!mutation.meta?.suppressToast) {
        const errorMessage = getApiErrorMessage(error, "An error occurred");
        toast.error(errorMessage, { id: errorMessage });
      }
    },
  }),
  queryCache: new QueryCache({
    onError: (error) => {
      const errorMessage = getApiErrorMessage(error, "Failed to load data");
      toast.error(errorMessage, { id: errorMessage });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
