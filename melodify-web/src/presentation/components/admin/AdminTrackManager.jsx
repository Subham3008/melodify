"use client";

import { useCallback, useEffect, useState } from "react";

import {
  deleteAdminTrack,
  getAdminTracks,
  retryAdminTrack,
} from "@/infrastructure/api/admin-track.api";

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All",
  },
  {
    value: "uploaded",
    label: "Queued",
  },
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "ready",
    label: "Ready",
  },
  {
    value: "failed",
    label: "Failed",
  },
];

const getStatusClasses = (status) => {
  switch (status) {
    case "ready":
      return "bg-green-500/15 text-green-400 border-green-500/20";

    case "failed":
      return "bg-red-500/15 text-red-400 border-red-500/20";

    case "processing":
      return "bg-blue-500/15 text-blue-400 border-blue-500/20";

    default:
      return "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
  }
};

const getStatusLabel = (status) => {
  if (status === "uploaded") {
    return "Queued";
  }

  if (status === "processing") {
    return "Processing";
  }

  if (status === "ready") {
    return "Ready";
  }

  if (status === "failed") {
    return "Failed";
  }

  return status;
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString();
};

export default function AdminTrackManager() {
  const [tracks, setTracks] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);

  const [actionTrackId, setActionTrackId] = useState(null);

  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load tracks
  |--------------------------------------------------------------------------
  */

  const loadTracks = useCallback(
    async ({ silent = false, page = pagination.page } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const data = await getAdminTracks({
          page,

          limit: 20,

          status: statusFilter,
        });

        setTracks(data?.items ?? []);

        setPagination(
          data?.pagination ?? {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
          },
        );

        setError("");
      } catch (err) {
        console.error("Unable to load admin tracks:", err);

        setError(err?.message ?? "Unable to load tracks.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [pagination.page, statusFilter],
  );

  /*
  |--------------------------------------------------------------------------
  | Initial load / filter
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void loadTracks({
      page: 1,
    });
  }, [statusFilter]);

  /*
  |--------------------------------------------------------------------------
  | Silent live refresh
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadTracks({
        silent: true,
      });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadTracks]);

  /*
  |--------------------------------------------------------------------------
  | Retry failed
  |--------------------------------------------------------------------------
  */

  const handleRetry = async (track) => {
    try {
      setActionTrackId(track.id);

      setError("");

      await retryAdminTrack(track.id);

      await loadTracks({
        silent: true,
      });
    } catch (err) {
      setError(err?.message ?? "Unable to retry processing.");
    } finally {
      setActionTrackId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (track) => {
    const confirmed = window.confirm(
      `Delete "${track.title}" permanently?\n\nThis removes the original audio, cover, HLS files and database track.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionTrackId(track.id);

      setError("");

      await deleteAdminTrack(track.id);

      const nextPage =
        tracks.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadTracks({
        page: nextPage,
      });
    } catch (err) {
      setError(err?.message ?? "Unable to delete track.");
    } finally {
      setActionTrackId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* TOOLBAR */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-400">
            {pagination.total} uploaded tracks
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="
            rounded-lg
            border
            border-neutral-700
            bg-[#181818]
            px-3
            py-2
            text-sm
            text-white
            outline-none
            focus:border-[#1ed760]
          "
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="flex min-h-52 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-[#1ed760]" />
        </div>
      )}

      {/* EMPTY */}

      {!loading && tracks.length === 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-[#181818] p-10 text-center">
          <p className="font-semibold text-white">No uploaded tracks</p>

          <p className="mt-2 text-sm text-neutral-500">
            Upload a song to see it here.
          </p>
        </div>
      )}

      {/* TRACKS */}

      {!loading && tracks.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#181818]">
          {tracks.map((track, index) => {
            const busy = actionTrackId === track.id;

            const processing =
              track.processingStatus === "uploaded" ||
              track.processingStatus === "processing";

            return (
              <div
                key={track.id}
                className={`
                      flex
                      flex-col
                      gap-4
                      p-4
                      lg:flex-row
                      lg:items-center

                      ${
                        index !== tracks.length - 1
                          ? "border-b border-neutral-800"
                          : ""
                      }
                    `}
              >
                {/* TRACK */}

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {track.imageUrl ? (
                    <img
                      src={track.imageUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-xl text-neutral-500">
                      ♪
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {track.title}
                    </p>

                    <p className="mt-0.5 truncate text-sm text-neutral-400">
                      {track.artistName}

                      {track.albumName ? ` • ${track.albumName}` : ""}
                    </p>

                    <p className="mt-1 text-xs text-neutral-600">
                      {formatDate(track.createdAt)}
                    </p>
                  </div>
                </div>

                {/* STATUS */}

                <div className="lg:w-44">
                  <span
                    className={`
                          inline-flex
                          rounded-full
                          border
                          px-3
                          py-1
                          text-xs
                          font-semibold

                          ${getStatusClasses(track.processingStatus)}
                        `}
                  >
                    {track.processingStatus === "processing" && (
                      <span className="mr-2 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    )}

                    {getStatusLabel(track.processingStatus)}
                  </span>

                  {track.processingStatus === "failed" &&
                    track.processingError && (
                      <p
                        className="mt-2 line-clamp-2 text-xs text-red-300"
                        title={track.processingError}
                      >
                        {track.processingError}
                      </p>
                    )}
                </div>

                {/* ACTIONS */}

                <div className="flex items-center gap-2 lg:justify-end">
                  {track.processingStatus === "failed" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRetry(track)}
                      className="
                            rounded-full
                            border
                            border-neutral-600
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-white
                            transition
                            hover:border-[#1ed760]
                            hover:text-[#1ed760]
                            disabled:opacity-40
                          "
                    >
                      {busy ? "Retrying..." : "Retry"}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busy || processing}
                    onClick={() => handleDelete(track)}
                    className="
                          rounded-full
                          border
                          border-red-500/30
                          px-4
                          py-2
                          text-xs
                          font-semibold
                          text-red-400
                          transition
                          hover:bg-red-500/10
                          disabled:cursor-not-allowed
                          disabled:opacity-30
                        "
                    title={
                      processing
                        ? "Wait until processing finishes"
                        : "Delete track"
                    }
                  >
                    {busy ? "Working..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}

      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() =>
              loadTracks({
                page: pagination.page - 1,
              })
            }
            className="rounded-full border border-neutral-700 px-4 py-2 text-sm text-white disabled:opacity-30"
          >
            Previous
          </button>

          <span className="text-sm text-neutral-400">
            {pagination.page} / {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              loadTracks({
                page: pagination.page + 1,
              })
            }
            className="rounded-full border border-neutral-700 px-4 py-2 text-sm text-white disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
