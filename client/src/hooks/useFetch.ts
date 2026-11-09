import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';

/** Small data-fetching hook with loading / error / reload. */
export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api
      .get<T>(path, ctrl.signal)
      .then((d) => setData(d))
      .catch((e) => {
        if ((e as Error).name !== 'AbortError') setError(e instanceof ApiError ? e.message : 'Could not load content.');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [path, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, reload, setData };
}
