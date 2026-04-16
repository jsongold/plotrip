import { useState, useEffect, useCallback } from 'react';

const TRIP_RE = /^\/t\/([^/]+)(?:\/b\/([^/]+))?$/;
const SHORT_RE = /^\/s\/([^/]+)$/;

function parsePath(pathname) {
  const m = pathname.match(TRIP_RE);
  if (m) return { page: 'trip', tripId: m[1], branchId: m[2] || null, code: null };
  const s = pathname.match(SHORT_RE);
  if (s) return { page: 'short', tripId: null, branchId: null, code: s[1] };
  if (pathname === '/new') return { page: 'new', tripId: null, branchId: null, code: null };
  return { page: 'home', tripId: null, branchId: null, code: null };
}

export function useRouter() {
  const [route, setRoute] = useState(() => parsePath(location.pathname));

  useEffect(() => {
    function onPop() {
      setRoute(parsePath(location.pathname));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((path) => {
    history.pushState(null, '', path);
    setRoute(parsePath(path));
  }, []);

  const replace = useCallback((path) => {
    history.replaceState(null, '', path);
    setRoute(parsePath(path));
  }, []);

  return { ...route, navigate, replace };
}
