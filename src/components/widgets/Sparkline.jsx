export function Sparkline({ values = [], color = 'var(--accent)', height = 32, width = 120, strokeWidth = 1.5 }) {
  const pts = values.filter((v) => v != null && Number.isFinite(v));
  if (pts.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden="true" style={{ display: 'block' }} />
    );
  }
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const stepX = width / (pts.length - 1);
  const path = pts
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - strokeWidth * 2) - strokeWidth;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} aria-hidden="true" style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
