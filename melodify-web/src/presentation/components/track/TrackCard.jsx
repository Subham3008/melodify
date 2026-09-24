export default function TrackCard({ track }) {
  const minutes = Math.floor(track.durationSeconds / 60);

  const seconds = String(track.durationSeconds % 60).padStart(2, "0");

  return (
    <article
      className="
        group
        rounded-lg
        bg-[#181818]
        p-4
        transition
        duration-200
        hover:bg-[#282828]
      "
    >
      <div className="relative">
        <img
          src={track.imageUrl}
          alt={track.title}
          className="
            aspect-square
            w-full
            rounded-md
            object-cover
            shadow-lg
          "
        />

        <button
          type="button"
          onClick={() => {
            console.log("Selected track:", track);
          }}
          className="
            absolute
            right-3
            bottom-3
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-[#1ed760]
            text-lg
            text-black
            opacity-0
            shadow-xl
            transition
            duration-200
            group-hover:opacity-100
          "
          aria-label={`Play ${track.title}`}
        >
          ▶
        </button>
      </div>

      <div className="mt-4">
        <h3
          className="
            truncate
            font-bold
            text-white
          "
        >
          {track.title}
        </h3>

        <p
          className="
            mt-1
            truncate
            text-sm
            text-neutral-400
          "
        >
          {track.artistName}
        </p>

        <div
          className="
            mt-2
            flex
            items-center
            justify-between
            gap-3
            text-xs
            text-neutral-500
          "
        >
          <span className="truncate">{track.albumName || "Single"}</span>

          <span className="shrink-0">
            {minutes}:{seconds}
          </span>
        </div>
      </div>
    </article>
  );
}
