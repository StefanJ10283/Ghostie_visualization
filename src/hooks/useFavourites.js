import { useState, useEffect, useCallback, useRef } from 'react';

export function useFavourites(api) {
  const apiRef = useRef(api);
  apiRef.current = api;

  const [favourites, setFavourites] = useState(new Set());
  // Always-current ref so toggle() never reads stale state
  const favRef = useRef(new Set());

  const _set = (s) => { favRef.current = s; setFavourites(s); };

  useEffect(() => {
    apiRef.current('/users/me/favourites')
      .then((r) => r.json())
      .then((data) => {
        const list = data.favourited ?? [];
        _set(new Set(Array.isArray(list) ? list : []));
      })
      .catch(() => {});
  }, []);

  const toggle = useCallback(async (businessKey) => {
    if (!businessKey) return;
    const isFav = favRef.current.has(businessKey);

    // Optimistic
    const next = new Set(favRef.current);
    if (isFav) next.delete(businessKey); else next.add(businessKey);
    _set(next);

    try {
      const res = await apiRef.current(`/users/me/favourites/${businessKey}`, {
        method: isFav ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // Revert
      const rev = new Set(favRef.current);
      if (isFav) rev.add(businessKey); else rev.delete(businessKey);
      _set(rev);
    }
  }, []); // stable — reads/writes via favRef only

  return { favourites, toggle };
}
