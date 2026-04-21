import { useCallback } from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 20;

async function fetchNominatim(q, exclude) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return [];
    const data = await res.json();
    return data
      .filter(d => {
        const n = d.display_name.split(',')[0].trim().toLowerCase();
        return !exclude.some(c => c.value.name.toLowerCase() === n);
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
  } catch {
    return [];
  }
}

export function Toolbar({ onAdd, status }) {
  const loadOptions = useCallback(async (inputValue, _loaded, additional) => {
    const q = inputValue.trim();
    if (!q) {
      return { options: [], hasMore: false, additional: { page: 0 } };
    }
    const page = additional?.page ?? 0;
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Escape commas in query for .or() syntax
    const safeQ = q.replace(/,/g, ' ');

    const { data } = await supabase
      .from('catalog_cities')
      .select('name,lat,lng,country')
      .or(`name.ilike.%${safeQ}%,country.ilike.%${safeQ}%`)
      .order('population', { ascending: false })
      .range(from, to);

    const catalogResults = (data || []).map(d => ({
      label: d.country ? `${d.name}, ${d.country}` : d.name,
      value: { name: d.name, lat: d.lat, lng: d.lng, country: d.country, source: 'catalog' },
    }));

    const hasMore = catalogResults.length === PAGE_SIZE;

    // Nominatim fallback only on first page if few results
    let extra = [];
    if (page === 0 && catalogResults.length < 5 && q.length >= 2) {
      extra = await fetchNominatim(q, catalogResults);
    }

    return {
      options: [...catalogResults, ...extra],
      hasMore,
      additional: { page: page + 1 },
    };
  }, []);

  function handleSelect(option) {
    if (!option) return;
    onAdd(option.value);
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'transparent' }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <AsyncPaginate
          loadOptions={loadOptions}
          onChange={handleSelect}
          placeholder="Search city or country..."
          noOptionsMessage={({ inputValue }) => inputValue ? 'Type to search...' : 'Type a city or country name'}
          value={null}
          isSearchable
          styles={selectStyles}
          components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
          menuPlacement="top"
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          additional={{ page: 0 }}
          debounceTimeout={300}
          openMenuOnFocus
          openMenuOnClick
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
  input: (base) => ({
    ...base,
    width: '100%',
    gridTemplateColumns: '0 1fr',
  }),
};

const circleBtn = {
  width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
};

const clearBtn = {
  ...circleBtn, background: 'none', color: '#dc2626', border: '1px solid #eee',
};
