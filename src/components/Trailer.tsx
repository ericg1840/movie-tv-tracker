import { useEffect, useState } from 'react';
import { getTrailer, type Trailer as TrailerData } from '../lib/tmdb';

export function Trailer({ imdbId }: { imdbId: string }) {
  const [trailer, setTrailer] = useState<TrailerData | null | undefined>(undefined);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTrailer(undefined);
    setPlaying(false);
    getTrailer(imdbId)
      .then((t) => !cancelled && setTrailer(t))
      .catch(() => !cancelled && setTrailer(null));
    return () => {
      cancelled = true;
    };
  }, [imdbId]);

  if (trailer === undefined) {
    return <p className="text-xs text-neutral-400">Checking for a trailer…</p>;
  }

  if (!trailer) return null;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1`}
          title={trailer.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <button
          onClick={() => setPlaying(true)}
          className="relative flex h-full w-full items-center justify-center"
        >
          <img
            src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`}
            alt={trailer.name}
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            loading="lazy"
          />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-2xl text-brand-800 shadow-lg">
            ▶
          </span>
        </button>
      )}
    </div>
  );
}
