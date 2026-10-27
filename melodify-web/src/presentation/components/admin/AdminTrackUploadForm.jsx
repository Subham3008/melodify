"use client";

import { useEffect, useMemo, useState } from "react";

import { uploadAdminTrack } from "@/infrastructure/api/admin-track.api";

const INITIAL_FORM = {
  title: "",
  artistName: "",
  albumName: "",
  coverImageUrl: "",
};

export default function AdminTrackUploadForm() {
  const [form, setForm] = useState(INITIAL_FORM);

  const [audioFile, setAudioFile] = useState(null);

  const [coverFile, setCoverFile] = useState(null);

  const [durationSeconds, setDurationSeconds] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [uploadedTrack, setUploadedTrack] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Cover preview
  |--------------------------------------------------------------------------
  */

  const coverPreview = useMemo(() => {
    if (!coverFile) {
      return "";
    }

    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  useEffect(() => {
    return () => {
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  /*
  |--------------------------------------------------------------------------
  | Input change
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Audio duration
  |--------------------------------------------------------------------------
  */

  const handleAudioChange = (event) => {
    const file = event.target.files?.[0] ?? null;

    setAudioFile(file);

    setDurationSeconds(null);

    setError("");

    if (!file) {
      return;
    }

    const audio = document.createElement("audio");

    audio.preload = "metadata";

    const objectUrl = URL.createObjectURL(file);

    audio.src = objectUrl;

    audio.onloadedmetadata = () => {
      const duration = Math.ceil(audio.duration);

      if (!Number.isFinite(duration) || duration <= 0) {
        setError("Unable to detect audio duration.");

        setDurationSeconds(null);
      } else {
        setDurationSeconds(duration);
      }

      URL.revokeObjectURL(objectUrl);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      setDurationSeconds(null);

      setError("Unable to read audio metadata.");
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setForm(INITIAL_FORM);

    setAudioFile(null);

    setCoverFile(null);

    setDurationSeconds(null);

    const audioInput = document.getElementById("admin-track-audio");

    const coverInput = document.getElementById("admin-track-cover");

    if (audioInput) {
      audioInput.value = "";
    }

    if (coverInput) {
      coverInput.value = "";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    setUploadedTrack(null);

    if (!form.title.trim()) {
      setError("Track title is required.");

      return;
    }

    if (!form.artistName.trim()) {
      setError("Artist name is required.");

      return;
    }

    if (!audioFile) {
      setError("Please select an audio file.");

      return;
    }

    if (!durationSeconds) {
      setError("Unable to detect audio duration.");

      return;
    }

    if (!coverFile && !form.coverImageUrl.trim()) {
      setError("Either cover image or external cover URL is required.");

      return;
    }

    try {
      setUploading(true);

      const response = await uploadAdminTrack({
        title: form.title.trim(),

        artistName: form.artistName.trim(),

        albumName: form.albumName.trim(),

        durationSeconds,

        audioFile,

        coverFile,

        coverImageUrl: form.coverImageUrl.trim(),
      });

      const track = response?.data ?? response?.track ?? response;

      setUploadedTrack(track);

      resetForm();
    } catch (err) {
      console.error("Admin track upload failed:", err);

      setError(err?.message ?? "Track upload failed.");
    } finally {
      setUploading(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* TITLE */}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
          Song title
        </label>

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Song title"
          disabled={uploading}
          className={inputClass}
        />
      </div>

      {/* ARTIST + ALBUM */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
            Artist
          </label>

          <input
            name="artistName"
            value={form.artistName}
            onChange={handleChange}
            placeholder="Artist"
            disabled={uploading}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
            Album
          </label>

          <input
            name="albumName"
            value={form.albumName}
            onChange={handleChange}
            placeholder="Optional"
            disabled={uploading}
            className={inputClass}
          />
        </div>
      </div>

      {/* AUDIO */}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
          Audio file
        </label>

        <input
          id="admin-track-audio"
          type="file"
          accept="audio/*"
          disabled={uploading}
          onChange={handleAudioChange}
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
            file:bg-[#1ed760]
            file:px-3
            file:py-2
            file:text-xs
            file:font-bold
            file:text-black
          "
        />

        {audioFile && (
          <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
            <p className="truncate text-neutral-400">{audioFile.name}</p>

            {durationSeconds && (
              <p className="shrink-0 text-[#1ed760]">{durationSeconds}s</p>
            )}
          </div>
        )}
      </div>

      {/* COVER */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
            Cover image
          </label>

          <input
            id="admin-track-cover"
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;

              setCoverFile(file);

              if (file) {
                setForm((current) => ({
                  ...current,
                  coverImageUrl: "",
                }));
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
              file:mr-2
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

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-neutral-300">
            Or cover URL
          </label>

          <input
            name="coverImageUrl"
            value={form.coverImageUrl}
            onChange={handleChange}
            placeholder="https://..."
            disabled={uploading || Boolean(coverFile)}
            className={inputClass}
          />
        </div>
      </div>

      {/* COVER PREVIEW */}

      {coverPreview && (
        <div className="flex items-center gap-3 rounded-lg bg-[#121212] p-2">
          <img
            src={coverPreview}
            alt="Cover preview"
            className="h-12 w-12 rounded-md object-cover"
          />

          <p className="min-w-0 truncate text-xs text-neutral-400">
            {coverFile?.name}
          </p>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {uploadedTrack && (
        <div className="rounded-lg border border-[#1ed760]/30 bg-[#1ed760]/10 px-3 py-2">
          <p className="text-sm font-semibold text-[#1ed760]">
            Track uploaded successfully ✓
          </p>

          {uploadedTrack.processingStatus && (
            <p className="mt-1 text-xs text-neutral-400">
              Processing: {uploadedTrack.processingStatus}
            </p>
          )}
        </div>
      )}

      {/* BUTTON */}

      <button
        type="submit"
        disabled={uploading || (audioFile && !durationSeconds)}
        className="
          flex
          w-full
          items-center
          justify-center
          rounded-full
          bg-[#1ed760]
          px-4
          py-2.5
          text-sm
          font-bold
          text-black
          transition
          hover:bg-[#1fdf64]
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {uploading
          ? "Uploading..."
          : audioFile && !durationSeconds
            ? "Reading audio..."
            : "Upload Song"}
      </button>
    </form>
  );
}
