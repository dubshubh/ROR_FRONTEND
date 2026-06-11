import { api } from "./api";
import { SiteSettings } from "@/types/settings";

export async function getSiteSettings() {
  const { data } = await api.get("/settings");
  return data.data as SiteSettings;
}

export async function updateSiteLogo(file: File) {
  const formData = new FormData();
  formData.append("logo", file);
  const { data } = await api.patch("/admin/settings/logo", formData);
  return data.data as SiteSettings;
}
