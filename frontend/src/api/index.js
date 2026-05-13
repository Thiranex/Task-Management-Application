import api from "./axios";

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const tasksAPI = {
  list: (params) => api.get("/tasks", { params }),
  stats: () => api.get("/tasks/stats"),
  get: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};
