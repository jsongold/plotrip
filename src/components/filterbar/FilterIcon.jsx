import { bump } from '../../lib/haptics';

export function FilterIcon({ slug, label, icon, active, onToggle }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={() => { bump(); onToggle(slug); }}
      style={{
        width: 44, height: 44,
        borderRadius: '50%',
        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent)' : 'var(--surface, #fff)',
        color: active ? '#fff' : 'var(--text, #111)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, cursor: 'pointer', flex: '0 0 auto',
        boxShadow: active
          ? '0 4px 12px rgba(37,99,235,0.35)'
          : '0 2px 8px rgba(0,0,0,0.12)',
        transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
        pointerEvents: 'auto',
      }}
    >
      {icon}
    </button>
  );
}
