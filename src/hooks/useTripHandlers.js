import { forkBranch } from './useBranch';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../lib/crypto';

export function useTripHandlers({
  tripId,
  branchId,
  cities,
  trip,
  branches,
  addCity,
  removeCity,
  clearCities,
  setTrip,
  setBranches,
  setStatus,
  navigate,
}) {
  const startDate = trip?.start_date || null;

  async function handleStartDateChange(date) {
    await supabase.from('trips').update({ start_date: date }).eq('id', tripId);
    setTrip(prev => ({ ...prev, start_date: date }));
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

  function handleNewTrip() {
    navigate('/');
  }

  async function handleNewBranch() {
    const name = prompt('Name for the new branch:');
    if (!name?.trim()) return;
    const { data, error } = await supabase
      .from('branches')
      .insert({ trip_id: tripId, name: name.trim() })
      .select()
      .single();
    if (error) {
      setStatus(`Failed: ${error.message}`);
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    setBranches(prev => [...prev, data]);
    navigate(`/t/${tripId}/b/${data.id}`);
  }

  async function handleDeleteBranch(deleteBranchId) {
    await supabase.from('destinations').delete().eq('branch_id', deleteBranchId);
    await supabase.from('branches').delete().eq('id', deleteBranchId);
    const remaining = branches.filter(b => b.id !== deleteBranchId);
    setBranches(remaining);
    if (deleteBranchId === branchId && remaining.length > 0) {
      navigate(`/t/${tripId}/b/${remaining[0].id}`);
    }
  }

  return {
    handleAdd,
    handleFork,
    handleShare,
    handleRemove,
    handleTripNameChange,
    handleBranchNameChange,
    handleBranchSwitch,
    handleNewTrip,
    handleNewBranch,
    handleDeleteBranch,
    handleStartDateChange,
  };
}
