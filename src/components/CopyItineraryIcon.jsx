import { useState } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function ordinal(n) {
  return n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');
}

function fmtDate(d) {
  return `${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}`;
}

function formatItinerary(cities, startDate) {
  if (!cities?.length) return '';

  const start = startDate ? new Date(startDate) : new Date();
  const entries = [];
  let currentDate = new Date(start);

  for (const city of cities) {
    const days = city.days || 1;
    const from = new Date(currentDate);
    const to = new Date(currentDate);
    to.setDate(to.getDate() + days);

    const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
    const toStr = sameMonth ? ordinal(to.getDate()) : fmtDate(to);
    entries.push({
      year: from.getFullYear(),
      dateRange: `${fmtDate(from)} - ${toStr}`,
      country: city.country || '',
      name: city.name || '',
    });

    currentDate.setDate(currentDate.getDate() + days);
  }

  const maxDateLen = Math.max(...entries.map((e) => e.dateRange.length));
  const lines = [];
  let currentYear = null;

  for (const e of entries) {
    if (e.year !== currentYear) {
      currentYear = e.year;
      lines.push(String(e.year));
    }
    lines.push(`  ${e.dateRange.padEnd(maxDateLen)}  ${e.country} ${e.name}`.trimEnd());
  }

  return lines.join('\n');
}

export function CopyItineraryIcon({ cities, startDate }) {
  const [hover, setHover] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const text = formatItinerary(cities, startDate);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px', borderRadius: 4, lineHeight: 1,
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}
      title={copied ? 'Copied!' : 'Copy itinerary'}
    >
      <svg
        width={16} height={16} viewBox="0 0 24 24" fill="none"
        stroke={copied ? '#16a34a' : hover ? '#2563eb' : '#666'}
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      >
        {copied ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
    </button>
  );
}
