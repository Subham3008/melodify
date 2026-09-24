export const createTrack = (track) => {
  if (!track) {
    return null;
  }

  return {
    id: track.id,

    source: track.source,

    externalId: track.externalId,

    title: track.title,

    artistId: track.artistId,

    artistName: track.artistName,

    albumId: track.albumId ?? null,

    albumName: track.albumName ?? null,

    durationSeconds: track.durationSeconds,

    imageUrl: track.imageUrl,

    streamUrl: track.streamUrl,

    licenseUrl: track.licenseUrl ?? null,

    downloadAllowed:
      track.downloadAllowed ?? false,
  };
};