"use client";

import Link from "next/link";

import { useAuthStore } from "@/presentation/stores/auth.store";

export default function HomePage() {
  const user = useAuthStore(
    (state) => state.user
  );

  const loading = useAuthStore(
    (state) => state.loading
  );

  const logout = useAuthStore(
    (state) => state.logout
  );

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <main>
        <h1>Melodify</h1>

        <p>
          You are not logged in.
        </p>

        <Link href="/login">
          Login
        </Link>

        <br />

        <Link href="/register">
          Register
        </Link>
      </main>
    );
  }

  return (
    <main>
      <h1>
        Welcome, {user.name}
      </h1>

      <p>{user.email}</p>

      {user.avatarUrl && (
        <img
          src={user.avatarUrl}
          alt={user.name}
          width={80}
          height={80}
        />
      )}

      <button onClick={logout}>
        Logout
      </button>
    </main>
  );
}