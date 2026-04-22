import { useState, useRef, useEffect } from 'react';
import { useFilter } from '../../context/FilterContext';
import { getAllFilters } from '../../lib/filters/registry';
import { FilterIcon } from './FilterIcon';
import { MonthDial } from './MonthDial';
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

  // 仕様: 外クリックでは閉じない。filter toggle 再タップ or CityPinPopup open で閉じる
  useEffect(() => {
    function onClose() { setOpen(false); }
    window.addEventListener('plotrip:closefilters', onClose);
    return () => window.removeEventListener('plotrip:closefilters', onClose);
  }, []);

  // 展開要素: 上から 順=climate→vibes→crowd→cost→events→month (toggle 直上)
  const items = [
    ...filters.filter((f) => f.slug === 'climate').map((f) => ({ type: 'filter', key: f.slug, def: f })),
    { type: 'month', key: '_month' },
  ];
  const total = items.length;
  const activeCount = activeFilters.size;

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative', pointerEvents: 'auto' }}
    >
      {/* 展開スタック: 上方向 (toggle の上) に展開 */}
      <div
        aria-hidden={!open}
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'flex-start',
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
        className="map-icon-btn"
        aria-label="Filters"
        aria-pressed={open}
        title="Filters"
        onClick={() => { bump(); setOpen((v) => !v); }}
        style={{
          position: 'relative',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 180ms cubic-bezier(0.2,0.9,0.3,1.1)',
        }}
      >
        <svg width={32} height={32} viewBox="0 0 24 24" aria-hidden="true">
          <line x1="4" y1="6" x2="20" y2="6" stroke="#999" strokeWidth={1.5} strokeLinecap="round" />
          <circle cx="9" cy="6" r="2.3" fill="white" stroke="#999" strokeWidth={1.5} />
          <line x1="4" y1="12" x2="20" y2="12" stroke="#999" strokeWidth={1.5} strokeLinecap="round" />
          <circle cx="15" cy="12" r="2.3" fill="white" stroke="#999" strokeWidth={1.5} />
          <line x1="4" y1="18" x2="20" y2="18" stroke="#999" strokeWidth={1.5} strokeLinecap="round" />
          <circle cx="7" cy="18" r="2.3" fill="white" stroke="#999" strokeWidth={1.5} />
        </svg>
        {!open && activeCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -4, right: -4,
              minWidth: 20, height: 20, padding: '0 5px',
              borderRadius: 10,
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none',
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
