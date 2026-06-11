"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    document.cookie = "adminToken=; path=/; max-age=0";
    router.replace("/admin/login");
  }, [router]);

  const requireToken = useCallback(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) router.replace("/admin/login");
    return token;
  }, [router]);

  return { logout, requireToken };
}
