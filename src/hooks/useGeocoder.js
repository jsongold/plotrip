import { useState } from 'react';

export function useGeocoder() {
  const [status, setStatus] = useState('');

  async function geocode(name) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(name)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();
    if (!data.length) throw new Error('Not found');
    return { name, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
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
