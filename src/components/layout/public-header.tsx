"use client";

import Link from "next/link";
import { ArrowUpRight, LockKeyhole, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { SiteBrand } from "@/components/layout/site-brand";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/calendar", label: "Road Calendar" },
  { href: "/partners", label: "Brand Partners" },
  { href: "/photography", label: "Photography" },
  { href: "/contact", label: "Contact" }
];

export function PublicHeader() {
  const { data } = useSiteSettings();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const closeOnDesktop = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, []);

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const mobileNavigation = isMounted ? createPortal(
    <>
      {isOpen ? <button className="fixed inset-0 z-[1090] bg-black/75 backdrop-blur-sm lg:hidden" aria-label="Close navigation" onClick={() => setIsOpen(false)} /> : null}
      <aside id="mobile-navigation" className={`public-mobile-nav ${isOpen ? "translate-x-0" : "-translate-x-full"}`} aria-hidden={!isOpen} aria-label="Mobile navigation">
        <div className="flex items-center justify-between gap-3 border-b border-red-900 pb-4">
          <SiteBrand logo={data?.logo} compact />
          <Button variant="outline" size="icon" title="Close navigation" aria-label="Close navigation" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button>
        </div>
        <nav className="public-mobile-links">
          {navLinks.map((link, index) => (
            <Link key={link.label} href={link.href} onClick={() => setIsOpen(false)} aria-current={pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`)) ? "page" : undefined} className="public-mobile-link">
              <span className="font-mono text-[10px] text-[#d91b1b]">{String(index + 1).padStart(2, "0")}</span>{link.label}
            </Link>
          ))}
        </nav>
        <div className="public-mobile-actions">
          <Link href="/admin/login" onClick={() => setIsOpen(false)} className="public-mobile-admin"><LockKeyhole className="h-4 w-4" /> Admin login</Link>
          <Link href="/join-group" onClick={() => setIsOpen(false)} className="public-mobile-join">Join the crew <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </aside>
    </>,
    document.body
  ) : null;

  return (
    <>
    <header className={`public-header ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="public-header-inner">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <SiteBrand logo={data?.logo} compact />
        </div>

        <nav className="public-header-nav" aria-label="Primary navigation">
          {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(`${link.href}/`));
            return (
            <Link
              key={link.label}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? "is-active" : ""}
            >
              {link.label}
            </Link>
          );})}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link href="/admin/login" className="public-header-admin"><LockKeyhole className="h-3.5 w-3.5" /> Admin</Link>
          <Link href="/join-group" className="public-header-join">Join crew <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          <Button className="public-header-menu lg:hidden" variant="outline" size="icon" title="Open navigation" aria-label="Open navigation" aria-controls="mobile-navigation" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)}>
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
    {mobileNavigation}
    </>
  );
}
