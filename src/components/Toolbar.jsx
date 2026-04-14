import { useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { supabase } from '../lib/supabase';

export function Toolbar({ onAdd, status }) {

  const loadOptions = useCallback(async (inputValue) => {
    const q = inputValue.trim();
    if (!q) return [];

    // Search Supabase catalog_cities (167k+ cities)
    const { data: dbResults } = await supabase
      .from('catalog_cities')
      .select('name,lat,lng,country')
      .ilike('name', `%${q}%`)
      .order('population', { ascending: false })
      .limit(10);

    const catalogResults = (dbResults || []).map(d => ({
      label: d.country ? `${d.name}, ${d.country}` : d.name,
      value: { name: d.name, lat: d.lat, lng: d.lng, country: d.country, source: 'catalog' },
    }));

    // Also search Nominatim for places not in DB
    let nominatimResults = [];
    if (q.length >= 2) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
          const data = await res.json();
          nominatimResults = data
            .filter(d => {
              const n = d.display_name.split(',')[0].trim().toLowerCase();
              return !catalogResults.some(c => c.value.name.toLowerCase() === n);
            })
            .map(d => {
              const parts = d.display_name.split(',');
              const name = parts[0].trim();
              const country = parts.length > 1 ? parts[parts.length - 1].trim() : null;
              return {
                label: d.display_name,
                value: {
                  name,
                  lat: parseFloat(d.lat),
                  lng: parseFloat(d.lon),
                  country,
                  display_name: d.display_name,
                  source: 'nominatim',
                },
              };
            });
        }
      } catch {
        // Nominatim failure is not critical
      }
    }

    return [
      ...(catalogResults.length ? [{ label: 'Destinations', options: catalogResults }] : []),
      ...(nominatimResults.length ? [{ label: 'Other results', options: nominatimResults }] : []),
    ];
  }, []);

  function handleSelect(option) {
    if (!option) return;
    onAdd(option.value);
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'transparent' }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <AsyncSelect
          cacheOptions
          loadOptions={loadOptions}
          onChange={handleSelect}
          placeholder="Search city..."
          noOptionsMessage={({ inputValue }) => inputValue ? 'Type to search...' : 'Type a city name'}
          value={null}
          isClearable
          styles={selectStyles}
          components={{ DropdownIndicator: null }}
          menuPlacement="top"
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        />
      </div>
      {status && <span style={{ fontSize: 12, color: '#666' }}>{status}</span>}
    </div>
  );
}

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: 8,
    borderColor: '#ccc',
    background: '#fff',
    fontSize: 14,
    minHeight: 44,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    '&:hover': { borderColor: '#999' },
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 13,
    padding: '8px 12px',
    background: state.isFocused ? '#f0f4ff' : '#fff',
    color: '#333',
    cursor: 'pointer',
  }),
  groupHeading: (base) => ({
    ...base,
    fontSize: 11,
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  placeholder: (base) => ({
    ...base,
    fontSize: 14,
    color: '#aaa',
  }),
};

const circleBtn = {
  width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
};

const clearBtn = {
  ...circleBtn, background: 'none', color: '#dc2626', border: '1px solid #eee',
};
