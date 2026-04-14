import { useState, useRef } from 'react';
import { EditableName } from './EditableName';
import { BranchMenu } from './BranchMenu';
import { ShareIcon } from './ShareIcon';

export function BranchBar({
  tripName,
  branches,
  currentBranchId,
  onSwitch,
  onTripNameChange,
  onBranchNameChange,
  onShare,
  onNewTrip,
  onNewBranch,
}) {
  const currentBranch = branches?.find((b) => b.id === currentBranchId);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const branchAnchorRef = useRef(null);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: 8, borderBottom: '1px solid #eee',
      position: 'relative',
    }}>
      {/* Trip name: tap=new trip, hold=edit */}
      <EditableName
        value={tripName}
        placeholder="Untitled Trip"
        onTap={() => onNewTrip?.()}
        onRename={(name) => onTripNameChange?.(name)}
        title="Tap: new trip. Hold: rename."
      />

      <span style={{ fontWeight: 'bold', fontSize: 15, color: '#999', margin: '0 2px', userSelect: 'none' }}>
        /
      </span>

      {/* Branch name: tap=branch menu, hold=edit */}
      <div ref={branchAnchorRef} style={{ position: 'relative' }}>
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
          onClose={() => setBranchMenuOpen(false)}
          anchorRef={branchAnchorRef}
        />
      </div>

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Share button (far right) */}
      <ShareIcon onClick={() => onShare?.()} />
    </div>
  );
}
