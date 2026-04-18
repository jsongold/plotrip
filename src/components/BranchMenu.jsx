import { useEffect, useRef, useState } from 'react';
import { Modal, Button } from './Modal';

export function BranchMenu({ open, branches, currentBranchId, onSelect, onNewBranch, onDeleteBranch, onClose, anchorRef }) {
  const fallbackRef = useRef(null);
  const containerRef = anchorRef || fallbackRef;
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open, onClose, containerRef]);

  if (!open && !deleteTarget) return null;

  return (
    <>
      {open && (
        <div
          ref={anchorRef ? undefined : fallbackRef}
          style={{
            position: 'absolute', top: '100%', left: 0,
            background: '#fff', border: '1px solid #ddd',
            borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 100, minWidth: 160, marginTop: 4,
          }}
        >
          {branches?.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                background: b.id === currentBranchId ? '#f0f4ff' : '#fff',
                color: b.id === currentBranchId ? '#2563eb' : '#333',
                fontWeight: b.id === currentBranchId ? 600 : 400,
              }}
            >
              <span
                style={{ flex: 1 }}
                onClick={() => {
                  onClose?.();
                  if (b.id !== currentBranchId) onSelect?.(b.id);
                }}
              >
                {b.name}
              </span>
              {branches.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(b);
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#dc2626', padding: '0 2px',
                    fontSize: 14, lineHeight: 1,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <div
            onClick={() => {
              onClose?.();
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

      <Modal
        open={!!deleteTarget}
        onOpenChange={(next) => { if (!next) setDeleteTarget(null); }}
        title={`Delete "${deleteTarget?.name}"?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={() => {
              const id = deleteTarget.id;
              setDeleteTarget(null);
              onClose?.();
              onDeleteBranch?.(id);
            }}>Delete</Button>
          </>
        }
      >
        <p style={{
          margin: 0,
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          This branch and all its destinations will be permanently deleted.
        </p>
      </Modal>
    </>
  );
}
