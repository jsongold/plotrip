import { useState, useEffect } from 'react';

const BED_STEPS = [null, 'bunk', 'single', 'twin', 'double', 'queen', 'king'];
const BED_LABELS = ['', 'bunk', '1', 'twin', 'dbl', 'Q', 'K'];
const DIST_STEPS = [null, 1000, 3000, 5000];
const DIST_LABELS = ['', '1k', '3k', '5k'];
const PRICE_STEPS = [null, 100, 200, 500, 1000];
const PRICE_LABELS = ['', '<100', '<200', '<500', '>1k'];
const PROP_STEPS = [null, 204, 201, 216, 220, 203];
const PROP_LABELS = ['', 'htl', 'apt', 'hstl', 'rsrt', 'ghse'];
const REVIEW_STEPS = [null, 70, 80, 90];
const REVIEW_LABELS = ['', '7+', '8+', '9+'];

const pillStyle = {
  display: 'flex', gap: 4,
  background: 'var(--surface)', borderRadius: 'var(--r-pill)',
  padding: '4px 8px', boxShadow: 'var(--shadow-md)',
  border: '1px solid var(--border)',
};

const iconBtn = {
  width: 36, height: 36, borderRadius: 'var(--r-md)',
  border: 'none', background: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
};

function muted(active) {
  return { ...iconBtn, color: active ? 'var(--accent)' : 'var(--text-muted)' };
}

function Badge({ label }) {
  if (!label) return null;
  return (
    <span style={{
      position: 'absolute', top: -2, right: -2,
      fontSize: 9, fontWeight: 700, lineHeight: 1,
      background: 'var(--accent)', color: 'var(--accent-text)',
      borderRadius: 'var(--r-pill)', padding: '1px 3px',
      pointerEvents: 'none',
    }}>
      {label}
    </span>
  );
}

function HotelIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14" />
      <path d="M3 21h18" />
      <path d="M9 21v-6h6v6" />
      <rect x="9" y="7" width="2" height="2" />
      <rect x="13" y="7" width="2" height="2" />
      <rect x="9" y="12" width="2" height="2" />
      <rect x="13" y="12" width="2" height="2" />
    </svg>
  );
}

function TransportIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2a1 1 0 0 0-.6 1.7l3.8 3.8-2 4.8a1 1 0 0 0 1.1 1.4l4.8-2 3.8 3.8a1 1 0 0 0 1.7-.6z" />
    </svg>
  );
}

function PlaneIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2a1 1 0 0 0-.6 1.7l3.8 3.8-2 4.8a1 1 0 0 0 1.1 1.4l4.8-2 3.8 3.8a1 1 0 0 0 1.7-.6z" />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="16" rx="2" />
      <path d="M4 11h16" />
      <path d="M12 3v8" />
      <circle cx="8" cy="15" r="1" />
      <circle cx="16" cy="15" r="1" />
      <path d="m9 19-2 3" />
      <path d="m15 19 2 3" />
    </svg>
  );
}

function BusIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="14" rx="2" />
      <path d="M4 10h16" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
      <path d="M4 17h16v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2z" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function MemoIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function InsertBar({ index, open, onOpen, onInsert }) {
  const [view, setView] = useState('type');
  const [bedIdx, setBedIdx] = useState(0);
  const [distIdx, setDistIdx] = useState(0);
  const [priceIdx, setPriceIdx] = useState(0);
  const [propIdx, setPropIdx] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [memoUrl, setMemoUrl] = useState('');

  useEffect(() => {
    if (!open) {
      setView('type');
      setBedIdx(0);
      setDistIdx(0);
      setPriceIdx(0);
      setPropIdx(0);
      setReviewIdx(0);
      setMemoUrl('');
    }
  }, [open]);

  if (!open) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 32 }}>
        <button
          onClick={() => onOpen(index)}
          style={{
            width: 22, height: 22, borderRadius: '50%',
            border: '1.5px dashed var(--accent)',
            background: 'transparent', color: 'var(--accent)',
            fontSize: 15, lineHeight: 1, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}
          aria-label="Insert between destinations"
        >
          +
        </button>
      </div>
    );
  }

  if (view === 'type') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40 }}>
        <div style={pillStyle}>
          <button onClick={() => setView('hotel')} style={muted(false)} aria-label="Hotel">
            <HotelIcon />
          </button>
          <button onClick={() => setView('transport')} style={muted(false)} aria-label="Transport">
            <TransportIcon />
          </button>
          <button onClick={() => setView('memo')} style={muted(false)} aria-label="Memo">
            <MemoIcon />
          </button>
        </div>
      </div>
    );
  }

  if (view === 'hotel') {
    const filters = [
      { idx: bedIdx, set: setBedIdx, steps: BED_STEPS, labels: BED_LABELS, Icon: BedIcon, label: 'Bed type' },
      { idx: distIdx, set: setDistIdx, steps: DIST_STEPS, labels: DIST_LABELS, Icon: PinIcon, label: 'Distance' },
      { idx: priceIdx, set: setPriceIdx, steps: PRICE_STEPS, labels: PRICE_LABELS, Icon: DollarIcon, label: 'Price' },
      { idx: propIdx, set: setPropIdx, steps: PROP_STEPS, labels: PROP_LABELS, Icon: BuildingIcon, label: 'Property' },
      { idx: reviewIdx, set: setReviewIdx, steps: REVIEW_STEPS, labels: REVIEW_LABELS, Icon: StarIcon, label: 'Review' },
    ];
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40 }}>
        <div style={{ ...pillStyle, overflowX: 'auto', maxWidth: '90vw' }}>
          <button onClick={() => setView('type')} style={muted(false)} aria-label="Back">
            <BackIcon />
          </button>
          {filters.map(({ idx, set, steps, labels, Icon, label }) => (
            <button
              key={label}
              onClick={() => set((idx + 1) % steps.length)}
              style={{ ...muted(!!steps[idx]), position: 'relative', flexShrink: 0 }}
              aria-label={label}
            >
              <Icon />
              <Badge label={labels[idx]} />
            </button>
          ))}
          <button
            onClick={() => onInsert(index, 'hotel', {
              bed: BED_STEPS[bedIdx],
              distance: DIST_STEPS[distIdx],
              price: PRICE_STEPS[priceIdx],
              property: PROP_STEPS[propIdx],
              review: REVIEW_STEPS[reviewIdx],
            })}
            style={{ ...iconBtn, color: 'var(--accent)', flexShrink: 0 }}
            aria-label="Search hotels"
          >
            <SearchIcon />
          </button>
        </div>
      </div>
    );
  }

  if (view === 'transport') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40 }}>
        <div style={pillStyle}>
          <button onClick={() => setView('type')} style={muted(false)} aria-label="Back">
            <BackIcon />
          </button>
          <button onClick={() => onInsert(index, 'flight')} style={muted(false)} aria-label="Flight">
            <PlaneIcon />
          </button>
          <button onClick={() => onInsert(index, 'train')} style={muted(false)} aria-label="Train">
            <TrainIcon />
          </button>
          <button onClick={() => onInsert(index, 'bus')} style={muted(false)} aria-label="Bus">
            <BusIcon />
          </button>
        </div>
      </div>
    );
  }

  if (view === 'memo') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40 }}>
        <div style={{ ...pillStyle, gap: 4 }}>
          <button onClick={() => setView('type')} style={muted(false)} aria-label="Back">
            <BackIcon />
          </button>
          <input
            type="url"
            value={memoUrl}
            onChange={(e) => setMemoUrl(e.target.value)}
            placeholder="Paste link..."
            autoFocus
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: 'var(--text)', width: 140,
              padding: '4px 0',
            }}
          />
          <button
            onClick={() => {
              if (memoUrl.trim()) {
                onInsert(index, 'memo', { url: memoUrl.trim() });
                setMemoUrl('');
              }
            }}
            style={{ ...iconBtn, color: memoUrl.trim() ? 'var(--accent)' : 'var(--text-subtle)' }}
            aria-label="Save memo"
          >
            <CheckIcon />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function CloseIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function MemoList({ memos, onRemove }) {
  if (!memos?.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', padding: '4px 0' }}>
      {memos.map((m) => (
        <a
          key={m.id}
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'var(--surface)', borderRadius: 'var(--r-pill)',
            padding: '3px 8px', boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
            maxWidth: 180, overflow: 'hidden',
          }}
        >
          <img
            src={`https://www.google.com/s2/favicons?domain=${domainOf(m.url)}&sz=16`}
            width={14} height={14} alt=""
            style={{ flexShrink: 0 }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {domainOf(m.url)}
          </span>
          {onRemove && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(m.id); }}
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                padding: 0, display: 'flex', alignItems: 'center',
                color: 'var(--text-subtle)', flexShrink: 0,
              }}
              aria-label="Remove memo"
            >
              <CloseIcon />
            </button>
          )}
        </a>
      ))}
    </div>
  );
}
