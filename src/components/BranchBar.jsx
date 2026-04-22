import { useState, useRef } from 'react';
import { EditableName } from './EditableName';
import { BranchMenu } from './BranchMenu';
import { TripMenu } from './TripMenu';
import { ShareIcon } from './ShareIcon';
import { CopyItineraryIcon } from './CopyItineraryIcon';

export function BranchBar({
  tripId,
  tripName,
  branches,
  currentBranchId,
  onSwitch,
  onTripNameChange,
  onBranchNameChange,
  onShare,
  onSelectTrip,
  onNewBranch,
  onDeleteBranch,
  cities,
  startDate,
}) {
  const currentBranch = branches?.find((b) => b.id === currentBranchId);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [tripMenuOpen, setTripMenuOpen] = useState(false);
  const branchAnchorRef = useRef(null);
  const tripAnchorRef = useRef(null);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: 8, borderBottom: '1px solid #eee',
      position: 'relative',
    }}>
      {/* Trip name: tap=trip list, hold=edit */}
      <div ref={tripAnchorRef} data-no-drag style={{ position: 'relative' }}>
        <EditableName
          value={tripName}
          placeholder="Untitled Trip"
          onTap={() => setTripMenuOpen(true)}
          onRename={(name) => onTripNameChange?.(name)}
          title="Tap: switch trip. Hold: rename."
        >
          {(tripName || 'Untitled Trip')} <span style={{ fontSize: 11, color: '#666' }}>▾</span>
        </EditableName>

        <TripMenu
          open={tripMenuOpen}
          currentTripId={tripId}
          onSelect={(tId, bId) => onSelectTrip?.(tId, bId)}
          onClose={() => setTripMenuOpen(false)}
          anchorRef={tripAnchorRef}
        />
      </div>

      <span style={{ fontWeight: 'bold', fontSize: 15, color: '#999', margin: '0 2px', userSelect: 'none' }}>
        /
      </span>

      {/* Branch name: tap=branch menu, hold=edit */}
      <div ref={branchAnchorRef} data-no-drag style={{ position: 'relative' }}>
        <EditableName
          value={currentBranch?.name}
          placeholder="main"
          onTap={() => setBranchMenuOpen(true)}
          onRename={(name) => onBranchNameChange?.(currentBranchId, name)}
          title="Tap: switch/create branch. Hold: rename."
        >
          {(currentBranch?.name || 'main')} <span style={{ fontSize: 11, color: '#666' }}>▾</span>
        </EditableName>

        <BranchMenu
          open={branchMenuOpen}
          branches={branches}
          currentBranchId={currentBranchId}
          onSelect={(id) => onSwitch?.(id)}
          onNewBranch={() => onNewBranch?.()}
          onDeleteBranch={(id) => onDeleteBranch?.(id)}
          onClose={() => setBranchMenuOpen(false)}
          anchorRef={branchAnchorRef}
        />
      </div>

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      <CopyItineraryIcon cities={cities} startDate={startDate} />
      <ShareIcon onClick={() => onShare?.()} />
    </div>
  );
}
