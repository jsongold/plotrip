import { useEffect, useState } from 'react';
import { useRouter } from './hooks/useRouter';
import { TripPage } from './pages/TripPage';
import { supabase } from './lib/supabase';
import { useAuth } from './context/AuthContext';
import { AuthPanel } from './components/auth';

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
  const { isInitializing, isAuthenticated } = useAuth();

  if (page === 'auth' || (page !== 'trip' && page !== 'short')) {
    if (isInitializing) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: 'radial-gradient(circle at top, rgba(8,145,178,0.12), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
          color: 'var(--text-muted)',
        }}>
          Checking session...
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: 'radial-gradient(circle at top, rgba(8,145,178,0.12), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
        }}>
          <AuthPanel />
        </div>
      );
    }
  }

  const lockedHeight = page === 'trip' || page === 'short';
  return (
    <div style={{
      ...(lockedHeight ? { height: '100dvh', overflow: 'hidden' } : { minHeight: '100dvh' }),
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
    }}>
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
