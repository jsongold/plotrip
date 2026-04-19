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
        borderRadius: 'var(--r-lg)',
        border: 'none',
        background: 'var(--surface)',
        color: active ? 'var(--active-text)' : 'var(--text)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flex: '0 0 auto',
        padding: 0,
        pointerEvents: 'auto',
        boxShadow: 'var(--shadow-md)',
        transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
      }}
    >
      <FilterSlugIcon slug={slug} size={24} />
    </button>
  );
}
