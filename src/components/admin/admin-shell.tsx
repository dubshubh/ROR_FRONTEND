"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/riders", label: "Roster", icon: Users }
  ];

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
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                className={`rebel-hover flex items-center gap-3 border px-4 py-4 font-display text-xl uppercase ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-transparent text-[#ffdad8] hover:border-primary hover:bg-primary hover:text-primary-foreground"
                }`}
                href={href}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
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
          <nav className="grid grid-cols-2 border-t border-[#5b403f] px-3 py-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  className={`flex min-h-11 items-center justify-center gap-2 border px-3 py-2 font-display text-base uppercase ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent text-[#ffdad8]"
                  }`}
                  href={href}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>
        </header>
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-8">{children}</div>
        <div className="md:pl-0">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
