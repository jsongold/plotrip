import { useState, useEffect } from 'react';
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
  }

  async function handleFork(index) {
    const name = prompt('Name for the new branch:');
    if (!name) return;
    try {
      const newBranch = await forkBranch(tripId, branchId, index, name);
      setBranches((prev) => [...prev, newBranch]);
      navigate(`/t/${tripId}/b/${newBranch.id}`);
    } catch (err) {
      setStatus(`Fork failed: ${err.message}`);
      setTimeout(() => setStatus(''), 3000);
    }
  }

  function handleClear() {
    if (cities.length === 0) return;
    if (confirm('Clear all cities?')) clearCities();
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f5f5f5' }}>
      <Map
        cities={cities}
        onCitySelect={handleAdd}
        style={{ flex: '1 1 65%', minHeight: 300 }}
      />
      <div style={{
        flexShrink: 0, maxHeight: '45vh',
        background: '#fff', borderTop: '1px solid #ddd',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column',
      }}>
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
          <Toolbar onAdd={handleAdd} onClear={handleClear} status={status} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
          <CityList cities={cities} onRemove={handleRemove} onReorder={reorderCity} onDaysChange={updateDays} onFork={handleFork} startDate={startDate} onStartDateChange={handleStartDateChange} />
        </div>
      </div>
    </div>
  );
}
