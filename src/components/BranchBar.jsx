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
  onCompare,
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
