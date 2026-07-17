"use client";

import Link from "next/link";
import { Menu, Shield } from "lucide-react";
import { SiteBrand } from "@/components/layout/site-brand";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

const navLinks = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/#events", label: "Events" },
  { href: "/#partners", label: "Brand Partners" },
  { href: "/#gallery", label: "Photography" },
  { href: "/contact", label: "Contact" }
];

export function PublicHeader() {
  const { data } = useSiteSettings();

  return (
    <header className="border-b-2 border-red-600 bg-[#0a0a0a]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-4">
        <div className="flex items-center gap-4">
          <Menu className="h-5 w-5 text-[#d91b1b]" />
          <SiteBrand logo={data?.logo} compact />
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rebel-hover rounded-lg px-4 py-2 text-sm font-semibold text-[#e8d9c9] transition-all hover:bg-red-900/20 hover:text-[#d91b1b]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
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
