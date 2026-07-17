import { api } from "./api";
import { ContentItem, ContentKind, PublicContent } from "@/types/content";

export async function getPublicContent() {
  const { data } = await api.get("/content");
  return data.data as PublicContent;
}

export async function getAdminContent() {
  const { data } = await api.get("/admin/content");
  return data.data as ContentItem[];
}

export async function saveContent(kind: ContentKind, values: FormData, id?: string) {
  const { data } = id
    ? await api.put(`/admin/content/${id}`, values)
    : await api.post(`/admin/content/${kind}`, values);
  return data.data as ContentItem;
}

export async function removeContent(id: string) {
  await api.delete(`/admin/content/${id}`);
}
