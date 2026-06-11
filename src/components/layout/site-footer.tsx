"use client";

import { Instagram, MessageCircle } from "lucide-react";
import { SocialLinkLabel, socialLinks } from "@/config/social-links";

const socialIcons = {
  WhatsApp: MessageCircle,
  Instagram
} satisfies Record<SocialLinkLabel, typeof MessageCircle>;

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t-2 border-primary bg-[#0e0e0e]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="flex flex-col gap-2 text-left">
            <span className="text-[#ffb3b1]">Rebels On Roads</span>
            <span>All actions logged by command center</span>
            <span>Ride with discipline, ride with pride</span>
          </div>

          <div className="text-center">
            <p className="font-display text-base uppercase tracking-[0.25em] text-[#ffdad8]">Developed by Dubey</p>
            <p className="mt-1 text-[10px] text-[#ffb3b1]">Official club operations and rider management</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 md:justify-end">
            {socialLinks.length > 0 ? (
              socialLinks.map(({ label, href }) => {
                const Icon = socialIcons[label];

                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="rebel-hover inline-flex h-10 items-center gap-2 border border-[#ffb3b1] px-3 text-[#ffdad8] transition-colors hover:bg-[#2a1517]"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </a>
                );
              })
            ) : (
              <span className="text-[#ffdad8]">Connect with the crew</span>
            )}
          </div>
        </div>

        <div className="border-t border-[#5b403f] pt-4 text-center text-[10px] tracking-[0.18em] text-[#ffb3b1]">
          © 2026 Rebels On Roads. All rights reserved. Built for the road captain and the riding crew.
        </div>
      </div>
    </footer>
  );
}
