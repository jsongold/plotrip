import { useState, useEffect } from 'react';

const BUDGET_STEPS = [null, 1, 2, 3, 4];
const BUDGET_LABELS = ['', '$', '$$', '$$$', '$$$$'];
const RATING_STEPS = [null, 80, 90];
const RATING_LABELS = ['', '8+', '9+'];

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

function WalletIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 12h.01" />
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
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [ratingIdx, setRatingIdx] = useState(0);
  const [memoUrl, setMemoUrl] = useState('');

  useEffect(() => {
    if (!open) {
      setView('type');
      setBudgetIdx(0);
      setRatingIdx(0);
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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 40 }}>
        <div style={pillStyle}>
          <button onClick={() => setView('type')} style={muted(false)} aria-label="Back">
            <BackIcon />
          </button>
          <button
            onClick={() => setBudgetIdx((budgetIdx + 1) % BUDGET_STEPS.length)}
            style={{ ...muted(!!BUDGET_STEPS[budgetIdx]), position: 'relative' }}
            aria-label="Budget filter"
          >
            <WalletIcon />
            <Badge label={BUDGET_LABELS[budgetIdx]} />
          </button>
          <button
            onClick={() => setRatingIdx((ratingIdx + 1) % RATING_STEPS.length)}
            style={{ ...muted(!!RATING_STEPS[ratingIdx]), position: 'relative' }}
            aria-label="Rating filter"
          >
            <StarIcon />
            <Badge label={RATING_LABELS[ratingIdx]} />
          </button>
          <button
            onClick={() => onInsert(index, 'hotel', {
              budget: BUDGET_STEPS[budgetIdx],
              rating: RATING_STEPS[ratingIdx],
            })}
            style={{ ...iconBtn, color: 'var(--accent)' }}
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
