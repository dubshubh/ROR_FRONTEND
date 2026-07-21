import { api } from "./api";

export type EmailAudience = "approvedRiders" | "brands" | "all" | "custom";
export type EmailCategory = "ride-update" | "brand-collaboration" | "brand-thanks" | "announcement" | "custom";
export type EmailLog = { _id: string; source: "automation" | "admin"; category: string; subject: string; audience: string; recipientCount: number; sentCount: number; failedCount: number; status: "sent" | "partial" | "failed" | "skipped"; createdAt: string; errorMessage?: string };

export async function sendAdminEmail(input: { audience: EmailAudience; category: EmailCategory; subject: string; message: string; customRecipients: string[] }) {
  const { data } = await api.post("/admin/emails/send", input);
  return data.data as { status: string; recipientCount: number; sentCount: number; failedCount: number };
}

export async function getEmailLogs() {
  const { data } = await api.get("/admin/emails", { params: { page: 1, limit: 10 } });
  return data.data as { logs: EmailLog[]; meta: { total: number } };
}
