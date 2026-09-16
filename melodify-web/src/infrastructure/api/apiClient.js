import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = (error = null) => {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });

  pendingRequests = [];
};

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    // Refresh endpoint khud 401 de raha ho to
    // infinite loop nahi hona chahiye.
    if (originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      await new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve,
          reject,
        });
      });

      return apiClient(originalRequest);
    }

    isRefreshing = true;

    try {
      await apiClient.post("/auth/refresh");

      resolvePendingRequests();

      return apiClient(originalRequest);
    } catch (refreshError) {
      resolvePendingRequests(refreshError);

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);