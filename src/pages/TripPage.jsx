import { useState, useEffect, useRef } from 'react';
import { Map } from '../components/Map';
import { Toolbar } from '../components/Toolbar';
import { CityList } from '../components/CityList';
import { BranchBar } from '../components/BranchBar';
import { PasswordGate } from '../components/PasswordGate';
import { useBranch, forkBranch } from '../hooks/useBranch';
import { loadTrip, isProtected, isUnlocked, getDefaultBranchId } from '../hooks/useTrip';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';

export function TripPage({ tripId, branchId, navigate, replace }) {
  const [trip, setTrip] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  const { cities, loading: citiesLoading, addCity, removeCity, reorderCity, updateDays, clearCities } =
    useBranch(branchId, branches);
  const [status, setStatus] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const startDate = trip?.start_date || null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadTrip(tripId).then(({ trip: t, branches: b }) => {
      if (cancelled) return;
      setTrip(t);
      setBranches(b);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tripId]);

  useEffect(() => {
    if (!trip || loading) return;
    if (branchId) return;
    getDefaultBranchId(tripId).then(defaultId => {
      replace(`/t/${tripId}/b/${defaultId}`);
    });
  }, [trip, loading, branchId, tripId, replace]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' }}>
        Loading trip...
      </div>
    );
  }

  if (isProtected(trip) && !isUnlocked(tripId) && !unlocked) {
    return <PasswordGate trip={trip} onUnlock={() => setUnlocked(true)} />;
  }

  function handleAdd(city) {
    const duplicate = cities.some(
      (c) => c.name === city.name && Math.abs(c.lat - city.lat) < 0.01
    );
    if (duplicate) {
      setStatus(`${city.name} is already added`);
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    addCity(city);
    // Auto-set start_date to today if not set
    if (!startDate) {
      const today = new Date().toISOString().split('T')[0];
      handleStartDateChange(today);
    }
  }

  async function handleFork(index) {
    const name = prompt('Name for the new branch:');
    if (!name) return;
    try {
      const newBranch = await forkBranch(tripId, branchId, index, name, cities);
      setBranches((prev) => [...prev, newBranch]);
      navigate(`/t/${tripId}/b/${newBranch.id}`);
    } catch (err) {
      setStatus(`Fork failed: ${err.message}`);
      setTimeout(() => setStatus(''), 3000);
    }
  }

  async function handleShare() {
    const wantPassword = confirm('Add password protection for sharing?');
    if (wantPassword) {
      const password = prompt('Enter a password for this trip:');
      if (password) {
        const hash = await hashPassword(password);
        await supabase.from('trips').update({ password_hash: hash }).eq('id', tripId);
        setTrip(prev => ({ ...prev, password_hash: hash }));
      } else {
        await supabase.from('trips').update({ password_hash: null }).eq('id', tripId);
        setTrip(prev => ({ ...prev, password_hash: null }));
      }
    } else {
      await supabase.from('trips').update({ password_hash: null }).eq('id', tripId);
      setTrip(prev => ({ ...prev, password_hash: null }));
    }

    const targetUrl = `${window.location.origin}/t/${tripId}/b/${branchId}`;

    // Reuse existing short link for this trip/branch
    const { data: existing } = await supabase
      .from('short_links')
      .select('code')
      .eq('url', targetUrl)
      .limit(1)
      .single();

    let code;
    if (existing) {
      code = existing.code;
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      await supabase.from('short_links').insert({ code, url: targetUrl });
    }

    const shortUrl = `${window.location.origin}/s/${code}`;
    await navigator.clipboard.writeText(shortUrl);
    setStatus('Short link copied!');
    setTimeout(() => setStatus(''), 2000);
  }

  function handleRemove(index) {
    const city = cities[index];
    if (!confirm(`Remove ${city.name}?`)) return;
    removeCity(index);
  }

  async function handleStartDateChange(date) {
    await supabase.from('trips').update({ start_date: date }).eq('id', tripId);
    setTrip(prev => ({ ...prev, start_date: date }));
  }

  async function handleTripNameChange(newName) {
    if (!newName.trim()) return;
    const { error } = await supabase.from('trips').update({ name: newName.trim() }).eq('id', tripId);
    if (!error) setTrip(prev => ({ ...prev, name: newName.trim() }));
  }

  async function handleBranchNameChange(bId, newName) {
    if (!newName.trim()) return;
    const { error } = await supabase.from('branches').update({ name: newName.trim() }).eq('id', bId);
    if (!error) setBranches(prev => prev.map(b => b.id === bId ? { ...b, name: newName.trim() } : b));
  }

  function handleBranchSwitch(newBranchId) {
    navigate(`/t/${tripId}/b/${newBranchId}`);
  }

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* Layer 1: Map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Map
          cities={cities}
          onCitySelect={handleAdd}
        />
      </div>

      {/* Layer 2: Destination list (bottom sheet) */}
      <DestinationSheet
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      >
        <div style={{
          flexShrink: 0, padding: '8px 16px',
          borderBottom: '1px solid #eee', background: '#fff',
        }}>
          <BranchBar
            tripName={trip?.name}
            branches={branches}
            currentBranchId={branchId}
            onSwitch={handleBranchSwitch}
            onTripNameChange={handleTripNameChange}
            onBranchNameChange={handleBranchNameChange}
            onShare={handleShare}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 80px', minHeight: 0 }}>
          <CityList cities={cities} onRemove={handleRemove} onReorder={reorderCity} onDaysChange={updateDays} onFork={handleFork} startDate={startDate} onStartDateChange={handleStartDateChange} />
        </div>
      </DestinationSheet>

      {/* Layer 3: Search bar (always on top) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 24,
        zIndex: 500, padding: '8px 16px',
        display: 'flex', flexDirection: 'column', gap: 6,
        pointerEvents: 'none',
        background: 'transparent',
      }}>
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            title="Show destinations"
            style={{
              alignSelf: 'center', width: 36, height: 36, borderRadius: '50%',
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
              color: '#333',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
              pointerEvents: 'auto',
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <ellipse cx="12" cy="12" rx="4" ry="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </button>
        )}
        <div style={{ pointerEvents: 'auto' }}>
          <Toolbar onAdd={handleAdd} status={status} />
        </div>
      </div>
    </div>
  );
}

function DestinationSheet({ open, onClose, children }) {
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef(null);

  function handlePointerDown(e) {
    dragStartRef.current = e.clientY;
  }
  function handlePointerMove(e) {
    if (dragStartRef.current == null) return;
    const dy = e.clientY - dragStartRef.current;
    if (dy > 0) setDragY(dy);
  }
  function handlePointerUp() {
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
    dragStartRef.current = null;
  }

  if (!open && dragY === 0) return null;

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      height: '70vh', zIndex: 400,
      background: '#fff', borderTop: '1px solid #ddd',
      borderTopLeftRadius: 12, borderTopRightRadius: 12,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column',
      transform: `translateY(${dragY}px)`,
      transition: dragStartRef.current ? 'none' : 'transform 0.2s',
    }}>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          flexShrink: 0, padding: '8px 0',
          display: 'flex', justifyContent: 'center',
          cursor: 'grab', touchAction: 'none',
        }}
      >
        <div style={{
          width: 40, height: 4, borderRadius: 2, background: '#ccc',
        }} />
      </div>
      {children}
    </div>
  );
}
