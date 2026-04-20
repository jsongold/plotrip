import { Modal } from '../Modal';

const OPTIONS = [
  { mode: 'new-trip', label: 'New trip', description: 'Create a brand new trip' },
  { mode: 'new-branch', label: 'New branch', description: 'Add as a new branch in this trip' },
  { mode: 'add-to-branch', label: 'Add to current', description: 'Append destinations to this branch' },
];

export function ConfirmNewTripDialog({ open, onSelect, onCancel }) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => { if (!next) onCancel(); }}
      title="Where to add?"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {OPTIONS.map(opt => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onSelect(opt.mode)}
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--r-lg)',
              border: 'none',
              background: 'var(--bg-elevated)',
              color: 'var(--text)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
            }}
          >
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)' }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
              {opt.description}
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
