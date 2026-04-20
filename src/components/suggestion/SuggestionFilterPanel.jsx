import { useState } from 'react';
import { bump } from '../../lib/haptics';

const SCALE_CYCLE = ['city', 'poi'];
const SCALE_LABELS = { city: 'City', poi: 'POI' };

const PLACE_CYCLE = [null, 'town', 'beach', 'mountain'];
const PLACE_LABELS = { town: 'Town', beach: 'Beach', mountain: 'Mtn' };

const CROWD_CYCLE = [null, 'quiet', 'balanced', 'bustling'];
const CROWD_LABELS = { quiet: 'Calm', balanced: 'Mix', bustling: 'Busy' };

const PURPOSE_OPTIONS = [
  { value: 'beach', label: 'Beach' },
  { value: 'food', label: 'Food' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'architecture', label: 'Arch.' },
  { value: 'party', label: 'Party' },
  { value: 'swimming', label: 'Swim' },
  { value: 'winter_sport', label: 'Winter' },
];

function cycle(arr, current) {
  const idx = arr.indexOf(current);
  return arr[(idx + 1) % arr.length];
}

function CycleIcon({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); bump(); onClick(); }}
      style={{
        width: 44, height: 44,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
        background: 'var(--surface, #fff)',
        borderRadius: 'var(--r-md)',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'color 120ms ease, transform 120ms ease',
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>{label || 'Any'}</span>
    </button>
  );
}

function ScaleIcon({ scale }) {
  const s = { width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (scale === 'city') return (
    <svg viewBox="0 0 24 24" {...s}>
      <rect x="3" y="9" width="7" height="13"/><rect x="14" y="3" width="7" height="19"/><line x1="2" y1="22" x2="22" y2="22"/><line x1="5" y1="13" x2="8" y2="13"/><line x1="5" y1="17" x2="8" y2="17"/><line x1="16" y1="7" x2="19" y2="7"/><line x1="16" y1="11" x2="19" y2="11"/><line x1="16" y1="15" x2="19" y2="15"/>
    </svg>
  );
  if (scale === 'poi') return (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/><line x1="11" y1="12" x2="13" y2="12"/>
    </svg>
  );
}

function PlaceIcon({ place }) {
  const s = { width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (place === 'town') return (
    <svg viewBox="0 0 24 24" {...s}>
      <rect x="4" y="10" width="6" height="12"/><rect x="14" y="4" width="6" height="18"/><line x1="2" y1="22" x2="22" y2="22"/><line x1="6" y1="14" x2="8" y2="14"/><line x1="16" y1="8" x2="18" y2="8"/><line x1="16" y1="12" x2="18" y2="12"/><line x1="16" y1="16" x2="18" y2="16"/>
    </svg>
  );
  if (place === 'beach') return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M17.5 8a5.5 5.5 0 0 0-11 0"/><path d="M12 2.5V8"/><line x1="3" y1="22" x2="21" y2="22"/><path d="M12 8l-7 14"/><path d="M12 8l7 14"/><path d="M3 18c3-1 6 1 9 0s6-1 9 0"/>
    </svg>
  );
  if (place === 'mountain') return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M8 22l4-10 4 10"/><path d="M2 22l7-14 3 6"/><path d="M22 22l-7-14-3 6"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/>
    </svg>
  );
}

function CrowdIcon({ crowd }) {
  const s = { width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (crowd === 'quiet') return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
  if (crowd === 'bustling') return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" {...s}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-1a3 3 0 0 0-2-2.83"/><circle cx="19" cy="7" r="2.5" strokeDasharray="4 2"/>
    </svg>
  );
}

function PurposeIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h3a1 1 0 0 0 1-1V4"/><path d="M20 7h-3a1 1 0 0 1-1-1V4"/><rect x="2" y="7" width="20" height="14" rx="2"/><line x1="9" y1="11" x2="9" y2="17"/><line x1="15" y1="11" x2="15" y2="17"/><line x1="6" y1="14" x2="18" y2="14"/>
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  );
}

export function SuggestionFilterPanel({ onSearch }) {
  const [selectedPurposes, setSelectedPurposes] = useState(new Set());
  const [scale, setScale] = useState('city');
  const [place, setPlace] = useState(null);
  const [crowd, setCrowd] = useState(null);
  const [purposeOpen, setPurposeOpen] = useState(false);

  const togglePurpose = (value) => {
    setSelectedPurposes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleSearch = () => {
    const vibes = [...selectedPurposes];
    if (place) vibes.push(place);
    onSearch({
      purposes: vibes,
      crowd,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <CycleIcon
          active={scale != null}
          label={SCALE_LABELS[scale]}
          onClick={() => setScale(cycle(SCALE_CYCLE, scale))}
          icon={<ScaleIcon scale={scale} />}
        />
        <CycleIcon
          active={place != null}
          label={PLACE_LABELS[place]}
          onClick={() => setPlace(cycle(PLACE_CYCLE, place))}
          icon={<PlaceIcon place={place} />}
        />
        <CycleIcon
          active={crowd != null}
          label={CROWD_LABELS[crowd]}
          onClick={() => setCrowd(cycle(CROWD_CYCLE, crowd))}
          icon={<CrowdIcon crowd={crowd} />}
        />
        <CycleIcon
          active={purposeOpen || selectedPurposes.size > 0}
          label={selectedPurposes.size > 0 ? `${selectedPurposes.size} set` : null}
          onClick={() => setPurposeOpen((v) => !v)}
          icon={<PurposeIcon />}
        />
        <button
          type="button"
          aria-label="Search nearby"
          title="Search nearby"
          onClick={(e) => { e.stopPropagation(); bump(); handleSearch(); }}
          style={{
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--accent)',
            borderRadius: 'var(--r-md)',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--accent-text, #fff)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 120ms ease',
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.94)'; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <RadarIcon />
        </button>
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        justifyContent: 'center',
        maxWidth: 230,
        overflow: 'hidden',
        maxHeight: purposeOpen ? 100 : 0,
        opacity: purposeOpen ? 1 : 0,
        transition: 'max-height 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease',
      }}>
        {PURPOSE_OPTIONS.map((p) => {
          const active = selectedPurposes.has(p.value);
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={active}
              onClick={(e) => { e.stopPropagation(); bump(); togglePurpose(p.value); }}
              style={{
                padding: '6px 12px',
                minHeight: 32,
                borderRadius: 'var(--r-pill)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 500,
                background: active ? 'var(--accent)' : 'var(--surface, #fff)',
                color: active ? 'var(--accent-text)' : 'var(--text)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'background 120ms ease, color 120ms ease',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
