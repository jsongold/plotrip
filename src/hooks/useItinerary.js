import { useState, useEffect } from 'react';

function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  const d = params.get('d');
  if (!d) return [];
  try {
    const json = decodeURIComponent(escape(atob(d)));
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function useItinerary() {
  const [cities, setCities] = useState(() => loadFromUrl());

  function addCity(city) {
    setCities(prev => {
      if (prev.some(c => c.name === city.name && Math.abs(c.lat - city.lat) < 0.01)) return prev;
      return [...prev, city];
    });
  }

  function removeCity(index) {
    setCities(prev => prev.filter((_, i) => i !== index));
  }

  function moveCity(index, direction) {
    setCities(prev => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function clearCities() {
    setCities([]);
  }

  function getShareUrl() {
    const json = JSON.stringify(cities);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return `${location.origin}${location.pathname}?d=${b64}`;
  }

  return { cities, addCity, removeCity, moveCity, clearCities, getShareUrl };
}
