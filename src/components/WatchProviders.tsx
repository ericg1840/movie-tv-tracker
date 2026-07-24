import { useEffect, useState } from 'react';
import { getWatchProviders, providerLogoUrl, type WatchProvider, type WatchProviders as WatchProvidersData } from '../lib/tmdb';

function ProviderRow({ label, providers }: { label: string; providers?: WatchProvider[] }) {
  if (!providers || providers.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {providers.map((p) => (
          <img
            key={p.provider_id}
            src={providerLogoUrl(p.logo_path)}
            alt={p.provider_name}
            title={p.provider_name}
            className="h-10 w-10 rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}

export function WatchProviders({ imdbId }: { imdbId: string }) {
  const [data, setData] = useState<WatchProvidersData | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setData(undefined);
    getWatchProviders(imdbId)
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setData(null));
    return () => {
      cancelled = true;
    };
  }, [imdbId]);

  if (data === undefined) {
    return <p className="text-xs text-neutral-400">Checking where to watch…</p>;
  }

  const hasAny = data && (data.flatrate?.length || data.rent?.length || data.buy?.length);
  if (!hasAny) {
    return (
      <p className="text-xs text-neutral-400">
        Not available to stream, rent, or buy in the US right now.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 dark:border-white/10">
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Where to watch
      </p>
      <ProviderRow label="Stream" providers={data.flatrate} />
      <ProviderRow label="Rent" providers={data.rent} />
      <ProviderRow label="Buy" providers={data.buy} />
      <a
        href={data.link}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-purple-600 hover:underline dark:text-purple-400"
      >
        More info on JustWatch
      </a>
    </div>
  );
}
