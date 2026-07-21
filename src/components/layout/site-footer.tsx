"use client";

import Link from "next/link";
import { ArrowUp, ArrowUpRight, Instagram, Mail, MessageCircle } from "lucide-react";
import { OFFICIAL_CONTACT_EMAIL } from "@/config/contact";
import { SocialLinkLabel, socialLinks } from "@/config/social-links";

const socialIcons = {
  WhatsApp: MessageCircle,
  Instagram
} satisfies Record<SocialLinkLabel, typeof MessageCircle>;

const footerLinks = [
  { href: "/calendar", label: "Road Calendar" },
  { href: "/partners", label: "Partners" },
  { href: "/join-group", label: "Join Crew" },
  { href: "/contact", label: "Contact" }
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-accent" aria-hidden="true" />
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <Link href="/" className="site-footer-brand" aria-label="Rebels on Roads home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/rebels-on-roads-3d.png" alt="" />
            <span><strong>Rebels on Roads</strong><small>Ride with discipline · Ride with pride</small></span>
          </Link>

          <nav className="site-footer-nav" aria-label="Footer navigation">
            {footerLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>

          <div className="site-footer-actions">
            <a href={`mailto:${OFFICIAL_CONTACT_EMAIL}`} className="site-footer-email" aria-label={`Email ${OFFICIAL_CONTACT_EMAIL}`}><Mail className="h-4 w-4" /><span>Email us</span></a>
            {socialLinks.map(({ label, href }) => { const Icon = socialIcons[label]; return <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="site-footer-social" aria-label={`Open Rebels on Roads on ${label}`}><Icon className="h-4 w-4" /><span>{label}</span><ArrowUpRight className="site-footer-external" /></a>; })}
          </div>
        </div>

        <div className="site-footer-meta">
          <p>© {new Date().getFullYear()} Rebels on Roads <i /> Dehradun, India</p>
          <div><span>Official club operations</span><a href="#" aria-label="Back to top">Back to top <ArrowUp className="h-3 w-3" /></a></div>
        </div>
      </div>
    </footer>
  );
}
