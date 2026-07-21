"use client";

import Link from "next/link";
import { Menu, Shield, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteBrand } from "@/components/layout/site-brand";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

const navLinks = [
  { href: "/#home", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/#events", label: "Events" },
  { href: "/#rides", label: "Rides" },
  { href: "/#partners", label: "Brand Partners" },
  { href: "/#gallery", label: "Photography" },
  { href: "/#intercity", label: "Intercity" },
  { href: "/contact", label: "Contact" }
];

export function PublicHeader() {
  const { data } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <header className="border-b-2 border-red-600 bg-[#0a0a0a]">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 px-3 py-3 sm:gap-6 sm:px-4 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <div className="flex h-8 w-10 shrink-0 items-center justify-center border border-red-600 font-display text-base text-[#d91b1b] sm:h-9 sm:w-11 sm:text-lg" aria-label="ROR">ROR</div>
          <SiteBrand logo={data?.logo} compact />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rebel-hover rounded-lg px-2 py-2 text-xs font-semibold text-[#e8d9c9] transition-all hover:bg-red-900/20 hover:text-[#d91b1b] xl:px-4 xl:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild className="hidden sm:inline-flex" variant="outline" size="icon" title="Admin Login">
            <Link href="/admin/login" aria-label="Admin login" title="Admin Login">
              <Shield className="h-4 w-4" />
            </Link>
          </Button>
          <Button className="lg:hidden" variant="outline" size="icon" title="Navigation" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {isOpen ? <button className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden" aria-label="Close navigation" onClick={() => setIsOpen(false)} /> : null}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,340px)] flex-col border-r-2 border-red-600 bg-[#0a0a0a] p-4 shadow-[20px_0_60px_rgba(0,0,0,0.75)] transition-transform duration-300 lg:hidden ${isOpen ? "translate-x-0" : "-translate-x-full"}`} aria-hidden={!isOpen}>
        <div className="flex items-center justify-between gap-3 border-b border-red-900 pb-4">
          <SiteBrand logo={data?.logo} compact />
          <Button variant="outline" size="icon" title="Close navigation" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
        </div>
        <nav className="mt-5 grid gap-1 overflow-y-auto">
          {navLinks.map((link, index) => (
            <Link key={link.label} href={link.href} onClick={() => setIsOpen(false)} className="rebel-hover flex min-h-12 items-center gap-4 border border-transparent px-4 py-3 font-display text-xl uppercase text-[#e8d9c9] hover:border-red-600 hover:bg-red-950/30">
              <span className="font-mono text-[10px] text-[#d91b1b]">{String(index + 1).padStart(2, "0")}</span>{link.label}
            </Link>
          ))}
        </nav>
        <Link href="/admin/login" onClick={() => setIsOpen(false)} className="mt-auto flex min-h-12 items-center justify-center gap-2 border border-red-600 px-4 font-mono text-xs uppercase text-[#e8d9c9] hover:bg-red-950/40">
          <Shield className="h-4 w-4" /> Admin Login
        </Link>
      </aside>
    </header>
  );
}
