import { useState } from 'react';
import { discover } from '../../lib/discover';
import { createTrip } from '../../hooks/useTrip';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export function useItinerarySuggestion({ navigate, tripId, branchId, addCity }) {
  const { isAuthenticated } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  async function generate(filters, { count = 5, mode = 'new-trip' } = {}) {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const results = await discover(filters);
      if (results.length === 0) {
        setError('no-results');
        return;
      }
      const toAdd = results.slice(0, count);

      if (mode === 'new-trip') {
        const { tripId: newTripId, branchId: newBranchId } = await createTrip('Auto-generated trip');
        const rows = toAdd.map((city, i) => ({
          branch_id: newBranchId,
          name: city.name,
          lat: city.lat,
          lng: city.lng,
          country: city.country || null,
          days: 1,
          position: i,
        }));
        const { error: insertErr } = await supabase.from('destinations').insert(rows);
        if (insertErr) throw insertErr;
        navigate(`/t/${newTripId}/b/${newBranchId}`);

      } else if (mode === 'new-branch') {
        const { data: branch, error: branchErr } = await supabase
          .from('branches')
          .insert({ trip_id: tripId, name: 'Auto-generated' })
          .select()
          .single();
        if (branchErr) throw branchErr;
        const rows = toAdd.map((city, i) => ({
          branch_id: branch.id,
          name: city.name,
          lat: city.lat,
          lng: city.lng,
          country: city.country || null,
          days: 1,
          position: i,
        }));
        const { error: insertErr } = await supabase.from('destinations').insert(rows);
        if (insertErr) throw insertErr;
        navigate(`/t/${tripId}/b/${branch.id}`);

      } else if (mode === 'add-to-branch') {
        for (const city of toAdd) {
          await addCity({
            name: city.name,
            lat: city.lat,
            lng: city.lng,
            country: city.country || null,
          });
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return { generate, generating, error };
}
