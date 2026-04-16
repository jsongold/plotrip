import { useFilter } from '../../context/FilterContext';
import { getAllFilters } from '../../lib/filters/registry';
import { FilterIcon } from './FilterIcon';
import { MonthDial } from './MonthDial';
import { SelectionDial } from './SelectionDial';

export function FilterBar() {
  const { activeFilters, month, toggle, setMonth, getFilterValue, setFilterValue } = useFilter();
  const filters = getAllFilters();

  return (
    <div
      style={{
        position: 'fixed',
        left: 0, right: 0,
        bottom: 'calc(130px + env(safe-area-inset-bottom))',
        zIndex: 900,
        display: 'flex',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          // overflow は visible にする: overflowX:auto だと overflow-y も auto になり
          // MonthDial の上方向 popup がクリップされるため。8個超えたら無限カルーセル化で対応
          overflow: 'visible',
        }}
      >
        <MonthDial month={month} onChange={setMonth} />
        {filters.length === 0 ? (
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted, #888)',
            padding: '0 8px',
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 12,
            pointerEvents: 'auto',
          }}>
            (no filters registered yet)
          </span>
        ) : (
          filters.map((f) => f.options ? (
            <SelectionDial
              key={f.slug}
              slug={f.slug}
              label={f.label}
              icon={f.icon}
              options={f.options}
              active={activeFilters.has(f.slug)}
              value={getFilterValue(f.slug) ?? null}
              onToggleOpen={(open) => {
                const isOn = activeFilters.has(f.slug);
                if (open && !isOn) toggle(f.slug);
                else if (!open && isOn) {
                  toggle(f.slug);
                  setFilterValue(f.slug, null);
                }
              }}
              onChangeValue={(v) => setFilterValue(f.slug, v)}
            />
          ) : (
            <FilterIcon
              key={f.slug}
              slug={f.slug}
              label={f.label}
              icon={f.icon}
              active={activeFilters.has(f.slug)}
              onToggle={toggle}
            />
          ))
        )}
      </div>
    </div>
  );
}
