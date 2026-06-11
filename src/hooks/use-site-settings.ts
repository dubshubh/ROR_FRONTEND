"use client";

import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/services/settings.service";

export function useSiteSettings() {
  return useQuery({ queryKey: ["site-settings"], queryFn: getSiteSettings });
}
