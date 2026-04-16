import { bump } from '../../lib/haptics';
import { FilterSlugIcon } from './icons';

export function FilterIcon({ slug, label, active, onToggle }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={() => { bump(); onToggle(slug); }}
      style={{
        width: 44, height: 44,
        borderRadius: 10,
        border: `1px solid ${active ? 'var(--accent)' : 'rgba(0,0,0,0.08)'}`,
        background: '#fff',
        color: active ? 'var(--accent)' : '#000',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flex: '0 0 auto',
        padding: 0,
        pointerEvents: 'auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
      }}
    >
      <FilterSlugIcon slug={slug} size={24} />
    </button>
  );
}
