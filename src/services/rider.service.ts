import { api } from "./api";
import { DashboardStats, PaginatedRiders, Rider, RiderStatus } from "@/types/rider";

export type RiderListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  city?: string;
  state?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export async function registerRider(formData: FormData) {
  const { data } = await api.post("/riders", formData);
  return data.data as Rider;
}

export async function getRiders(params: RiderListParams) {
  const { data } = await api.get("/admin/riders", { params });
  return data.data as PaginatedRiders;
}

export async function getRider(id: string) {
  const { data } = await api.get(`/admin/riders/${id}`);
  return data.data as Rider;
}

export async function updateRiderStatus(id: string, status: RiderStatus, remark = "") {
  const { data } = await api.patch(`/admin/riders/${id}/status`, { status, remark });
  return data.data as Rider;
}

export async function deleteRider(id: string) {
  await api.delete(`/admin/riders/${id}`);
}

export async function bulkDeleteRiders(ids: string[]) { const { data } = await api.delete("/admin/riders", { data: { ids } }); return data.data as { deleted:number }; }

export async function getDashboardStats() {
  const { data } = await api.get("/admin/stats");
  return data.data as DashboardStats;
}

export async function downloadRiders(type: "csv" | "excel") {
  const response = await api.get(`/admin/riders/export/${type}`, { responseType: "blob" });
  const extension = type === "csv" ? "csv" : "xlsx";
  const mime =
    type === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const blob = new Blob([response.data], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `riders.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
