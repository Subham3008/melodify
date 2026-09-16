import { apiClient } from "../api/apiClient";

export const registerRequest = async (payload) => {
  const response = await apiClient.post("/auth/register", payload);

  return response.data;
};

export const loginRequest = async (payload) => {
  const response = await apiClient.post("/auth/login", payload);

  return response.data;
};

export const googleLoginRequest = async (credential) => {
  const response = await apiClient.post("/auth/google", {
    credential,
  });

  return response.data;
};

export const getCurrentUserRequest = async () => {
  const response = await apiClient.get("/auth/me");

  return response.data;
};

export const refreshRequest = async () => {
  const response = await apiClient.post("/auth/refresh");

  return response.data;
};

export const logoutRequest = async () => {
  const response = await apiClient.post("/auth/logout");

  return response.data;
};
