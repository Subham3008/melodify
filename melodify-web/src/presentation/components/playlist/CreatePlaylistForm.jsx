"use client";

import { useState } from "react";

import { usePlaylistStore } from "@/presentation/stores/playlist.store";

export default function CreatePlaylistForm() {
  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      await createPlaylist({
        name: name.trim(),

        description: description.trim(),
      });

      setName("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
          h-fit
          self-start
          rounded-xl
          bg-[#181818]
          p-6
      `"
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Playlist name"
        maxLength={80}
        className="
          mt-4
          w-full
          rounded-lg
          bg-[#282828]
          px-4
          py-3
          outline-none
        "
      />

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description (optional)"
        maxLength={300}
        rows={3}
        className="
          mt-3
          w-full
          resize-none
          rounded-lg
          bg-[#282828]
          px-4
          py-3
          outline-none
        "
      />

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="
          mt-4
          rounded-full
          bg-[#1ed760]
          px-6
          py-3
          font-bold
          text-black
          disabled:opacity-50
        "
      >
        {submitting ? "Creating..." : "Create Playlist"}
      </button>
    </form>
  );
}
