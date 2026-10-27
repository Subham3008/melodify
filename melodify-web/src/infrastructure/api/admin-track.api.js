import { apiClient } from "@/infrastructure/api/apiClient";

/*
|--------------------------------------------------------------------------
| Upload admin track
|--------------------------------------------------------------------------
*/

export async function uploadAdminTrack({
  title,
  artistName,
  albumName,
  durationSeconds,
  audioFile,
  coverFile,
  coverImageUrl,
}) {
  const formData =
    new FormData();

  formData.append(
    "title",
    title,
  );

  formData.append(
    "artistName",
    artistName,
  );

  formData.append(
    "durationSeconds",
    String(durationSeconds),
  );

  if (albumName?.trim()) {
    formData.append(
      "albumName",
      albumName.trim(),
    );
  }

  if (audioFile) {
    formData.append(
      "audio",
      audioFile,
    );
  }

  if (coverFile) {
    formData.append(
      "cover",
      coverFile,
    );
  } else if (
    coverImageUrl?.trim()
  ) {
    formData.append(
      "imageUrl",
      coverImageUrl.trim(),
    );
  }

  const response =
    await apiClient.post(
      "/admin/tracks",
      formData,
      {
        /*
        |--------------------------------------------------------------------------
        | Let browser create multipart boundary
        |--------------------------------------------------------------------------
        */

        headers: {
          "Content-Type":
            undefined,
        },
      },
    );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Get processing status
|--------------------------------------------------------------------------
*/

export async function getAdminTrackProcessingStatus(
  trackId,
) {
  const response =
    await apiClient.get(
      `/admin/tracks/${trackId}/status`,
      {
        params: {
          _t: Date.now(),
        },
      },
    );

  return (
    response.data?.data ??
    response.data
  );
}

/*
|--------------------------------------------------------------------------
| List uploaded tracks
|--------------------------------------------------------------------------
*/

export async function getAdminTracks({
  page = 1,
  limit = 20,
  status = "",
} = {}) {
  const response =
    await apiClient.get(
      "/admin/tracks",
      {
        params: {
          page,
          limit,

          ...(status
            ? {
              status,
            }
            : {}),

          /*
          |--------------------------------------------------------------------------
          | Avoid stale browser/proxy response
          |--------------------------------------------------------------------------
          */

          _t: Date.now(),
        },
      },
    );

  return (
    response.data?.data ??
    response.data
  );
}

/*
|--------------------------------------------------------------------------
| Retry failed track
|--------------------------------------------------------------------------
*/

export async function retryAdminTrack(
  trackId,
) {
  const response =
    await apiClient.post(
      `/admin/tracks/${trackId}/retry`,
    );

  return (
    response.data?.data ??
    response.data
  );
}

/*
|--------------------------------------------------------------------------
| Delete uploaded track
|--------------------------------------------------------------------------
*/

export async function deleteAdminTrack(
  trackId,
) {
  const response =
    await apiClient.delete(
      `/admin/tracks/${trackId}`,
    );

  return (
    response.data?.data ??
    response.data
  );
}