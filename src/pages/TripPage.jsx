import { useState, useEffect } from 'react';
import { Map } from '../components/Map';
import { Toolbar } from '../components/Toolbar';
import { CityList } from '../components/CityList';
import { BranchBar } from '../components/BranchBar';
import { PasswordGate } from '../components/PasswordGate';
import { useGeocoder } from '../hooks/useGeocoder';
import { useBranch, forkBranch } from '../hooks/useBranch';
import { loadTrip, isProtected, isUnlocked, getDefaultBranchId } from '../hooks/useTrip';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';

export function TripPage({ tripId, branchId, navigate, replace }) {
  const [trip, setTrip] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  const { cities, loading: citiesLoading, addCity, removeCity, moveCity, clearCities } =
    useBranch(branchId, branches);
  const { status, setStatus, search } = useGeocoder();

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

  function handleAdd(input, clearInput) {
    search(input, (city) => {
      addCity(city);
      clearInput();
    });
  }

  function handleCatalogSelect(city) {
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
        onCitySelect={handleCatalogSelect}
        style={{ flex: '1 1 65%', minHeight: 300 }}
      />
      <div style={{
        flexShrink: 0, maxHeight: '45vh', overflowY: 'auto',
        background: '#fff', borderTop: '1px solid #ddd',
        padding: '12px 16px', boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'
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
        <CityList cities={cities} onRemove={handleRemove} onMove={moveCity} onFork={handleFork} />
      </div>
    </div>
  );
}
