import { useEffect, useMemo, useState } from 'react';
import { SliderBar } from '../components/SliderBar';
import { MoodGrid } from '../components/MoodGrid';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/Modal';
import { discover } from '../lib/discover';
import { createTrip } from '../hooks/useTrip';
import { supabase } from '../lib/supabase';
import { REGIONS } from '../components/sliders/RegionSlider';

const DEFAULT_SLIDER = {
  month: new Date().getMonth() + 1,
  region: 'anywhere',
  regionBbox: REGIONS[0].bbox,
  vibes: [],
};

export function DiscoverPage({ navigate }) {
  const [sliderValue, setSliderValue] = useState(DEFAULT_SLIDER);
  const [moodSlug, setMoodSlug] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const filters = useMemo(() => ({
    month: sliderValue.month,
    region: sliderValue.region,
    vibes: sliderValue.vibes,
    limit: 20,
  }), [sliderValue]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    discover(filters).then((rows) => {
      if (!cancelled) {
        setResults(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [filters]);

  const handleMood = ({ slug, filter_json }) => {
    const months = Array.isArray(filter_json.months) && filter_json.months.length > 0
      ? filter_json.months[0] : sliderValue.month;
    const region = filter_json.region || 'anywhere';
    const regionDef = REGIONS.find(r => r.value === region) || REGIONS[0];
    const vibes = Array.isArray(filter_json.vibes) ? filter_json.vibes.slice(0, 3) : [];
    setMoodSlug(slug);
    setSliderValue({ month: months, region, regionBbox: regionDef.bbox, vibes });
  };

  const startTrip = async (topN = 5) => {
    if (!results || results.length === 0) return;
    setCreating(true);
    setError('');
    try {
      const name = moodSlug
        ? titlecase(moodSlug) + ' ' + new Date().getFullYear()
        : 'Discovery Trip';
      const { tripId, branchId } = await createTrip(name, null);
      const picks = results.slice(0, topN);
      const rows = picks.map((r, i) => ({
        branch_id: branchId,
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        country: r.country || null,
        days: 2,
        position: i,
      }));
      if (rows.length > 0) {
        const { error: insertErr } = await supabase.from('destinations').insert(rows);
        if (insertErr) throw insertErr;
      }
      navigate(`/t/${tripId}/b/${branchId}`);
    } catch (err) {
      setError(err.message || 'Failed to create trip');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', paddingBottom: 120 }}>
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'var(--s-4) var(--s-4) var(--s-2)',
        maxWidth: 1200, margin: '0 auto',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-xl)', fontWeight: 'var(--fw-bold)', letterSpacing: '-0.5px' }}>plotrip</h1>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            Where should we go?
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/new')}
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--font-sm)',
            cursor: 'pointer',
          }}
        >
          Empty trip
        </button>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--s-4)' }}>
        <Section title="Moods">
          <MoodGrid onSelect={handleMood} />
        </Section>

        <Section title="Fine-tune">
          <SliderBar
            value={sliderValue}
            onChange={(next) => {
              setMoodSlug(null);
              setSliderValue({
                month: next.month,
                region: next.region,
                regionBbox: next.regionBbox,
                vibes: next.vibes,
              });
            }}
            moodSlug={moodSlug}
          />
        </Section>

        <Section title={results ? `${results.length} cities match` : 'Cities'}>
          <ResultsList results={results} loading={loading} />
        </Section>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 'var(--font-sm)', margin: 'var(--s-3) 0' }}>{error}</p>
        )}
      </div>

      {results && results.length > 0 && (
        <div style={{
          position: 'fixed', left: 0, right: 0,
          bottom: 'env(safe-area-inset-bottom)',
          padding: 'var(--s-3) var(--s-4)',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          display: 'flex', gap: 'var(--s-2)', justifyContent: 'center', alignItems: 'center',
        }}>
          <Button variant="ghost" onClick={() => startTrip(5)} disabled={creating}>
            Start trip with top 5
          </Button>
          <Button onClick={() => startTrip(8)} disabled={creating}>
            {creating ? 'Creating…' : 'Start trip with top 8'}
          </Button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 'var(--s-5)' }}>
      <h2 style={{
        margin: '0 0 var(--s-3)',
        fontSize: 'var(--font-sm)',
        fontWeight: 'var(--fw-semibold)',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ResultsList({ results, loading }) {
  if (loading && !results) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height={72} radius={12} />
        ))}
      </div>
    );
  }
  if (!results || results.length === 0) {
    return (
      <div style={{
        padding: 'var(--s-6) var(--s-4)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        background: 'var(--surface)',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--r-lg)',
        fontSize: 'var(--font-sm)',
      }}>
        No matches. Try another region or vibe.
        <div style={{ fontSize: 'var(--font-xs)', marginTop: 6, color: 'var(--text-subtle)' }}>
          Data is still being seeded for this catalog. Run the ETL scripts to populate.
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
      {results.map((c, i) => <ResultRow key={c.city_id} c={c} rank={i + 1} />)}
    </div>
  );
}

function ResultRow({ c, rank }) {
  const score = Math.round((c.match_score ?? 0) * 100);
  const scoreColor = score >= 70 ? 'var(--match-high)' : score >= 40 ? 'var(--match-mid)' : 'var(--match-low)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
      padding: 'var(--s-3)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
    }}>
      <div style={{
        flex: '0 0 32px', width: 32, height: 32,
        borderRadius: 'var(--r-pill)',
        background: 'var(--surface-2)',
        color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-semibold)',
      }}>
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--font-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--text)' }}>
          {c.name}
          {c.country && <span style={{ fontWeight: 'var(--fw-regular)', color: 'var(--text-muted)' }}>, {c.country}</span>}
        </div>
        {c.reason_chips && c.reason_chips.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {c.reason_chips.slice(0, 3).map((chip, i) => (
              <span key={i} style={{
                fontSize: 'var(--font-xs)', color: 'var(--text-muted)',
                background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 'var(--r-pill)',
              }}>{chip}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{
        flex: '0 0 auto',
        fontSize: 'var(--font-sm)', fontWeight: 'var(--fw-bold)',
        color: scoreColor,
        minWidth: 36, textAlign: 'right',
      }}>
        {score}%
      </div>
    </div>
  );
}

function titlecase(slug) {
  return slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}
