"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

import AuthBootstrap from "@/presentation/components/auth/AuthBootstrap";

import GlobalPlayer from "@/presentation/components/player/GlobalPlayer";

export default function AppProviders({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthBootstrap />

      {children}

      <GlobalPlayer />
    </GoogleOAuthProvider>
  );
}
