import Hls from "hls.js";

/*
|--------------------------------------------------------------------------
| Attach track source to the existing HTMLAudioElement
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. HLS adaptive stream
| 2. Native HLS
| 3. Original streamUrl fallback
|
*/

export const setupTrackAudioSource = ({
  audio,
  track,
}) => {
  if (!audio || !track) {
    return () => { };
  }

  let hls = null;

  const streamUrl =
    track.streamUrl ?? "";

  const hlsUrl =
    track.hlsUrl ?? "";

  /*
  |--------------------------------------------------------------------------
  | Standard stream fallback
  |--------------------------------------------------------------------------
  */

  const loadStandardStream =
    () => {
      if (!streamUrl) {
        audio.removeAttribute(
          "src",
        );

        audio.load();

        return;
      }

      audio.src =
        streamUrl;

      audio.load();
    };

  /*
  |--------------------------------------------------------------------------
  | No HLS available
  |--------------------------------------------------------------------------
  |
  | Jamendo tracks and S3 tracks still processing come here.
  |
  */

  if (!hlsUrl) {
    loadStandardStream();

    return () => {
      audio.removeAttribute(
        "src",
      );
    };
  }

  /*
  |--------------------------------------------------------------------------
  | HLS.js
  |--------------------------------------------------------------------------
  |
  | Chrome / Edge / Firefox etc.
  |
  */

  if (Hls.isSupported()) {
    hls =
      new Hls({
        enableWorker:
          true,

        /*
        |--------------------------------------------------------------------------
        | -1 lets hls.js choose initial quality automatically.
        |--------------------------------------------------------------------------
        */

        startLevel:
          -1,
      });

    hls.loadSource(
      hlsUrl,
    );

    hls.attachMedia(
      audio,
    );

    /*
    |--------------------------------------------------------------------------
    | Fatal HLS error
    |--------------------------------------------------------------------------
    |
    | Don't kill playback.
    |
    | Destroy HLS instance and fall back to original CloudFront audio.
    |
    */

    hls.on(
      Hls.Events.ERROR,
      (
        _event,
        data,
      ) => {
        if (!data.fatal) {
          return;
        }

        console.error(
          "Fatal HLS playback error:",
          data,
        );

        hls?.destroy();

        hls =
          null;

        loadStandardStream();
      },
    );

    return () => {
      hls?.destroy();

      hls =
        null;
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Native HLS
  |--------------------------------------------------------------------------
  |
  | Mainly Safari / browsers with native HLS support.
  |
  */

  if (
    audio.canPlayType(
      "application/vnd.apple.mpegurl",
    )
  ) {
    audio.src =
      hlsUrl;

    audio.load();

    return () => {
      audio.removeAttribute(
        "src",
      );
    };
  }

  /*
  |--------------------------------------------------------------------------
  | HLS unsupported
  |--------------------------------------------------------------------------
  */

  loadStandardStream();

  return () => {
    audio.removeAttribute(
      "src",
    );
  };
};