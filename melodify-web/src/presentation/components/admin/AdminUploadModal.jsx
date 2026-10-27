"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import AdminOnly from "./AdminOnly";
import AdminTrackUploadForm from "./AdminTrackUploadForm";

export default function AdminUploadModal() {
  const router = useRouter();

  const closeModal = () => {
    router.back();
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  });

  return (
    <AdminOnly>
      <div
        className="
          fixed
          inset-0
          z-100
          flex
          items-center
          justify-center
          bg-black/55
          p-4
          backdrop-blur-sm
        "
        onMouseDown={closeModal}
      >
        <div
          className="
            max-h-[90vh]
            w-full
            max-w-xl
            overflow-y-auto
            rounded-2xl
            border
            border-neutral-700
            bg-[#181818]
            shadow-2xl
          "
          onMouseDown={(event) => event.stopPropagation()}
        >
          {/* HEADER */}

          <div
            className="
              sticky
              top-0
              z-10
              flex
              items-center
              justify-between
              border-b
              border-neutral-800
              bg-[#181818]
              px-5
              py-4
            "
          >
            <div>
              <p className="text-xs font-semibold text-[#1ed760]">
                Melodify Admin
              </p>

              <h2 className="mt-0.5 text-xl font-bold text-white">
                Upload Song
              </h2>
            </div>

            <button
              type="button"
              onClick={closeModal}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-neutral-800
                text-xl
                text-neutral-300
                transition
                hover:bg-neutral-700
                hover:text-white
              "
              aria-label="Close upload modal"
            >
              ×
            </button>
          </div>

          <div className="p-5">
            <AdminTrackUploadForm />
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
