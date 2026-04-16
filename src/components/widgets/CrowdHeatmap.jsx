const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function crowdColor(idx) {
  if (idx == null) return 'var(--border-strong)';
  if (idx < 40) return 'var(--success)';
  if (idx < 70) return 'var(--warning)';
  return 'var(--danger)';
}

export function CrowdHeatmap({ monthly = [], selectedMonth = 1, dotSize = 10 }) {
  const byMonth = new Map();
  (monthly || []).forEach((m) => byMonth.set(m.month, m));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          alignItems: 'center',
          justifyItems: 'center',
          gap: 2,
        }}
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
          const row = byMonth.get(month);
          const color = crowdColor(row?.crowd_index);
          const isSel = month === selectedMonth;
          return (
            <span
              key={month}
              title={row ? `Crowd: ${row.crowd_index}` : ''}
              style={{
                display: 'block',
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: color,
                boxShadow: isSel ? `0 0 0 2px var(--accent)` : 'none',
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          fontSize: 'var(--font-xs)',
          color: 'var(--text-subtle)',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        {MONTHS.map((m, idx) => (
          <span
            key={idx}
            style={{
              color: idx + 1 === selectedMonth ? 'var(--accent)' : 'var(--text-subtle)',
              fontWeight: idx + 1 === selectedMonth ? 'var(--fw-semibold)' : 'var(--fw-regular)',
            }}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
