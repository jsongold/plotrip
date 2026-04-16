const AXES = [
  { key: 'safety', label: 'Safety' },
  { key: 'affordability', label: 'Cost' },
  { key: 'language', label: 'Language' },
  { key: 'photogenic', label: 'Photo' },
  { key: 'nightlife', label: 'Night' },
  { key: 'outdoors', label: 'Outdoor' },
  { key: 'culture', label: 'Culture' },
  { key: 'food', label: 'Food' },
];

export function RadarChart({ scores = {}, max = 100, size = 200, compact = false, stroke = 'var(--accent)' }) {
  const cx = size / 2;
  const cy = size / 2;
  const pad = compact ? 10 : 40;
  const radius = size / 2 - pad;
  const n = AXES.length;

  const points = AXES.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const v = Math.max(0, Math.min(max, Number(scores?.[axis.key] ?? 0)));
    const r = (v / max) * radius;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      ax: cx + Math.cos(angle) * radius,
      ay: cy + Math.sin(angle) * radius,
      angle,
      label: axis.label,
    };
  });

  const poly = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // rings at 25/50/75/100%
  const rings = [0.25, 0.5, 0.75, 1].map((f) => f * radius);

  return (
    <svg width={size} height={size} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      {rings.map((r, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.6}
        />
      ))}
      {points.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.ax}
          y2={p.ay}
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.6}
        />
      ))}
      <polygon points={poly} fill={stroke} fillOpacity={0.2} stroke={stroke} strokeWidth={1.5} />
      {!compact &&
        points.map((p, i) => {
          const lx = cx + Math.cos(p.angle) * (radius + 14);
          const ly = cy + Math.sin(p.angle) * (radius + 14);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="var(--text-muted)"
              style={{ userSelect: 'none' }}
            >
              {p.label}
            </text>
          );
        })}
    </svg>
  );
}
