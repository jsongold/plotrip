import { supabase } from '../lib/supabase';
import { hashPassword, verifyPassword } from '../lib/crypto';
import { track } from '../lib/analytics';

export async function requireCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? { id: 'guest', email: 'guest@plotrip.local' };
}

export async function createTrip(name, password) {
  const user = await requireCurrentUser();
  let passwordHash = null;
  if (password) {
    passwordHash = await hashPassword(password);
  }

  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .insert({ name, password_hash: passwordHash, user_id: user.id })
    .select()
    .single();
  if (tripErr) throw tripErr;

  const { data: branch, error: branchErr } = await supabase
    .from('branches')
    .insert({ trip_id: trip.id, name: 'main' })
    .select()
    .single();
  if (branchErr) throw branchErr;

  track('trip_created', { has_password: !!password });

  return { tripId: trip.id, branchId: branch.id };
}

export async function loadTrip(tripId) {
  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();
  if (tripErr) throw tripErr;

  const { data: branches, error: branchErr } = await supabase
    .from('branches')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at');
  if (branchErr) throw branchErr;

  return { trip, branches };
}

export async function getDefaultBranchId(tripId) {
  const { data, error } = await supabase
    .from('branches')
    .select('id')
    .eq('trip_id', tripId)
    .is('parent_branch_id', null)
    .order('created_at')
    .limit(1)
    .single();
  if (error) throw error;
  return data.id;
}

export function isProtected(trip) {
  return !!trip.password_hash;
}

export function isUnlocked(tripId) {
  return sessionStorage.getItem(`plotrip_unlock_${tripId}`) === '1';
}

export function markUnlocked(tripId) {
  sessionStorage.setItem(`plotrip_unlock_${tripId}`, '1');
}

export async function checkPassword(trip, input) {
  if (!trip.password_hash) return true;
  return verifyPassword(input, trip.password_hash);
}
