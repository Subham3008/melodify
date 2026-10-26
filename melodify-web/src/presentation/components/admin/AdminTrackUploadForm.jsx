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
  | Form input handler
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
  | Audio file + duration detection
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
        setDurationSeconds(null);

        setError("Unable to detect audio duration.");
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
  | Reset form
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

    if (!durationSeconds || durationSeconds <= 0) {
      setError("Unable to detect valid audio duration.");

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

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-green-400">Melodify Admin</p>

          <h1 className="mt-1 text-2xl font-bold text-white">Upload Song</h1>

          <p className="mt-2 text-sm text-neutral-400">
            Upload a song to S3 and start HLS processing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Song title */}

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-200">
              Song title
            </label>

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Example: My Song"
              disabled={uploading}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-green-500 disabled:opacity-50"
            />
          </div>

          {/* Artist */}

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-200">
              Artist
            </label>

            <input
              name="artistName"
              value={form.artistName}
              onChange={handleChange}
              placeholder="Artist name"
              disabled={uploading}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-green-500 disabled:opacity-50"
            />
          </div>

          {/* Album */}

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-200">
              Album
            </label>

            <input
              name="albumName"
              value={form.albumName}
              onChange={handleChange}
              placeholder="Optional"
              disabled={uploading}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-green-500 disabled:opacity-50"
            />
          </div>

          {/* Audio */}

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-200">
              Audio file
            </label>

            <input
              id="admin-track-audio"
              type="file"
              accept="audio/*"
              disabled={uploading}
              onChange={handleAudioChange}
              className="block w-full rounded-xl border border-dashed border-white/20 bg-neutral-950 p-4 text-sm text-neutral-300 file:mr-4 file:rounded-lg file:border-0 file:bg-green-500 file:px-4 file:py-2 file:font-medium file:text-black"
            />

            {audioFile && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-neutral-400">
                  Selected: {audioFile.name}
                </p>

                {durationSeconds ? (
                  <p className="text-xs text-green-400">
                    Duration detected: {durationSeconds} seconds
                  </p>
                ) : (
                  <p className="text-xs text-yellow-400">
                    Reading audio duration...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Cover file */}

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-200">
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
              className="block w-full rounded-xl border border-dashed border-white/20 bg-neutral-950 p-4 text-sm text-neutral-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-medium file:text-black"
            />
          </div>

          {/* Preview */}

          {coverPreview && (
            <div className="flex items-center gap-4">
              <img
                src={coverPreview}
                alt="Cover preview"
                className="h-24 w-24 rounded-xl object-cover"
              />

              <div>
                <p className="text-sm font-medium text-white">Cover preview</p>

                <p className="text-xs text-neutral-500">{coverFile?.name}</p>
              </div>
            </div>
          )}

          {/* OR */}

          <div className="relative flex items-center py-1">
            <div className="grow border-t border-white/10" />

            <span className="mx-4 text-xs uppercase text-neutral-600">or</span>

            <div className="grow border-t border-white/10" />
          </div>

          {/* Cover URL */}

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-200">
              External cover URL
            </label>

            <input
              name="coverImageUrl"
              value={form.coverImageUrl}
              onChange={handleChange}
              placeholder="https://example.com/cover.jpg"
              disabled={uploading || Boolean(coverFile)}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none transition focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-40"
            />

            {coverFile && (
              <p className="mt-2 text-xs text-neutral-500">
                Uploaded cover file will be used.
              </p>
            )}
          </div>

          {/* Error */}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Success */}

          {uploadedTrack && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <p className="font-medium text-green-400">
                Track uploaded successfully ✅
              </p>

              <div className="mt-2 space-y-1 text-sm text-neutral-300">
                {uploadedTrack.title && <p>Song: {uploadedTrack.title}</p>}

                {uploadedTrack.id && <p>Track ID: {uploadedTrack.id}</p>}

                {uploadedTrack.processingStatus && (
                  <p>Processing: {uploadedTrack.processingStatus}</p>
                )}
              </div>
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={uploading || (audioFile && !durationSeconds)}
            className="flex w-full items-center justify-center rounded-full bg-green-500 px-6 py-3 font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading
              ? "Uploading song..."
              : audioFile && !durationSeconds
                ? "Reading audio..."
                : "Upload Song"}
          </button>
        </form>
      </div>
    </div>
  );
}
