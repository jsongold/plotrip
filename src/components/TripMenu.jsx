import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getDefaultBranchId } from '../hooks/useTrip';

export function TripMenu({ open, currentTripId, onSelect, onClose, anchorRef }) {
  const fallbackRef = useRef(null);
  const containerRef = anchorRef || fallbackRef;
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('trips')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTrips(data || []);
        setLoading(false);
      });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open, onClose, containerRef]);

  if (!open) return null;

  return (
    <div
      ref={anchorRef ? undefined : fallbackRef}
      style={{
        position: 'absolute', top: '100%', left: 0,
        background: 'var(--surface)', border: 'none',
        borderRadius: 'var(--r-md)', boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
        zIndex: 100, minWidth: 200, maxHeight: 300, overflowY: 'auto',
        marginTop: 4,
      }}
    >
      {loading && (
        <div style={{ padding: '12px 16px', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
          Loading...
        </div>
      )}
      {!loading && trips.map((t) => (
        <div
          key={t.id}
          onClick={async () => {
            onClose?.();
            if (t.id !== currentTripId) {
              const branchId = await getDefaultBranchId(t.id);
              onSelect(t.id, branchId);
            }
          }}
          style={{
            padding: '10px 16px', fontSize: 'var(--font-sm)', cursor: 'pointer',
            background: t.id === currentTripId ? 'var(--accent-subtle, #f0f4ff)' : 'transparent',
            color: t.id === currentTripId ? 'var(--accent)' : 'var(--text)',
            fontWeight: t.id === currentTripId ? 600 : 400,
          }}
        >
          {t.name || 'Untitled'}
        </div>
      ))}
      {!loading && trips.length === 0 && (
        <div style={{ padding: '12px 16px', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
          No trips yet
        </div>
      )}
    </div>
  );
}
