import { useEffect, useState } from 'react';
import { useRouter } from './hooks/useRouter';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { TripPage } from './pages/TripPage';
import { supabase } from './lib/supabase';

function ShortRedirect({ code }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase
      .from('short_links')
      .select('url')
      .eq('code', code)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Link not found');
        } else {
          window.location.href = data.url;
        }
      });
  }, [code]);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: '#888' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: '#888' }}>
      Redirecting...
    </div>
  );
}

export default function App() {
  const { page, tripId, branchId, code, navigate, replace } = useRouter();

  const lockedHeight = page === 'trip' || page === 'short';
  return (
    <div style={{
      ...(lockedHeight ? { height: '100dvh', overflow: 'hidden' } : { minHeight: '100dvh' }),
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
    }}>
      {page === 'home' && <DiscoverPage navigate={navigate} />}
      {page === 'new' && <HomePage navigate={navigate} />}
      {page === 'trip' && (
        <TripPage
          tripId={tripId}
          branchId={branchId}
          navigate={navigate}
          replace={replace}
        />
      )}
      {page === 'short' && <ShortRedirect code={code} replace={replace} />}
    </div>
  );
}
