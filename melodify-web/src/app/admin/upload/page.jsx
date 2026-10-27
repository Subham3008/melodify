"use client";

import { useRouter } from "next/navigation";

import AdminOnly from "@/presentation/components/admin/AdminOnly";
import AdminTrackUploadForm from "@/presentation/components/admin/AdminTrackUploadForm";

export default function AdminUploadPage() {
  const router = useRouter();

  return (
    <AdminOnly>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212] p-4">
        <div className="w-full max-w-xl rounded-2xl border border-neutral-700 bg-[#181818] shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-[#1ed760]">
                Melodify Admin
              </p>

              <h1 className="mt-0.5 text-xl font-bold text-white">
                Upload Song
              </h1>
            </div>

            <button
              type="button"
              onClick={() => router.replace("/")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xl text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-5">
            <AdminTrackUploadForm />
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
