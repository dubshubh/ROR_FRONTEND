"use client";

import Link from "next/link";
import { Menu, Shield } from "lucide-react";
import { SiteBrand } from "@/components/layout/site-brand";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function PublicHeader() {
  const { data } = useSiteSettings();

  return (
    <header className="border-b-2 border-primary bg-[#101010]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Menu className="h-5 w-5 text-[#ffb3b1]" />
          <SiteBrand logo={data?.logo} compact />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="outline" size="icon" title="Admin Login">
            <Link href="/admin/login" aria-label="Admin login" title="Admin Login">
              <Shield className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
