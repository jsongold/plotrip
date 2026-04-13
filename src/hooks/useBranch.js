import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useBranch(branchId, branches) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const branchIdRef = useRef(branchId);

  // Keep ref in sync for use in async functions
  useEffect(() => {
    branchIdRef.current = branchId;
  }, [branchId]);

  // Clear cities immediately when branch changes
  useEffect(() => {
    setCities([]);
    setLoading(true);
  }, [branchId]);

  const branch = branches?.find(b => b.id === branchId);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    const currentBranchId = branchId;

    let inherited = [];
    if (branch?.parent_branch_id != null && branch.fork_index != null) {
      const { data: parentDests } = await supabase
        .from('destinations')
        .select('*')
        .eq('branch_id', branch.parent_branch_id)
        .order('position')
        .lte('position', branch.fork_index);
      inherited = (parentDests || []).map(d => ({
        id: d.id, name: d.name, lat: d.lat, lng: d.lng,
        country: d.country || null, display_name: d.display_name || null,
        days: d.days ?? 1,
        inherited: true,
      }));
    }

    const { data: ownDests } = await supabase
      .from('destinations')
      .select('*')
      .eq('branch_id', currentBranchId)
      .order('position');

    // Abort if branch changed during async load
    if (branchIdRef.current !== currentBranchId) return;

    const own = (ownDests || []).map(d => ({
      id: d.id, name: d.name, lat: d.lat, lng: d.lng,
      country: d.country || null, display_name: d.display_name || null,
      days: d.days ?? 1,
      inherited: false,
    }));

    setCities([...inherited, ...own]);
    setLoading(false);
  }, [branchId, branch?.parent_branch_id, branch?.fork_index]);

  useEffect(() => { load(); }, [load]);

  async function addCity(city) {
    let country = city.country || null;
    // Auto-fill country from catalog if missing
    if (!country) {
      const { data: match } = await supabase
        .from('catalog_cities')
        .select('country')
        .ilike('name', city.name)
        .limit(1)
        .single();
      if (match) country = match.country;
    }

    const ownCount = cities.filter(c => !c.inherited).length;
    const { data, error } = await supabase
      .from('destinations')
      .insert({
        branch_id: branchIdRef.current,
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        country,
        display_name: city.display_name || null,
        days: city.days || 1,
        position: ownCount,
      })
      .select()
      .single();
    if (error) throw error;
    setCities(prev => [...prev, {
      id: data.id, name: data.name, lat: data.lat, lng: data.lng,
      country: data.country || null, display_name: data.display_name || null,
      days: data.days ?? 1,
      inherited: false,
    }]);
  }

  async function removeCity(index) {
    const city = cities[index];
    if (city.inherited) return;
    await supabase.from('destinations').delete().eq('id', city.id);
    await reorderAfterRemove(index);
    await load();
  }

  async function reorderAfterRemove(removedIndex) {
    const ownCities = cities.filter(c => !c.inherited);
    const inheritedCount = cities.filter(c => c.inherited).length;
    const ownIndex = removedIndex - inheritedCount;
    const remaining = ownCities.filter((_, i) => i !== ownIndex);
    for (let i = 0; i < remaining.length; i++) {
      await supabase.from('destinations').update({ position: i }).eq('id', remaining[i].id);
    }
  }

  async function reorderCity(sourceIndex, destIndex) {
    if (sourceIndex === destIndex) return;
    const city = cities[sourceIndex];
    if (city.inherited) return;

    // Optimistic reorder
    setCities(prev => {
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(destIndex, 0, moved);
      return next;
    });

    // Persist: rebuild all own positions
    const reordered = [...cities];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);
    const ownCities = reordered.filter(c => !c.inherited);
    for (let i = 0; i < ownCities.length; i++) {
      await supabase.from('destinations').update({ position: i }).eq('id', ownCities[i].id);
    }
  }

  async function updateDays(index, days) {
    const city = cities[index];
    if (city.inherited) return;
    setCities(prev => prev.map((c, i) => i === index ? { ...c, days } : c));
    await supabase.from('destinations').update({ days }).eq('id', city.id);
  }

  async function clearCities() {
    const ownIds = cities.filter(c => !c.inherited).map(c => c.id);
    if (ownIds.length === 0) return;
    await supabase.from('destinations').delete().in('id', ownIds);
    setCities(prev => prev.filter(c => c.inherited));
  }

  return { cities, loading, addCity, removeCity, reorderCity, updateDays, clearCities, reload: load };
}

export async function forkBranch(tripId, parentBranchId, forkIndex, name, cities) {
  // Create branch without parent reference - we copy destinations instead
  const { data: branch, error } = await supabase
    .from('branches')
    .insert({
      trip_id: tripId,
      name,
    })
    .select()
    .single();
  if (error) throw error;

  // Copy destinations up to and including forkIndex
  const toCopy = cities.slice(0, forkIndex + 1);
  if (toCopy.length > 0) {
    const rows = toCopy.map((c, i) => ({
      branch_id: branch.id,
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      country: c.country || null,
      display_name: c.display_name || null,
      days: c.days ?? 1,
      position: i,
    }));
    await supabase.from('destinations').insert(rows);
  }

  return branch;
}
