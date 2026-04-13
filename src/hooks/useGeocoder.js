import { useState } from 'react';

export function useGeocoder() {
  const [status, setStatus] = useState('');

  async function geocode(name) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(name)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();
    if (!data.length) throw new Error('Not found');
    const raw = data[0];
    const display_name = raw.display_name || '';
    const parts = display_name.split(',');
    const shortName = parts[0]?.trim() || name;
    const country = parts.length > 1 ? parts[parts.length - 1].trim() : null;
    return {
      name: shortName,
      lat: parseFloat(raw.lat),
      lng: parseFloat(raw.lon),
      country,
      display_name,
    };
  }

  async function search(name, onSuccess) {
    if (!name.trim()) return;
    setStatus('Searching...');
    try {
      const city = await geocode(name.trim());
      onSuccess(city);
      setStatus('');
    } catch {
      setStatus('City not found');
      setTimeout(() => setStatus(''), 2000);
    }
  }

  return { status, setStatus, search };
}
