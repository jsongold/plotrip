import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function calcDate(cities, index, startDate) {
  if (!startDate) return '';
  const d = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < index; i++) {
    d.setDate(d.getDate() + (cities[i].days || 1));
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CityList({ cities, onRemove, onReorder, onFork, onDaysChange, startDate }) {
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
                    <span style={{ flex: 1, display: 'flex', flexDirection: 'column', fontSize: 14 }}>
                      <span>{c.name}</span>
                      {c.country && (
                        <span style={{ fontSize: 11, color: '#888' }}>{c.country}</span>
                      )}
                    </span>

                    {/* Date + days */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>
                        {calcDate(cities, i, startDate) ? calcDate(cities, i, startDate).replace(/^\d{4}-/, '') : ''}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={c.days || 1}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (v >= 1 && v <= 99) onDaysChange(i, v);
                        }}
                        style={{
                          width: 36, height: 26,
                          textAlign: 'center', fontSize: 13,
                          border: '1px solid #ddd', borderRadius: 4,
                          padding: 0,
                        }}
                      />
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
