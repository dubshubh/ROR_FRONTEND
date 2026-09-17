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

export async function forgotPasswordAdmin(payload: { email: string }) {
  const { data } = await api.post("/admin/forgot-password", payload);
  return data as {
    success: boolean;
    message: string;
    data?: {
      devResetUrl?: string;
      devToken?: string;
    };
  };
}

export async function resetPasswordAdmin(payload: { token: string; password: string }) {
  const { data } = await api.post("/admin/reset-password", payload);
  return data as { success: boolean; message: string };
}

export async function changePasswordAdmin(payload: { currentPassword: string; newPassword: string }) {
  const { data } = await api.post("/admin/change-password", payload);
  return data as { success: boolean; message: string };
}
