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

      router.replace("/");
    } catch (error) {
      console.error(error.response?.data?.message || "Google login failed");
    }
  };

  return (
    <div className="flex w-full justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          console.error("Google authentication failed");
        }}
        theme="filled_black"
        size="large"
        shape="pill"
        text="continue_with"
        logo_alignment="left"
        width="372"
      />
    </div>
  );
}
