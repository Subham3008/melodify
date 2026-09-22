export interface JamendoTrack {
  id: string;
  name: string;

  artist_id: string;
  artist_name: string;

  album_id?: string;
  album_name?: string;

  duration: number;

  image: string;
  audio: string;

  license_ccurl?: string;

  audiodownload_allowed?: boolean;
}

export interface JamendoTracksResponse {
  headers: {
    status: string;
    code: number;
    error_message: string;
    results_count: number;
  };

  results: JamendoTrack[];
}

export interface NormalizedTrack {
  source: "jamendo";

  externalId: string;

  title: string;

  artistId: string;
  artistName: string;

  albumId: string | null;
  albumName: string | null;

  durationSeconds: number;

  imageUrl: string;
  streamUrl: string;

  licenseUrl: string | null;

  downloadAllowed: boolean;
}

export interface TrackDTO extends NormalizedTrack {
  id: string;
}
