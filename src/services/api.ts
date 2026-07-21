import axios from "axios";

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const internalApiUrl = process.env.INTERNAL_API_URL?.trim();
const configuredApiUrl = typeof window === "undefined"
  ? internalApiUrl || publicApiUrl
  : publicApiUrl;
if (!configuredApiUrl && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_URL is required in production");
}

export const api = axios.create({
  baseURL: configuredApiUrl || "http://localhost:8000/api",
  withCredentials: true
});

export function apiAssetUrl(path: string) {
  return `${api.defaults.baseURL?.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined") {
      const url = error.config?.url;
      const isProtectedAdminRequest = url?.startsWith("/admin/") && url !== "/admin/login" && url !== "/admin/me";
      if (isProtectedAdminRequest && window.location.pathname !== "/admin/login") {
        window.location.assign("/admin/login?reason=session-expired");
      }
    }
    return Promise.reject(error);
  }
);

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
