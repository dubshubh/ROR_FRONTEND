import { api } from "./api";

export async function loginAdmin(payload: { email: string; password: string }) {
  const { data } = await api.post("/admin/login", payload);
  return data.data as { admin: { id: string; email: string; role: "admin" } };
}

export async function getCurrentAdmin() {
  const { data } = await api.get("/admin/me");
  return data.data.admin as { id: string; email: string; role: "admin" };
}

export async function logoutAdmin() {
  await api.post("/admin/logout");
}
