"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/presentation/stores/auth.store";

export default function GoogleLoginButton() {
  const router = useRouter();

  const googleLogin = useAuthStore((state) => state.googleLogin);

  const handleSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        return;
      }

      await googleLogin(credentialResponse.credential);

      // Google login successful
      router.push("/");
    } catch (error) {
      console.error(error.response?.data?.message || "Google login failed");
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => {
        console.error("Google authentication failed");
      }}
    />
  );
}
