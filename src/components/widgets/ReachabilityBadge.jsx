const VISA_META = {
  free: { label: 'Visa-free', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 15%, transparent)' },
  evisa: { label: 'eVisa', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 15%, transparent)' },
  required: { label: 'Visa req.', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 15%, transparent)' },
  unknown: { label: 'Visa ?', color: 'var(--text-muted)', bg: 'var(--surface-2)' },
};

export function ReachabilityBadge({ visa = 'unknown', flightHours = null }) {
  const meta = VISA_META[visa] || VISA_META.unknown;
  const hoursText = flightHours != null && Number.isFinite(flightHours)
    ? `${flightHours < 10 ? flightHours.toFixed(1) : Math.round(flightHours)}h`
    : null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 'var(--r-pill)',
        background: meta.bg,
        color: meta.color,
        fontSize: 'var(--font-xs)',
        fontWeight: 'var(--fw-medium)',
        border: '1px solid var(--border)',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 10, lineHeight: 1 }}>✈</span>
      {hoursText && <span>{hoursText}</span>}
      <span style={{ opacity: 0.8 }}>·</span>
      <span>{meta.label}</span>
    </span>
  );
}
