"use client";

import { useEffect, useMemo, useState } from "react";

import { updateAdminTrack } from "@/infrastructure/api/admin-track.api";

export default function AdminTrackEditModal({ track, onClose, onUpdated }) {
  const [title, setTitle] = useState(track.title ?? "");

  const [artistName, setArtistName] = useState(track.artistName ?? "");

  const [albumName, setAlbumName] = useState(track.albumName ?? "");

  const [coverFile, setCoverFile] = useState(null);

  const [coverImageUrl, setCoverImageUrl] = useState("");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | New cover preview
  |--------------------------------------------------------------------------
  */

  const newCoverPreview = useMemo(() => {
    if (!coverFile) {
      return "";
    }

    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  useEffect(() => {
    return () => {
      if (newCoverPreview) {
        URL.revokeObjectURL(newCoverPreview);
      }
    };
  }, [newCoverPreview]);

  /*
  |--------------------------------------------------------------------------
  | Escape close
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Song title is required.");

      return;
    }

    if (!artistName.trim()) {
      setError("Artist name is required.");

      return;
    }

    try {
      setSaving(true);

      const updatedTrack = await updateAdminTrack(track.id, {
        title: title.trim(),

        artistName: artistName.trim(),

        albumName: albumName.trim(),

        coverFile,

        coverImageUrl: coverImageUrl.trim(),
      });

      onUpdated(updatedTrack);

      onClose();
    } catch (err) {
      console.error("Unable to update track:", err);

      setError(
        err?.response?.data?.message ??
          err?.message ??
          "Unable to update track.",
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `
    w-full
    rounded-lg
    border
    border-neutral-700
    bg-[#121212]
    px-3
    py-2.5
    text-sm
    text-white
    outline-none
    transition
    placeholder:text-neutral-500
    focus:border-[#1ed760]
  `;

  const previewImage = newCoverPreview || track.imageUrl;

  return (
    <div
      className="
        fixed
        inset-0
        z-120
        flex
        items-center
        justify-center
        bg-black/65
        p-4
        backdrop-blur-sm
      "
      onMouseDown={onClose}
    >
      <div
        className="
          w-full
          max-w-lg
          overflow-hidden
          rounded-2xl
          border
          border-neutral-700
          bg-[#181818]
          shadow-2xl
        "
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <p className="text-xs font-semibold text-[#1ed760]">
              Melodify Admin
            </p>

            <h2 className="mt-0.5 text-xl font-bold text-white">Edit Track</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
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
          >
            ×
          </button>
        </div>

        {/* BODY */}

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* CURRENT COVER */}

          <div className="flex items-center gap-3">
            {previewImage ? (
              <img
                src={previewImage}
                alt=""
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-neutral-800 text-xl text-neutral-500">
                ♪
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {title || "Untitled"}
              </p>

              <p className="mt-1 truncate text-xs text-neutral-400">
                {artistName || "Unknown artist"}
              </p>
            </div>
          </div>

          {/* TITLE */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
              Song title
            </label>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
              className={inputClass}
            />
          </div>

          {/* ARTIST */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
              Artist
            </label>

            <input
              value={artistName}
              onChange={(event) => setArtistName(event.target.value)}
              disabled={saving}
              className={inputClass}
            />
          </div>

          {/* ALBUM */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
              Album
            </label>

            <input
              value={albumName}
              onChange={(event) => setAlbumName(event.target.value)}
              placeholder="Optional"
              disabled={saving}
              className={inputClass}
            />
          </div>

          {/* COVER */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
              Replace cover
            </label>

            <input
              type="file"
              accept="image/*"
              disabled={saving}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;

                setCoverFile(file);

                if (file) {
                  setCoverImageUrl("");
                }
              }}
              className="
                block
                w-full
                rounded-lg
                border
                border-dashed
                border-neutral-700
                bg-[#121212]
                p-2
                text-xs
                text-neutral-400
                file:mr-3
                file:rounded-md
                file:border-0
                file:bg-neutral-200
                file:px-3
                file:py-2
                file:text-xs
                file:font-semibold
                file:text-black
              "
            />
          </div>

          {/* EXTERNAL COVER */}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
              Or new cover URL
            </label>

            <input
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              placeholder="Leave empty to keep current cover"
              disabled={saving || Boolean(coverFile)}
              className={inputClass}
            />

            <p className="mt-1.5 text-xs text-neutral-500">
              Leave both cover fields empty to keep the current image.
            </p>
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* ACTIONS */}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="
                rounded-full
                border
                border-neutral-700
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-neutral-800
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                rounded-full
                bg-[#1ed760]
                px-5
                py-2.5
                text-sm
                font-bold
                text-black
                transition
                hover:bg-[#1fdf64]
                disabled:opacity-50
              "
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
