"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LayoutDashboard, LogOut, Shield, Users } from "lucide-react";
import { SiteBrand } from "@/components/layout/site-brand";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { logout, requireToken } = useAuth();
  const { data } = useSiteSettings();

  useEffect(() => {
    requireToken();
  }, [requireToken]);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r-2 border-primary bg-[#1c1b1b] p-5 md:block">
        <div className="mb-10 border-b border-[#5b403f] pb-6">
          <SiteBrand logo={data?.logo} compact />
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-xl text-[#ffb3b1]">Road Captain</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">SGT at arms - nomad</div>
            </div>
          </div>
        </div>
        <nav className="grid gap-3">
          <Link className="rebel-hover flex items-center gap-3 border border-transparent px-4 py-4 font-display text-xl uppercase text-[#ffdad8] hover:border-primary hover:bg-primary hover:text-primary-foreground" href="/admin/dashboard">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link className="rebel-hover flex items-center gap-3 border border-transparent px-4 py-4 font-display text-xl uppercase text-[#ffdad8] hover:border-primary hover:bg-primary hover:text-primary-foreground" href="/admin/riders">
            <Users className="h-4 w-4" /> Roster
          </Link>
        </nav>
        <Button className="absolute bottom-5 left-5 right-5" variant="outline" onClick={logout}>
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </aside>
      <main className="md:pl-72">
        <header className="border-b-2 border-primary bg-[#101010] md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <SiteBrand logo={data?.logo} compact />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-8">{children}</div>
        <div className="md:pl-0">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
