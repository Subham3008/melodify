import TrackCard from "./TrackCard";

export default function TrackGrid({ tracks }) {
  if (tracks.length === 0) {
    return (
      <div
        className="
          rounded-lg
          border
          border-neutral-800
          bg-[#181818]
          p-8
          text-center
          text-neutral-400
        "
      >
        No tracks available.
      </div>
    );
  }

  return (
    <div
      className="
        grid
        grid-cols-2
        gap-4
        sm:grid-cols-3
        lg:grid-cols-4
        xl:grid-cols-5
      "
    >
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} />
      ))}
    </div>
  );
}
