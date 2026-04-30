import axios from "axios";

const portalApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

portalApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("skynity_portal_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("skynity_portal_token");
        localStorage.removeItem("skynity_portal_customer");
        window.location.href = "/portal/login";
      }
    }
    return Promise.reject(err);
  }
);

export default portalApi;
