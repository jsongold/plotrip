import { useState, useEffect } from 'react';
import { Modal, Button } from '../Modal';
import { getMoods } from '../../lib/discover';
import { CriteriaForm } from './CriteriaForm';
import { ConfirmNewTripDialog } from './ConfirmNewTripDialog';

export function ItinerarySuggestionSheet({ open, onOpenChange, onGenerate, generating, error }) {
  const [view, setView] = useState('mood');
  const [moods, setMoods] = useState([]);
  const [pendingGenerate, setPendingGenerate] = useState(null);

  useEffect(() => {
    if (open) {
      setView('mood');
      setPendingGenerate(null);
      getMoods().then(setMoods);
    }
  }, [open]);

  const requestGenerate = (filters, opts) => {
    setPendingGenerate({ filters, opts });
  };

  const handleModeSelect = (mode) => {
    if (!pendingGenerate) return;
    const { filters, opts } = pendingGenerate;
    setPendingGenerate(null);
    onGenerate(filters, { ...opts, mode });
  };

  const cancelGenerate = () => {
    setPendingGenerate(null);
  };

  const handleMoodPick = (mood) => {
    requestGenerate(mood.filter_json || {}, { count: 5 });
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={view === 'mood' ? 'Generate Itinerary' : 'Custom Criteria'}
      >
        {generating && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--s-5) 0',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-sm)',
          }}>
            Generating itinerary...
          </div>
        )}

        {!generating && error === 'no-results' && (
          <div style={{
            padding: 'var(--s-4)',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 'var(--font-sm)',
          }}>
            No cities matched your criteria. Try adjusting your filters.
          </div>
        )}

        {!generating && error && error !== 'no-results' && (
          <div style={{
            padding: 'var(--s-4)',
            textAlign: 'center',
            color: 'var(--danger)',
            fontSize: 'var(--font-sm)',
          }}>
            {error}
          </div>
        )}

        {!generating && !error && view === 'mood' && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              marginBottom: 'var(--s-4)',
            }}>
              {moods.map(mood => (
                <button
                  key={mood.slug}
                  type="button"
                  onClick={() => handleMoodPick(mood)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: 'var(--r-lg)',
                    border: 'none',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{mood.emoji}</div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)' }}>
                    {mood.name}
                  </div>
                  {mood.description && (
                    <div style={{
                      fontSize: 'var(--font-xs)',
                      color: 'var(--text-secondary)',
                      marginTop: 2,
                    }}>
                      {mood.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => setView('custom')}>
                Custom criteria
              </Button>
            </div>
          </>
        )}

        {!generating && !error && view === 'custom' && (
          <>
            <button
              type="button"
              onClick={() => setView('mood')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent)', fontSize: 'var(--font-sm)',
                padding: 0, marginBottom: 'var(--s-3)',
              }}
            >
              Back to presets
            </button>
            <CriteriaForm onSubmit={requestGenerate} generating={generating} />
          </>
        )}
      </Modal>

      <ConfirmNewTripDialog
        open={!!pendingGenerate}
        onSelect={handleModeSelect}
        onCancel={cancelGenerate}
      />
    </>
  );
}
