import { useState, useEffect, useRef } from 'react';

const nameStyle = {
  fontWeight: 'bold',
  fontSize: 15,
  color: '#111',
  padding: '4px 6px',
  borderRadius: 4,
  cursor: 'pointer',
  userSelect: 'none',
};

const inputStyle = {
  border: '1px solid #2563eb',
  outline: 'none',
  background: '#fff',
  fontWeight: 'bold',
  fontSize: 15,
  color: '#111',
  padding: '3px 5px',
  borderRadius: 4,
  minWidth: 40,
};

const LONG_PRESS_MS = 500;

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

  const [editingTrip, setEditingTrip] = useState(false);
  const [editingBranch, setEditingBranch] = useState(false);
  const [tripDraft, setTripDraft] = useState(tripName || '');
  const [branchDraft, setBranchDraft] = useState(currentBranch?.name || '');
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [shareHover, setShareHover] = useState(false);

  const menuRef = useRef(null);
  const tripTimerRef = useRef(null);
  const branchTimerRef = useRef(null);
  const tripLongPressedRef = useRef(false);
  const branchLongPressedRef = useRef(false);

  useEffect(() => { setTripDraft(tripName || ''); }, [tripName]);
  useEffect(() => { setBranchDraft(currentBranch?.name || ''); }, [currentBranch?.name]);

  useEffect(() => {
    if (!branchMenuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setBranchMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [branchMenuOpen]);

  // --- Trip name handlers ---
  function handleTripPointerDown() {
    tripLongPressedRef.current = false;
    tripTimerRef.current = setTimeout(() => {
      tripLongPressedRef.current = true;
      setEditingTrip(true);
      setTripDraft(tripName || '');
    }, LONG_PRESS_MS);
  }
  function handleTripPointerUp() {
    clearTimeout(tripTimerRef.current);
    if (!tripLongPressedRef.current && !editingTrip) {
      onNewTrip?.();
    }
  }
  function handleTripPointerCancel() {
    clearTimeout(tripTimerRef.current);
  }
  function commitTripName() {
    setEditingTrip(false);
    const trimmed = tripDraft.trim();
    if (trimmed && trimmed !== tripName) {
      onTripNameChange?.(trimmed);
    } else {
      setTripDraft(tripName || '');
    }
  }

  // --- Branch name handlers ---
  function handleBranchPointerDown() {
    branchLongPressedRef.current = false;
    branchTimerRef.current = setTimeout(() => {
      branchLongPressedRef.current = true;
      setEditingBranch(true);
      setBranchDraft(currentBranch?.name || '');
    }, LONG_PRESS_MS);
  }
  function handleBranchPointerUp() {
    clearTimeout(branchTimerRef.current);
    if (!branchLongPressedRef.current && !editingBranch) {
      setBranchMenuOpen(true);
    }
  }
  function handleBranchPointerCancel() {
    clearTimeout(branchTimerRef.current);
  }
  function commitBranchName() {
    setEditingBranch(false);
    const trimmed = branchDraft.trim();
    if (trimmed && trimmed !== currentBranch?.name) {
      onBranchNameChange?.(currentBranchId, trimmed);
    } else {
      setBranchDraft(currentBranch?.name || '');
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: 8, borderBottom: '1px solid #eee',
      position: 'relative',
    }}>
      {/* Trip name: tap=new trip, hold=edit */}
      {editingTrip ? (
        <input
          autoFocus
          value={tripDraft}
          onBlur={commitTripName}
          onChange={(e) => setTripDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
          style={inputStyle}
          size={Math.max(tripDraft.length, 1)}
        />
      ) : (
        <span
          onPointerDown={handleTripPointerDown}
          onPointerUp={handleTripPointerUp}
          onPointerLeave={handleTripPointerCancel}
          onPointerCancel={handleTripPointerCancel}
          style={nameStyle}
          title="Tap: new trip. Hold: rename."
        >
          {tripName || 'Untitled Trip'}
        </span>
      )}

      <span style={{ fontWeight: 'bold', fontSize: 15, color: '#999', margin: '0 2px', userSelect: 'none' }}>
        /
      </span>

      {/* Branch name: tap=branch menu, hold=edit */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        {editingBranch ? (
          <input
            autoFocus
            value={branchDraft}
            onBlur={commitBranchName}
            onChange={(e) => setBranchDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            style={inputStyle}
            size={Math.max(branchDraft.length, 1)}
          />
        ) : (
          <span
            onPointerDown={handleBranchPointerDown}
            onPointerUp={handleBranchPointerUp}
            onPointerLeave={handleBranchPointerCancel}
            onPointerCancel={handleBranchPointerCancel}
            style={nameStyle}
            title="Tap: switch/create branch. Hold: rename."
          >
            {currentBranch?.name || 'main'} <span style={{ fontSize: 11, color: '#666' }}>▾</span>
          </span>
        )}

        {branchMenuOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0,
            background: '#fff', border: '1px solid #ddd',
            borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 100, minWidth: 160, marginTop: 4,
          }}>
            {branches?.map((b) => (
              <div
                key={b.id}
                onClick={() => {
                  setBranchMenuOpen(false);
                  if (b.id !== currentBranchId) onSwitch(b.id);
                }}
                style={{
                  padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                  background: b.id === currentBranchId ? '#f0f4ff' : '#fff',
                  color: b.id === currentBranchId ? '#2563eb' : '#333',
                  fontWeight: b.id === currentBranchId ? 600 : 400,
                }}
              >
                {b.name}
              </div>
            ))}
            <div
              onClick={() => {
                setBranchMenuOpen(false);
                onNewBranch?.();
              }}
              style={{
                padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                borderTop: '1px solid #eee',
                color: '#2563eb', fontWeight: 500,
              }}
            >
              + New branch
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Share button (far right) */}
      <button
        onClick={() => onShare?.()}
        onMouseEnter={() => setShareHover(true)}
        onMouseLeave={() => setShareHover(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px', borderRadius: 4, lineHeight: 1,
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}
        title="Share"
      >
        <svg
          width={16} height={16} viewBox="0 0 24 24" fill="none"
          stroke={shareHover ? '#2563eb' : '#666'}
          strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>
    </div>
  );
}
