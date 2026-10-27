const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

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
    await fetch(
      `${API_URL}/admin/tracks`,
      {
        method: "POST",

        credentials:
          "include",

        body: formData,
      },
    );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ??
      data?.error ??
      "Unable to upload track.",
    );
  }

  return data;
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
    await fetch(
      `${API_URL}/admin/tracks/${trackId}/status`,
      {
        method: "GET",

        credentials:
          "include",

        cache: "no-store",
      },
    );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ??
      data?.error ??
      "Unable to get track processing status.",
    );
  }

  return data;
}