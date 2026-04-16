const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function ClimateStrip({ monthly = [], selectedMonth = 1, height = 40, maxTemp = 40, minTemp = 0 }) {
  // Index monthly data by month
  const byMonth = new Map();
  (monthly || []).forEach((m) => byMonth.set(m.month, m));
  const selected = byMonth.get(selectedMonth);

  const range = maxTemp - minTemp || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          alignItems: 'end',
          gap: 2,
          height,
        }}
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
          const row = byMonth.get(month);
          const t = row?.avg_high_c;
          const norm = t == null ? 0 : Math.max(0, Math.min(1, (t - minTemp) / range));
          const h = norm * (height - 2);
          const isSel = month === selectedMonth;
          return (
            <div
              key={month}
              style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}
              title={row ? `${row.season_label || ''} ${Math.round(t)}°C` : ''}
            >
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  height: Math.max(2, h),
                  borderRadius: 'var(--r-sm)',
                  background: isSel ? 'var(--accent)' : 'var(--border-strong)',
                  opacity: t == null ? 0.3 : 1,
                  transition: 'background var(--dur-fast) var(--ease-out)',
                }}
              />
            </div>
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
      {selected?.avg_high_c != null && (
        <div
          style={{
            fontSize: 'var(--font-xs)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--accent)',
          }}
        >
          {Math.round(selected.avg_high_c)}°C
        </div>
      )}
    </div>
  );
}
