import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

/* ── Attach auth token to every request ── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Auto-logout on 401 (token expired / invalid) ── */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default api;
