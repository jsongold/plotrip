import { useMemo } from 'react';

const norm = (s) => (s || '').trim().toLowerCase();

export function BranchDiff({ branchACities = [], branchBCities = [], onScrollTo }) {
  const { onlyA, both, onlyB } = useMemo(() => {
    const aNames = new Map();
    const bNames = new Map();
    branchACities.forEach((c) => {
      const k = norm(c?.name);
      if (k && !aNames.has(k)) aNames.set(k, c);
    });
    branchBCities.forEach((c) => {
      const k = norm(c?.name);
      if (k && !bNames.has(k)) bNames.set(k, c);
    });
    const onlyA = [];
    const both = [];
    const onlyB = [];
    aNames.forEach((v, k) => {
      if (bNames.has(k)) both.push(v);
      else onlyA.push(v);
    });
    bNames.forEach((v, k) => {
      if (!aNames.has(k)) onlyB.push(v);
    });
    return { onlyA, both, onlyB };
  }, [branchACities, branchBCities]);

  const colStyle = (tint) => ({
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--s-1)',
    padding: 'var(--s-2)',
    borderRadius: 'var(--r-md)',
    background: tint,
    border: '1px solid var(--border)',
  });

  const renderName = (c, side) => {
    const label = c?.name || '?';
    return (
      <button
        key={`${side}-${label}`}
        type="button"
        onClick={() => onScrollTo?.(side, c)}
        style={{
          all: 'unset',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: 'var(--r-sm)',
          fontSize: 'var(--font-xs)',
          color: 'var(--text)',
        }}
        title={`Scroll to ${label}`}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background:
              side === 'a' ? 'var(--success)' : side === 'b' ? 'var(--accent)' : 'var(--text-subtle)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <aside
      style={{
        width: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-2)',
        padding: 'var(--s-2)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
      }}
      aria-label="Branch difference summary"
    >
      <header
        style={{
          fontSize: 'var(--font-xs)',
          fontWeight: 'var(--fw-semibold)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Diff
      </header>

      <section style={colStyle('color-mix(in srgb, var(--success) 12%, transparent)')}>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>
          Only in A ({onlyA.length})
        </div>
        {onlyA.length === 0 ? (
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-subtle)' }}>–</span>
        ) : (
          onlyA.map((c) => renderName(c, 'a'))
        )}
      </section>

      <section style={colStyle('var(--surface-2)')}>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>
          In both ({both.length})
        </div>
        {both.length === 0 ? (
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-subtle)' }}>–</span>
        ) : (
          both.map((c) => renderName(c, 'both'))
        )}
      </section>

      <section style={colStyle('color-mix(in srgb, var(--accent) 12%, transparent)')}>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>
          Only in B ({onlyB.length})
        </div>
        {onlyB.length === 0 ? (
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-subtle)' }}>–</span>
        ) : (
          onlyB.map((c) => renderName(c, 'b'))
        )}
      </section>
    </aside>
  );
}
