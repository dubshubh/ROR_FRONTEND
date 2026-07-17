"use client";

import { Instagram, MessageCircle } from "lucide-react";
import { SocialLinkLabel, socialLinks } from "@/config/social-links";

const socialIcons = {
  WhatsApp: MessageCircle,
  Instagram
} satisfies Record<SocialLinkLabel, typeof MessageCircle>;

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t-2 border-red-600 bg-[#0a0a0a]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex flex-col gap-2 text-left">
            <span className="text-[#d91b1b]">Rebels On Roads</span>
            <span>All actions logged by command center</span>
            <span>Ride with discipline, ride with pride</span>
          </div>

          <div className="text-center">
            <p className="font-display text-base uppercase tracking-[0.25em] text-[#e8d9c9]">Developed by Dubey</p>
            <p className="mt-1 text-[10px] text-[#d91b1b]">Official club operations and rider management</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
            {socialLinks.length > 0 ? (
              socialLinks.map(({ label, href }) => {
                const Icon = socialIcons[label];

                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rebel-hover inline-flex h-10 items-center gap-2 border border-[#d91b1b] px-3 text-[#e8d9c9] transition-colors hover:bg-red-950/40"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </a>
                );
              })
            ) : (
              <span className="text-[#e8d9c9]">Connect with the crew</span>
            )}
          </div>
        </div>

        <div className="border-t border-red-900 pt-4 text-center text-[10px] tracking-[0.18em] text-[#d91b1b]">
          © 2026 Rebels On Roads. All rights reserved. Built for the road captain and the riding crew.
        </div>
      </div>
    </footer>
  );
}
