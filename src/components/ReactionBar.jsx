import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Prompt } from './Modal';

const EMOJIS = ['👍', '👎', '💭'];

// Session cache keyed by branchId + destinationId to avoid refetching across remounts
const cache = new Map();
const keyOf = (branchId, destinationId) => `${branchId}::${destinationId}`;

export function ReactionBar({ branchId, destinationId, myLabel, onSetLabel }) {
  const [counts, setCounts] = useState(() => cache.get(keyOf(branchId, destinationId))?.counts || {});
  const [loading, setLoading] = useState(false);
  const [pendingEmoji, setPendingEmoji] = useState(null);
  const [promptOpen, setPromptOpen] = useState(false);

  const k = keyOf(branchId, destinationId);

  const refetch = useCallback(async () => {
    if (!branchId || !destinationId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('branch_reactions')
      .select('emoji')
      .eq('branch_id', branchId)
      .eq('destination_id', destinationId);
    if (error) {
      console.warn('[ReactionBar] fetch error:', error.message);
      setLoading(false);
      return;
    }
    const tallied = {};
    (data || []).forEach((row) => {
      tallied[row.emoji] = (tallied[row.emoji] || 0) + 1;
    });
    cache.set(k, { counts: tallied });
    setCounts(tallied);
    setLoading(false);
  }, [branchId, destinationId, k]);

  useEffect(() => {
    if (cache.has(k)) {
      setCounts(cache.get(k).counts || {});
      return;
    }
    refetch();
  }, [k, refetch]);

  const submit = useCallback(
    async (emoji, authorLabel) => {
      if (!authorLabel) return;
      const { error } = await supabase.from('branch_reactions').insert({
        branch_id: branchId,
        destination_id: destinationId,
        emoji,
        author_label: authorLabel,
      });
      if (error) {
        console.warn('[ReactionBar] insert error:', error.message);
        return;
      }
      // optimistic bump then refetch
      cache.delete(k);
      setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
      refetch();
    },
    [branchId, destinationId, k, refetch],
  );

  const handleTap = (emoji) => {
    if (!myLabel) {
      setPendingEmoji(emoji);
      setPromptOpen(true);
      return;
    }
    submit(emoji, myLabel);
  };

  const handlePromptSubmit = (value) => {
    const label = (value || '').trim();
    setPromptOpen(false);
    if (!label) {
      setPendingEmoji(null);
      return;
    }
    onSetLabel?.(label);
    if (pendingEmoji) submit(pendingEmoji, label);
    setPendingEmoji(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s-2)',
        padding: 'var(--s-1)',
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
      }}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleTap(emoji)}
          disabled={loading}
          style={{
            all: 'unset',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            cursor: loading ? 'progress' : 'pointer',
            fontSize: 'var(--font-sm)',
          }}
          title={`React ${emoji}`}
        >
          <span aria-hidden="true">{emoji}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
            {counts[emoji] || 0}
          </span>
        </button>
      ))}
      <Prompt
        open={promptOpen}
        onOpenChange={setPromptOpen}
        title="Pick a nickname"
        placeholder="e.g. Alex"
        submitLabel="Save"
        onSubmit={handlePromptSubmit}
      />
    </div>
  );
}
