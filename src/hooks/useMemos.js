import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useMemos(branchId) {
  const [memos, setMemos] = useState([]);

  useEffect(() => {
    if (!branchId) { setMemos([]); return; }
    supabase
      .from('trip_memos')
      .select('*')
      .eq('branch_id', branchId)
      .order('position')
      .then(({ data }) => setMemos(data || []));
  }, [branchId]);

  const addMemo = useCallback(async (afterDestinationId, url) => {
    const existing = memos.filter(m => m.after_destination_id === afterDestinationId);
    const { data, error } = await supabase
      .from('trip_memos')
      .insert({
        branch_id: branchId,
        after_destination_id: afterDestinationId,
        url,
        position: existing.length,
      })
      .select()
      .single();
    if (!error && data) setMemos(prev => [...prev, data]);
    return { data, error };
  }, [branchId, memos]);

  const removeMemo = useCallback(async (memoId) => {
    const { error } = await supabase.from('trip_memos').delete().eq('id', memoId);
    if (!error) setMemos(prev => prev.filter(m => m.id !== memoId));
    return { error };
  }, []);

  const memosForCity = useCallback((destinationId) => {
    return memos.filter(m => m.after_destination_id === destinationId);
  }, [memos]);

  return { memos, addMemo, removeMemo, memosForCity };
}
