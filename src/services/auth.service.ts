import { api } from "./api";

export async function loginAdmin(payload: { email: string; password: string }) {
  const { data } = await api.post("/admin/login", payload);
  return data.data as { token: string; admin: { id: string; email: string; role: "admin" } };
}
