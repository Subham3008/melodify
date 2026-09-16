import { create } from "zustand";

import {
  getCurrentUser,
  loginUser,
  registerUser,
  loginWithGoogle,
  logoutUser,
} from "@/application/auth/auth.usecases";

export const useAuthStore = create((set) => ({
  user: null,

  loading: true,

  initializeAuth: async () => {
    try {
      const user = await getCurrentUser();

      set({
        user,
        loading: false,
      });
    } catch {
      set({
        user: null,
        loading: false,
      });
    }
  },

  login: async (email, password) => {
    const user = await loginUser(email, password);

    set({
      user,
    });

    return user;
  },

  register: async (name, email, password) => {
    const user = await registerUser(name, email, password);

    set({
      user,
    });

    return user;
  },

  googleLogin: async (credential) => {
    const user = await loginWithGoogle(credential);

    set({
      user,
    });

    return user;
  },

  logout: async () => {
    await logoutUser();

    set({
      user: null,
    });
  },
}));
