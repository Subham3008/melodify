"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import AuthBootstrap from "@/presentation/components/auth/AuthBootstrap";
import GlobalPlayer from "@/presentation/components/player/GlobalPlayer";
import LikesBootstrap from "@/presentation/components/like/LikesBootstrap";
import SessionCleanup from "@/presentation/components/auth/SessionCleanup";

export default function AppProviders({ children }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthBootstrap />
      <SessionCleanup />
      <LikesBootstrap />
      
      {children}

      <GlobalPlayer />
    </GoogleOAuthProvider>
  );
}
