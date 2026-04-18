// ═══════════════════════════════════════════════════════════════════
//  QUERY CLIENT — Global cache configuration for TanStack Query.
//  Separating this from main.tsx keeps the entry point clean and
//  allows importing the client in mutation hooks for invalidation.
// ═══════════════════════════════════════════════════════════════════

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 1 minute. During this window,
      // component remounts will serve from cache instantly (no spinner).
      staleTime: 60_000,

      // Inactive cache entries are garbage-collected after 5 minutes.
      // This prevents unbounded memory growth from navigating many pages.
      gcTime: 5 * 60_000,

      // Retry once on failure (covers transient network blips).
      retry: 1,

      // Refetch when the user returns to the browser tab.
      refetchOnWindowFocus: true,
    },
  },
});
