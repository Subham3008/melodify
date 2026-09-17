"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { useAuthStore } from "@/presentation/stores/auth.store";

import GoogleLoginButton from "./GoogleLoginButton";
import AuthShell from "./AuthShell";

export default function LoginForm() {
  const router = useRouter();

  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    setError,

    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);

      router.replace("/");
    } catch (error) {
      setError("root", {
        message: error.response?.data?.message || "Login failed",
      });
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Login to continue listening">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-bold">
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="name@domain.com"
            {...register("email", {
              required: "Email is required",

              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

                message: "Enter a valid email address",
              },
            })}
            className="
              w-full
              rounded-md
              border
              border-neutral-600
              bg-[#121212]
              px-4
              py-3.5
              text-white
              outline-none
              transition
              placeholder:text-neutral-500
              hover:border-neutral-400
              focus:border-white
            "
          />

          {errors.email && (
            <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold">
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register("password", {
              required: "Password is required",

              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
            })}
            className="
              w-full
              rounded-md
              border
              border-neutral-600
              bg-[#121212]
              px-4
              py-3.5
              text-white
              outline-none
              transition
              placeholder:text-neutral-500
              hover:border-neutral-400
              focus:border-white
            "
          />

          {errors.password && (
            <p className="mt-2 text-sm text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Backend error */}

        {errors.root && (
          <div className="rounded-md bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {errors.root.message}
          </div>
        )}

        {/* Login */}

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full
            rounded-full
            bg-[#1ed760]
            py-3.5
            font-bold
            text-black
            transition
            hover:scale-[1.02]
            hover:bg-[#3be477]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      {/* Divider */}

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-neutral-700" />

        <span className="text-sm font-semibold">or</span>

        <div className="h-px flex-1 bg-neutral-700" />
      </div>

      {/* Google */}

      <GoogleLoginButton />

      {/* Footer */}

      <div className="mt-12 text-center">
        <p className="text-sm text-neutral-400">Don't have an account?</p>

        <Link
          href="/register"
          className="mt-2 inline-block font-bold text-white underline underline-offset-4 hover:text-[#1ed760]"
        >
          Sign up
        </Link>
      </div>
    </AuthShell>
  );
}
