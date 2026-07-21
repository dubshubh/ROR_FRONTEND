"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { getCurrentAdmin, logoutAdmin } from "@/services/auth.service";

export function useAuth() {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }, [router]);

  const requireSession = useCallback(async () => {
    try {
      return await getCurrentAdmin();
    } catch {
      router.replace("/admin/login");
      return null;
    }
  }, [router]);

  return { logout, requireSession };
}
