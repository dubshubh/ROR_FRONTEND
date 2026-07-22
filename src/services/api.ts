import axios from "axios";

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const internalApiUrl = process.env.INTERNAL_API_URL?.trim();
const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");
const proxiedBackendApiUrl = apiProxyTarget
  ? `${apiProxyTarget}/api`
  : undefined;
const defaultServerApiUrl = process.env.VERCEL
  ? "https://ror-backend-1.onrender.com/api"
  : "http://localhost:8000/api";
const configuredApiUrl = typeof window === "undefined"
  // Browser-side admin calls use the /api rewrite configured from
  // API_PROXY_TARGET. Server-rendered public pages must prefer that same
  // backend, otherwise the admin and public site can read different databases.
  ? proxiedBackendApiUrl || internalApiUrl || (publicApiUrl?.startsWith("http") ? publicApiUrl : undefined) || defaultServerApiUrl
  : "/api";

export const api = axios.create({
  baseURL: configuredApiUrl,
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
