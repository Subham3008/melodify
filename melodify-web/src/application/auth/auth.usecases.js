// ==============================
// Infrastructure API functions
// ==============================
// Ye functions actual backend API calls handle karte hain.
// Example:
// registerRequest()  -> POST /auth/register
// loginRequest()     -> POST /auth/login

import {
  registerRequest,
  loginRequest,
  googleLoginRequest,
  getCurrentUserRequest,
  refreshRequest,
  logoutRequest,
} from "@/infrastructure/auth/auth.api";


// ==============================
// Domain function
// ==============================
// Backend se jo raw user data aata hai,
// usko apne application ke User structure me convert karta hai.

import { createUser } from "@/domain/auth/user.entity";


// ==========================================
// Register User Use Case
// ==========================================
// 1. name, email, password receive karta hai
// 2. Infrastructure layer ko register API call karne bolta hai
// 3. Backend se user data milta hai
// 4. Raw user ko domain User object me convert karta hai

export const registerUser = async (name, email, password) => {
  const data = await registerRequest({
    name,
    email,
    password,
  });

  return createUser(data.user);
};


// ==========================================
// Login User Use Case
// ==========================================
// 1. email aur password receive karta hai
// 2. Backend login API call karta hai
// 3. Backend se logged-in user milta hai
// 4. User ko domain structure me convert karke return karta hai

export const loginUser = async (email, password) => {
  const data = await loginRequest({
    email,
    password,
  });

  return createUser(data.user);
};


// ==========================================
// Google Login Use Case
// ==========================================
// Google se jo credential / ID token milta hai,
// usko backend ke Google login endpoint par bhejta hai.
//
// Backend:
// - Google credential verify karega
// - User create/find karega
// - Logged-in user return karega

export const loginWithGoogle = async (credential) => {
  const data = await googleLoginRequest(credential);

  return createUser(data.user);
};


// ==========================================
// Get Current User Use Case
// ==========================================
// Already logged-in user ki information backend se fetch karta hai.
//
// Example:
// App refresh hone ke baad check karna:
// "Current session kis user ki hai?"

export const getCurrentUser = async () => {
  const data = await getCurrentUserRequest();

  return createUser(data.user);
};


// ==========================================
// Refresh Session Use Case
// ==========================================
// Jab access token expire ho jaye,
// refresh token ke through naya session/access token
// lene ke liye backend API call karta hai.

export const refreshSession = async () => {
  return refreshRequest();
};


// ==========================================
// Logout User Use Case
// ==========================================
// Backend logout endpoint call karta hai.
//
// Backend generally:
// - refresh token invalidate/remove karega
// - cookie clear karega
// - session terminate karega

export const logoutUser = async () => {
  return logoutRequest();
};