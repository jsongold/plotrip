import { Modal, Button } from './Modal';

function scoreColor(score) {
  if (score >= 0.75) return 'var(--match-high)';
  if (score >= 0.5)  return 'var(--match-mid)';
  return 'var(--match-low)';
}

export function PinPreview({ city, onAdd, onClose }) {
  const open = !!city;
  const score = city?.match_score ?? 0;
  const scorePct = Math.round(score * 100);
  const reasons = Array.isArray(city?.reason_chips) ? city.reason_chips.slice(0, 2) : [];

  return (
    <Modal
      open={open}
      onOpenChange={(next) => { if (!next) onClose?.(); }}
      title={null}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={() => { onAdd?.(city); }}>+ Add to branch</Button>
        </>
      }
    >
      {city && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                flex: '0 0 72px',
                background: city.cover_photo_url
                  ? `center/cover no-repeat url(${city.cover_photo_url}), var(--surface-2)`
                  : 'linear-gradient(135deg, var(--accent-weak), var(--surface-2))',
                border: '1px solid var(--border)',
              }}
              aria-hidden="true"
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {city.name}
              </div>
              <div style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--text-muted)',
                marginTop: 2,
              }}>
                {city.country}
              </div>
              <div style={{ marginTop: 'var(--s-2)' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--s-1)',
                  padding: '2px 10px',
                  borderRadius: 'var(--r-pill)',
                  background: scoreColor(score),
                  color: '#fff',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 'var(--fw-semibold)',
                }}>
                  {scorePct}% match
                </span>
              </div>
            </div>
          </div>

          {reasons.length > 0 && (
            <div style={{ display: 'flex', gap: 'var(--s-1)', flexWrap: 'wrap' }}>
              {reasons.map((r, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 'var(--font-xs)',
                    padding: '4px 10px',
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--accent-weak)',
                    color: 'var(--accent)',
                    fontWeight: 'var(--fw-medium)',
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
