import { useState, useRef } from 'react';
import { EditableName } from './EditableName';
import { BranchMenu } from './BranchMenu';
import { TripMenu } from './TripMenu';
import { ShareIcon } from './ShareIcon';

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
  onCompare,
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

      {/* Compare branches (visible only when ≥ 2 branches exist) */}
      {branches && branches.length >= 2 && onCompare && (
        <button
          type="button"
          onClick={() => onCompare()}
          title="Compare branches"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 6,
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16H3l4-4" />
            <path d="M3 16l4 4" />
            <path d="M17 8h4l-4-4" />
            <path d="M21 8l-4 4" />
          </svg>
        </button>
      )}

      {/* Share button (far right) */}
      <ShareIcon onClick={() => onShare?.()} />
    </div>
  );
}
