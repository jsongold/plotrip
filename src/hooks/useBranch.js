import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useBranch(branchId, branches) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const branch = branches?.find(b => b.id === branchId);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);

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
        inherited: true,
      }));
    }

    const { data: ownDests } = await supabase
      .from('destinations')
      .select('*')
      .eq('branch_id', branchId)
      .order('position');

    const own = (ownDests || []).map(d => ({
      id: d.id, name: d.name, lat: d.lat, lng: d.lng,
      country: d.country || null, display_name: d.display_name || null,
      inherited: false,
    }));

    setCities([...inherited, ...own]);
    setLoading(false);
  }, [branchId, branch?.parent_branch_id, branch?.fork_index]);

  useEffect(() => { load(); }, [load]);

  async function addCity(city) {
    const ownCount = cities.filter(c => !c.inherited).length;
    const { data, error } = await supabase
      .from('destinations')
      .insert({
        branch_id: branchId,
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        country: city.country || null,
        display_name: city.display_name || null,
        position: ownCount,
      })
      .select()
      .single();
    if (error) throw error;
    setCities(prev => [...prev, {
      id: data.id, name: data.name, lat: data.lat, lng: data.lng,
      country: data.country || null, display_name: data.display_name || null,
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

  async function moveCity(index, direction) {
    const city = cities[index];
    const targetIndex = index + direction;
    const target = cities[targetIndex];
    if (!city || !target || city.inherited || target.inherited) return;

    // Optimistic local swap
    setCities(prev => {
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });

    // Persist to DB using a temporary position to avoid unique constraint issues
    const posA = getOwnPosition(index);
    const posB = getOwnPosition(targetIndex);
    await supabase.from('destinations').update({ position: -1 }).eq('id', city.id);
    await supabase.from('destinations').update({ position: posA }).eq('id', target.id);
    await supabase.from('destinations').update({ position: posB }).eq('id', city.id);
  }

  function getOwnPosition(globalIndex) {
    const inheritedCount = cities.filter(c => c.inherited).length;
    return globalIndex - inheritedCount;
  }

  async function clearCities() {
    const ownIds = cities.filter(c => !c.inherited).map(c => c.id);
    if (ownIds.length === 0) return;
    await supabase.from('destinations').delete().in('id', ownIds);
    setCities(prev => prev.filter(c => c.inherited));
  }

  return { cities, loading, addCity, removeCity, moveCity, clearCities, reload: load };
}

export async function forkBranch(tripId, parentBranchId, forkIndex, name) {
  const { data, error } = await supabase
    .from('branches')
    .insert({
      trip_id: tripId,
      parent_branch_id: parentBranchId,
      fork_index: forkIndex,
      name,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
