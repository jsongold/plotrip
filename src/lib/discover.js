import { supabase } from './supabase';

/**
 * Calls the discover() RPC. Returns an array of DiscoverResult.
 * Filters are all optional — pass `{}` for a broad query.
 */
export async function discover(filters = {}) {
  const { data, error } = await supabase.rpc('discover', { filters });
  if (error) {
    console.warn('[discover] rpc error:', error.message);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Loads moods (preset shortcuts) from the moods table, ordered by sort_order.
 */
export async function getMoods() {
  const { data, error } = await supabase
    .from('moods')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.warn('[getMoods] error:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Trailing-edge debounce. Returns a debounced wrapper with a `.cancel()` method.
 */
export function debounce(fn, ms = 150) {
  let timer = null;
  const wrapped = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
  wrapped.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return wrapped;
}
