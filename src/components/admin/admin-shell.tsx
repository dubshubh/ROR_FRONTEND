"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";
import { Handshake, LayoutDashboard, LogOut, Mail, PanelsTopLeft, ShieldCheck, Users } from "lucide-react";
import { SiteBrand } from "@/components/layout/site-brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { logout, requireSession } = useAuth();
  const { data } = useSiteSettings();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  const navItems = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/riders", label: "Riders", icon: Users },
    { href: "/admin/content", label: "Public Site", icon: PanelsTopLeft },
    { href: "/admin/partner-enquiries", label: "Partners", icon: Handshake },
    { href: "/admin/email-center", label: "Email", icon: Mail }
  ];
  const activeItem = navItems.find(({ href }) => pathname === href || pathname.startsWith(`${href}/`)) ?? navItems[0];

  useEffect(() => {
    let active = true;
    void requireSession().then((admin) => { if (active && admin) setAuthorized(true); });
    return () => { active = false; };
  }, [requireSession]);

  if (!authorized) return <div className="admin-auth-check" role="status" aria-live="polite"><span/><p>Verifying secure session</p></div>;

  return (
    <div className="admin-shell-root min-h-screen">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-[#67272a] p-5 md:flex">
        <div className="mb-7 border-b border-[#5b403f] pb-6">
          <SiteBrand logo={data?.logo} compact />
        </div>
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-[#806d63]">Command navigation</p>
        <nav className="grid min-h-0 gap-2 overflow-y-auto pr-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                className={`admin-nav-link flex items-center gap-3 border px-4 py-3 font-display text-lg uppercase ${
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
        <div className="mt-auto grid gap-2 border-t border-[#3d2828] pt-4">
          <Button variant="secondary" onClick={logout}><LogOut className="h-4 w-4" /> Secure logout</Button>
        </div>
      </aside>
      <main className="admin-main md:pl-72">
        <header className="sticky top-0 z-30 border-b border-primary bg-[#101010]/95 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <SiteBrand logo={data?.logo} compact />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div className="border-t border-[#352323] px-4 py-2"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-muted-foreground">Admin control panel</span></div>
          <nav className="grid grid-cols-5 border-t border-[#5b403f] px-1 py-2 sm:px-2">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 border px-1 py-2 font-display text-[10px] uppercase sm:flex-row sm:gap-2 sm:px-3 sm:text-base ${
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
        <header className="admin-desktop-bar hidden md:flex"><div><span>Admin workspace</span><strong>{activeItem.label}</strong></div><div><ShieldCheck /><span>Secure session</span></div></header>
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
