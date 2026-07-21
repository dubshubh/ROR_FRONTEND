"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            placeholderData: (previousData: unknown) => previousData,
            retry: (failureCount, error) => {
              if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) return false;
              return failureCount < 1;
            }
          }
        }
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
