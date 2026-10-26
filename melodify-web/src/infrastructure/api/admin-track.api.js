const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

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

  /*
  |--------------------------------------------------------------------------
  | Required metadata
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Optional album
  |--------------------------------------------------------------------------
  */

  if (albumName?.trim()) {
    formData.append(
      "albumName",
      albumName.trim(),
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Audio
  |--------------------------------------------------------------------------
  */

  if (audioFile) {
    formData.append(
      "audio",
      audioFile,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Cover
  |
  | Backend accepts:
  | 1. uploaded cover file
  | OR
  | 2. imageUrl
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Request
  |--------------------------------------------------------------------------
  */

  const response =
    await fetch(
      `${API_URL}/admin/tracks`,
      {
        method: "POST",

        /*
        Important:
        Authentication is cookie based.
        */

        credentials: "include",

        /*
        Do NOT manually set
        Content-Type here.

        Browser automatically
        creates the multipart
        boundary.
        */

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