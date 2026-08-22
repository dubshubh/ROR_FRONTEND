export type SocialLinkLabel = "WhatsApp" | "Instagram";

const fallbackLinks = {
  WhatsApp: "https://chat.whatsapp.com/JqqdMyFtX2w7z9asZq8n7u?s=cl&p=a&mlu=4",
  Instagram: "https://www.instagram.com/rebelsonroads?igsh=anMyNTkwYzNwYjY0"
} as const;

export const socialLinks = [
  {
    label: "WhatsApp" as const,
    href: process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || fallbackLinks.WhatsApp
  },
  {
    label: "Instagram" as const,
    href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || fallbackLinks.Instagram
  }
].filter((link): link is { label: SocialLinkLabel; href: string } => Boolean(link.href));
