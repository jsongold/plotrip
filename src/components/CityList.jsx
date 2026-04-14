import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { CityListItem } from './CityListItem';

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
                  <CityListItem
                    city={c}
                    index={i}
                    cities={cities}
                    startDate={startDate}
                    onRemove={onRemove}
                    onFork={onFork}
                    onDaysChange={onDaysChange}
                    onStartDateChange={onStartDateChange}
                    editingDate={editingDate}
                    setEditingDate={setEditingDate}
                    dragHandleProps={provided.dragHandleProps}
                    draggableProps={provided.draggableProps}
                    innerRef={provided.innerRef}
                    isDragging={snapshot.isDragging}
                  />
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
