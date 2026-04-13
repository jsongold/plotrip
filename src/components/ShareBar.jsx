import { useState } from 'react';

export function ShareBar({ onCopied }) {
  const [showCopied, setShowCopied] = useState(false);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
      if (onCopied) onCopied();
    });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <button
        onClick={handleShare}
        style={{ padding: '7px 12px', border: '1px solid #ccc', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
      >
        Share
      </button>
      {showCopied && (
        <span style={{ fontSize: 12, color: '#16a34a' }}>Copied!</span>
      )}
    </div>
  );
}
