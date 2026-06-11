import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const fieldErrors = error.response?.data?.errors?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const firstError = Object.values(fieldErrors).flat().find(Boolean);
      if (typeof firstError === "string") return firstError;
    }
    return error.response?.data?.message ?? error.message;
  }
  return "Something went wrong";
}
