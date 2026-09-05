import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // A zero staleTime refetches the moment a component mounts, throwing
        // away data the server just streamed in.
        staleTime: 30_000,
        // Retrying a 401 or a 404 only delays the error the user needs to see.
        retry: (failureCount, error) => {
          const status = (error as { status?: number }).status;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}
