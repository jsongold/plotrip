import { useState } from 'react';

const inputStyle = {
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontWeight: 'bold',
  fontSize: 15,
  color: '#111',
  padding: '2px 4px',
  borderRadius: 4,
  minWidth: 40,
};

const inputHoverStyle = {
  background: '#f3f4f6',
};

export function BranchBar({
  tripName,
  branches,
  currentBranchId,
  onSwitch,
  onTripNameChange,
  onBranchNameChange,
  onShare,
}) {
  const currentBranch = branches?.find((b) => b.id === currentBranchId);
  const [editingTrip, setEditingTrip] = useState(false);
  const [editingBranch, setEditingBranch] = useState(false);
  const [tripDraft, setTripDraft] = useState(tripName || '');
  const [branchDraft, setBranchDraft] = useState(currentBranch?.name || '');
  const [tripHover, setTripHover] = useState(false);
  const [branchHover, setBranchHover] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shareHover, setShareHover] = useState(false);

  const commitTripName = () => {
    setEditingTrip(false);
    const trimmed = tripDraft.trim();
    if (trimmed && trimmed !== tripName) {
      onTripNameChange?.(trimmed);
    } else {
      setTripDraft(tripName || '');
    }
  };

  const commitBranchName = () => {
    setEditingBranch(false);
    const trimmed = branchDraft.trim();
    if (trimmed && trimmed !== currentBranch?.name) {
      onBranchNameChange?.(currentBranchId, trimmed);
    } else {
      setBranchDraft(currentBranch?.name || '');
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: 8, borderBottom: '1px solid #eee',
      position: 'relative',
    }}>
      {/* Trip name */}
      <input
        value={editingTrip ? tripDraft : (tripName || 'Untitled Trip')}
        onFocus={() => {
          setEditingTrip(true);
          setTripDraft(tripName || '');
        }}
        onBlur={commitTripName}
        onChange={(e) => setTripDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.target.blur();
        }}
        onMouseEnter={() => setTripHover(true)}
        onMouseLeave={() => setTripHover(false)}
        style={{
          ...inputStyle,
          ...(tripHover || editingTrip ? inputHoverStyle : {}),
        }}
        size={Math.max((editingTrip ? tripDraft : (tripName || 'Untitled Trip')).length, 1)}
      />

      <span style={{ fontWeight: 'bold', fontSize: 15, color: '#999', margin: '0 2px', userSelect: 'none' }}>
        /
      </span>

      {/* Branch name */}
      <input
        value={editingBranch ? branchDraft : (currentBranch?.name || 'main')}
        onFocus={() => {
          setEditingBranch(true);
          setBranchDraft(currentBranch?.name || '');
        }}
        onBlur={commitBranchName}
        onChange={(e) => setBranchDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.target.blur();
        }}
        onMouseEnter={() => setBranchHover(true)}
        onMouseLeave={() => setBranchHover(false)}
        style={{
          ...inputStyle,
          ...(branchHover || editingBranch ? inputHoverStyle : {}),
        }}
        size={Math.max((editingBranch ? branchDraft : (currentBranch?.name || 'main')).length, 1)}
      />

      {/* Share button */}
      <button
        onClick={() => onShare?.()}
        onMouseEnter={() => setShareHover(true)}
        onMouseLeave={() => setShareHover(false)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: 4,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          marginLeft: 2,
        }}
        title="Share"
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke={shareHover ? '#2563eb' : '#666'}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      {/* Branch switcher dropdown */}
      {branches && branches.length > 1 && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px 4px', fontSize: 12, color: '#666',
              borderRadius: 4, lineHeight: 1,
            }}
            title="Switch branch"
          >
            ▾
          </button>
          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0,
              background: '#fff', border: '1px solid #ddd',
              borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              zIndex: 100, minWidth: 140, marginTop: 2,
            }}>
              {branches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setDropdownOpen(false);
                    if (b.id !== currentBranchId) {
                      onSwitch(b.id);
                      setBranchDraft(b.name);
                    }
                  }}
                  style={{
                    padding: '6px 12px', fontSize: 13, cursor: 'pointer',
                    background: b.id === currentBranchId ? '#f0f4ff' : '#fff',
                    color: b.id === currentBranchId ? '#2563eb' : '#333',
                    fontWeight: b.id === currentBranchId ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = b.id === currentBranchId ? '#f0f4ff' : '#fff';
                  }}
                >
                  {b.name}{b.parent_branch_id ? ' (fork)' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
