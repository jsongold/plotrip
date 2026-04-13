import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function ordinal(n) {
  if (n % 100 >= 11 && n % 100 <= 13) return n + 'th';
  switch (n % 10) {
    case 1: return n + 'st';
    case 2: return n + 'nd';
    case 3: return n + 'rd';
    default: return n + 'th';
  }
}

function calcDateObj(cities, index, startDate) {
  if (!startDate) return null;
  const d = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < index; i++) {
    d.setDate(d.getDate() + (cities[i].days || 1));
  }
  return d;
}

function formatDate(d) {
  if (!d) return '';
  return `${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}`;
}

function toIso(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function CityList({ cities, onRemove, onReorder, onFork, onDaysChange, startDate, onStartDateChange }) {
  const [editingDate, setEditingDate] = useState(null);
  if (cities.length === 0) {
    return <p style={{ color: '#999', fontSize: 13, margin: 0 }}>Click a city on the map or search to add stops.</p>;
  }

  function handleDragEnd(result) {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="city-list">
        {(provided) => (
          <ul
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ listStyle: 'none', padding: '0 4px', margin: '8px 0 0' }}
          >
            {cities.map((c, i) => (
              <Draggable
                key={`${c.name}-${i}`}
                draggableId={`${c.name}-${i}`}
                index={i}
                isDragDisabled={!!c.inherited}
              >
                {(provided, snapshot) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: 8, border: '1px solid #eee', borderRadius: 6,
                      marginBottom: 6,
                      background: snapshot.isDragging ? '#e8f0fe' : c.inherited ? '#f0f0ff' : '#fafafa',
                      ...provided.draggableProps.style,
                    }}
                  >
                    {/* Drag handle */}
                    <span
                      {...provided.dragHandleProps}
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

                    {/* Number */}
                    <span style={{ fontWeight: 'bold', color: '#2563eb', minWidth: 24, textAlign: 'center' }}>
                      {i + 1}
                    </span>

                    {/* Name + country */}
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', fontSize: 14, minWidth: 0 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.country || '\u00A0'}</span>
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
                      ) : (
                        <span
                          onClick={() => setEditingDate(i)}
                          style={{
                            fontSize: 11, color: startDate ? '#2563eb' : '#bbb',
                            whiteSpace: 'nowrap', cursor: 'pointer',
                            padding: '2px 4px', borderRadius: 4,
                            minWidth: 50,
                          }}
                        >
                          {startDate ? formatDate(calcDateObj(cities, i, startDate)) : 'set date'}
                        </span>
                      )}
                      {/* Days stepper */}
                      <span style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
                        <button
                          onClick={() => { const v = (c.days || 1) - 1; if (v >= 1) onDaysChange(i, v); }}
                          style={stepBtn}
                        >-</button>
                        <span style={{ width: 24, textAlign: 'center', fontSize: 13, lineHeight: '26px' }}>
                          {c.days || 1}
                        </span>
                        <button
                          onClick={() => { const v = (c.days || 1) + 1; if (v <= 99) onDaysChange(i, v); }}
                          style={stepBtn}
                        >+</button>
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
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
}

const iconBtnStyle = {
  width: 28, height: 28, borderRadius: '50%',
  border: '1px solid #eee', background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0
};

const stepBtn = {
  width: 24, height: 26, border: 'none', background: '#f5f5f5',
  cursor: 'pointer', fontSize: 14, fontWeight: 'bold', color: '#666',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0,
};
