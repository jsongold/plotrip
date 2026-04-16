import { useState, useRef } from 'react';
import { useFilter } from '../../context/FilterContext';
import { getAllFilters } from '../../lib/filters/registry';
import { FilterIcon } from './FilterIcon';
import { MonthDial } from './MonthDial';
import { SelectionDial } from './SelectionDial';
import { FilterTriIcon } from './icons';
import { bump } from '../../lib/haptics';

/**
 * 右下に 1 つの filter ボタンが常駐し、タップで月チップ + 5 filter が
 * 上方向に staggered アニメーションで展開する。
 * 再タップ or 外クリックで閉じる。
 */
export function FilterBar() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { activeFilters, month, toggle, setMonth, getFilterValue, setFilterValue } = useFilter();
  const filters = getAllFilters();

  // 仕様: 外クリックでは閉じない。filter toggle 再タップのみで閉じる

  // 展開要素: 上から 順=climate→vibes→crowd→cost→events→month (toggle 直上)
  const items = [
    ...filters.map((f) => ({ type: 'filter', key: f.slug, def: f })),
    { type: 'month', key: '_month' },
  ];
  const total = items.length;
  const activeCount = activeFilters.size;

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 'calc(80px + env(safe-area-inset-bottom))',
        zIndex: 1001,
        pointerEvents: 'auto',
      }}
    >
      {/* 展開スタック: 常時 DOM にあり、opacity+transform で表示切替 */}
      <div
        aria-hidden={!open}
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'flex-end',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {items.map((item, i) => {
          // toggle 直上 (配列末尾) から順に立ち上がるよう delay を逆算
          const fromBottomI = total - 1 - i;
          const openDelay = fromBottomI * 35;
          const style = {
            transform: open ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.6)',
            opacity: open ? 1 : 0,
            transition: open
              ? `opacity 220ms cubic-bezier(0.2,0.9,0.3,1.1) ${openDelay}ms, transform 260ms cubic-bezier(0.2,0.9,0.3,1.2) ${openDelay}ms`
              : 'opacity 140ms ease, transform 160ms ease',
          };

          if (item.type === 'month') {
            return (
              <div key={item.key} style={style}>
                <MonthDial month={month} onChange={setMonth} />
              </div>
            );
          }

          const f = item.def;
          if (f.options) {
            return (
              <div key={item.key} style={style}>
                <SelectionDial
                  slug={f.slug}
                  label={f.label}
                  icon={f.icon}
                  options={f.options}
                  active={activeFilters.has(f.slug)}
                  value={getFilterValue(f.slug) ?? null}
                  onToggleOpen={(opn) => {
                    const isOn = activeFilters.has(f.slug);
                    if (opn && !isOn) toggle(f.slug);
                    else if (!opn && isOn) {
                      toggle(f.slug);
                      setFilterValue(f.slug, null);
                    }
                  }}
                  onChangeValue={(v) => setFilterValue(f.slug, v)}
                />
              </div>
            );
          }
          return (
            <div key={item.key} style={style}>
              <FilterIcon
                slug={f.slug}
                label={f.label}
                icon={f.icon}
                active={activeFilters.has(f.slug)}
                onToggle={toggle}
              />
            </div>
          );
        })}
      </div>

      {/* Filter toggle ボタン (常時) */}
      <button
        type="button"
        aria-label="Filters"
        aria-pressed={open}
        title="Filters"
        onClick={() => { bump(); setOpen((v) => !v); }}
        style={{
          width: 44, height: 44,
          borderRadius: 10,
          border: `1px solid ${open ? 'var(--accent)' : 'rgba(0,0,0,0.08)'}`,
          background: '#fff',
          color: open ? 'var(--accent)' : '#000',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          transition: 'all 180ms cubic-bezier(0.2,0.9,0.3,1.1)',
          position: 'relative',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        <FilterTriIcon size={24} />
        {!open && activeCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -4, right: -4,
              minWidth: 20, height: 20, padding: '0 5px',
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            {activeCount}
          </span>
        )}
      </button>
    </div>
  );
}
