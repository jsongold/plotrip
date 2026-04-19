import { calcDateObj, formatDate, toIso, formatDayOfWeek, isWeekend, isHoliday } from '../lib/date-utils';

export function CityListItem({
  city: c,
  index: i,
  cities,
  startDate,
  onRemove,
  onFork,
  onDaysChange,
  onStartDateChange,
  onCityTap,
  editingDate,
  setEditingDate,
  dragHandleProps,
  draggableProps,
  innerRef,
  isDragging,
}) {
  return (
    <li
      ref={innerRef}
      {...draggableProps}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: 8, border: 'none', borderRadius: 6,
        marginBottom: 6,
        background: isDragging ? '#e8f0fe' : c.inherited ? '#f0f0ff' : '#fafafa',
        ...draggableProps.style,
      }}
    >
      {/* Drag handle */}
      <span
        {...dragHandleProps}
        style={{
          cursor: c.inherited ? 'default' : 'grab',
          fontSize: 18,
          color: c.inherited ? '#ccc' : '#999',
          lineHeight: 1,
          userSelect: 'none',
          padding: '0 2px',
        }}
        title={c.inherited ? '' : 'Drag to reorder'}
      >
        ≡
      </span>

      {/* Name + country (tap to focus map) */}
      <span
        onClick={onCityTap ? () => onCityTap(c) : undefined}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          fontSize: 14, minWidth: 0,
          cursor: onCityTap ? 'pointer' : 'default',
        }}
      >
        <span style={{ color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
        <span style={{ fontSize: 11, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.country || '\u00A0'}</span>
      </span>

      {/* Date + days */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {editingDate === i ? (
          <input
            type="date"
            autoFocus
            defaultValue={toIso(calcDateObj(cities, i, startDate))}
            onBlur={(e) => {
              setEditingDate(null);
              if (!e.target.value) return;
              const newDate = new Date(e.target.value + 'T00:00:00');
              if (i === 0) {
                onStartDateChange?.(e.target.value);
              } else {
                const prevDate = calcDateObj(cities, i - 1, startDate);
                if (prevDate) {
                  const diff = Math.round((newDate - prevDate) / 86400000);
                  if (diff >= 1) onDaysChange(i - 1, diff);
                }
              }
            }}
            onChange={(e) => {
              if (!e.target.value) return;
              const newDate = new Date(e.target.value + 'T00:00:00');
              if (i === 0) {
                onStartDateChange?.(e.target.value);
              } else {
                const prevDate = calcDateObj(cities, i - 1, startDate);
                if (prevDate) {
                  const diff = Math.round((newDate - prevDate) / 86400000);
                  if (diff >= 1) onDaysChange(i - 1, diff);
                }
              }
              setEditingDate(null);
            }}
            style={{
              width: 115, height: 26,
              fontSize: 12, border: '1px solid #2563eb', borderRadius: 4,
              padding: '0 4px', color: '#333',
            }}
          />
        ) : (() => {
          const dObj = startDate ? calcDateObj(cities, i, startDate) : null;
          const redDay = dObj && (isWeekend(dObj) || isHoliday(dObj, c.country));
          return (
            <span
              onClick={() => setEditingDate(i)}
              style={{
                fontSize: 11,
                color: !startDate ? '#bbb' : '#888',
                whiteSpace: 'nowrap', cursor: 'pointer',
                padding: '2px 4px', borderRadius: 4,
                minWidth: 50,
              }}
            >
              {dObj ? (
                <>
                  {formatDate(dObj)}{' '}
                  <span style={{ color: redDay ? '#dc2626' : '#888' }}>
                    {formatDayOfWeek(dObj)}
                  </span>
                </>
              ) : 'set date'}
            </span>
          );
        })()}
        {/* Days picker */}
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <select
            value={c.days ?? 1}
            onChange={(e) => onDaysChange(i, parseInt(e.target.value, 10))}
            style={{
              position: 'absolute', inset: 0, opacity: 0,
              width: '100%', height: '100%', cursor: 'pointer',
              fontSize: 16,
            }}
          >
            <option value={0}>0</option>
            {Array.from({ length: 30 }, (_, n) => n + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span style={{
            minWidth: 28, height: 26, textAlign: 'center',
            fontSize: 15, fontWeight: 600, lineHeight: '26px',
            border: 'none', borderRadius: 4,
            padding: '0 6px', background: 'transparent', color: '#333',
            pointerEvents: 'none',
          }}>
            {c.days ?? 1}
          </span>
        </span>
      </span>

      {/* Action buttons */}
      <span style={{ display: 'flex', gap: 4 }}>
        {onFork && (
          <button
            onClick={() => onFork(i)}
            style={iconBtnStyle}
            title="Fork from here"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onRemove(i)}
          disabled={c.inherited}
          style={c.inherited ? { ...iconBtnStyle, color: '#dc2626', opacity: 0.3, cursor: 'default' } : { ...iconBtnStyle, color: '#dc2626' }}
          title="Remove"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </span>
    </li>
  );
}

const iconBtnStyle = {
  width: 28, height: 28, borderRadius: '50%',
  border: 'none', background: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0
};
