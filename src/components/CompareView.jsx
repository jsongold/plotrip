import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CityCard } from './CityCard';
import { BranchDiff } from './BranchDiff';
import { Skeleton, SkeletonBlock } from './Skeleton';
import { Button } from './Modal';

const norm = (s) => (s || '').trim().toLowerCase();

function selectedMonthFromWindow(win) {
  if (!win?.start) return 1;
  const d = win.start instanceof Date ? win.start : new Date(win.start);
  if (Number.isNaN(d.getTime())) return 1;
  return d.getUTCMonth() + 1;
}

async function loadBranchBundle(branchId) {
  if (!branchId) return { destinations: [], hydrated: [] };
  const { data: destinations, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('branch_id', branchId)
    .order('sort_order', { ascending: true });
  if (error) {
    console.warn('[CompareView] destinations error:', error.message);
    return { destinations: [], hydrated: [] };
  }
  const dests = destinations || [];
  if (dests.length === 0) return { destinations: [], hydrated: [] };

  // Hydrate by matching catalog_cities on lowercased name.
  const uniqueNames = Array.from(new Set(dests.map((d) => norm(d.name)).filter(Boolean)));
  let catalog = [];
  if (uniqueNames.length > 0) {
    // Use `or(name.ilike.<n>,...)` for case-insensitive name match.
    const orFilter = uniqueNames
      .map((n) => `name.ilike.${n.replace(/,/g, '')}`)
      .join(',');
    const { data: cat, error: cErr } = await supabase
      .from('catalog_cities')
      .select('id, name, country, lat, lng, cover_photo_url')
      .or(orFilter);
    if (cErr) {
      console.warn('[CompareView] catalog_cities error:', cErr.message);
    } else {
      catalog = cat || [];
    }
  }

  const catalogByName = new Map();
  catalog.forEach((c) => {
    const k = norm(c.name);
    if (!catalogByName.has(k)) catalogByName.set(k, c);
  });

  // For each matched city, fetch scores in a single query.
  const catalogIds = Array.from(
    new Set(
      dests
        .map((d) => catalogByName.get(norm(d.name))?.id)
        .filter((v) => v != null),
    ),
  );
  let scoresById = new Map();
  if (catalogIds.length > 0) {
    const { data: scores, error: sErr } = await supabase
      .from('city_scores')
      .select('city_id, safety, affordability, language_ease, cost_tier, event_count, top_tags')
      .in('city_id', catalogIds);
    if (sErr) {
      console.warn('[CompareView] city_scores error:', sErr.message);
    } else {
      (scores || []).forEach((s) => scoresById.set(s.city_id, s));
    }
  }

  const hydrated = dests.map((d) => {
    const cat = catalogByName.get(norm(d.name));
    const sc = cat ? scoresById.get(cat.id) : null;
    if (!cat) {
      return {
        destination: d,
        matched: false,
        city: {
          city_id: null,
          name: d.name,
          country: d.country || '',
          lat: d.lat ?? null,
          lng: d.lng ?? null,
          match_score: null,
          reason_chips: [],
          cover_photo_url: null,
          avg_high_c: null,
          crowd_index: null,
          event_count: 0,
          safety: null,
          cost_tier: null,
          language_ease: null,
          top_tags: [],
          visitor_mix: {},
        },
      };
    }
    return {
      destination: d,
      matched: true,
      city: {
        city_id: cat.id,
        name: cat.name,
        country: cat.country,
        lat: cat.lat,
        lng: cat.lng,
        match_score: null,
        reason_chips: [],
        cover_photo_url: cat.cover_photo_url || null,
        avg_high_c: null,
        crowd_index: null,
        event_count: sc?.event_count ?? 0,
        safety: sc?.safety ?? null,
        cost_tier: sc?.cost_tier ?? null,
        language_ease: sc?.language_ease ?? null,
        top_tags: Array.isArray(sc?.top_tags) ? sc.top_tags.slice(0, 4) : [],
        visitor_mix: {},
      },
    };
  });

  return { destinations: dests, hydrated };
}

function AggregateHeader({ entries, selectedMonth, moodMatch }) {
  const matched = entries.filter((e) => e.matched);
  const avgSafety = matched.length
    ? Math.round(
        matched
          .map((e) => e.city.safety)
          .filter((v) => v != null)
          .reduce((a, b, _i, arr) => a + b / arr.length, 0) || 0,
      )
    : null;
  const costTiers = matched.map((e) => e.city.cost_tier).filter((v) => v != null);
  const avgCost = costTiers.length
    ? Math.round(costTiers.reduce((a, b) => a + b, 0) / costTiers.length)
    : null;
  const totalEvents = matched.reduce((a, e) => a + (e.city.event_count || 0), 0);
  // Vibe diversity: count of distinct top_tags across all cities in the branch.
  const vibeSet = new Set();
  matched.forEach((e) => (e.city.top_tags || []).forEach((t) => vibeSet.add(t)));
  const vibeDiversity = vibeSet.size;

  const stat = (label, value) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{label}</span>
      <span
        style={{
          fontSize: 'var(--font-sm)',
          fontWeight: 'var(--fw-semibold)',
          color: 'var(--text)',
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))',
        gap: 'var(--s-2)',
        padding: 'var(--s-3)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
      }}
    >
      {stat('Month', selectedMonth)}
      {stat('Events', totalEvents)}
      {stat('Safety', avgSafety != null ? avgSafety : '–')}
      {stat('Cost', avgCost != null ? '$'.repeat(avgCost) : '–')}
      {stat('Vibes', vibeDiversity)}
      {moodMatch != null && stat('Mood', `${Math.round(moodMatch * 100)}%`)}
    </div>
  );
}

function BranchColumn({
  title,
  entries,
  loading,
  selectedMonth,
  tripWindow,
  onPromote,
  promoting,
  promoted,
  moodMatch,
  branchId,
  myLabel,
  onSetLabel,
  registerRef,
  scrollRef,
}) {
  return (
    <section
      ref={scrollRef}
      style={{
        flex: '0 0 100%',
        minWidth: 0,
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-3)',
        padding: 'var(--s-3)',
        overflowY: 'auto',
        maxHeight: '100%',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--s-2)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'var(--font-md)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h2>
        <Button
          variant={promoted ? 'primary' : 'ghost'}
          onClick={onPromote}
          disabled={promoting || promoted}
        >
          {promoted ? 'Promoted' : promoting ? 'Promoting…' : 'Promote'}
        </Button>
      </header>

      {loading ? (
        <SkeletonBlock lines={4} />
      ) : (
        <>
          <AggregateHeader entries={entries} selectedMonth={selectedMonth} moodMatch={moodMatch} />
          {entries.length === 0 && (
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
              No destinations in this branch yet.
            </span>
          )}
          {entries.map((e) => (
            <div
              key={e.destination.id}
              ref={(node) => registerRef(e.destination.id, node)}
            >
              <CityCard
                city={e.city}
                selectedMonth={selectedMonth}
                tripWindow={tripWindow}
                showReactions={e.matched}
                branchId={branchId}
                destinationId={e.destination.id}
                myLabel={myLabel}
                onSetLabel={onSetLabel}
              />
            </div>
          ))}
        </>
      )}
    </section>
  );
}

export function CompareView({
  tripId,
  branchAId,
  branchBId,
  tripWindow,
  moodMatchA = null,
  moodMatchB = null,
  onClose,
}) {
  const [loadingA, setLoadingA] = useState(true);
  const [loadingB, setLoadingB] = useState(true);
  const [bundleA, setBundleA] = useState({ destinations: [], hydrated: [] });
  const [bundleB, setBundleB] = useState({ destinations: [], hydrated: [] });
  const [branchMeta, setBranchMeta] = useState({ a: null, b: null, promotedId: null });
  const [promotingSide, setPromotingSide] = useState(null);
  const [myLabel, setMyLabel] = useState(() => {
    try {
      return localStorage.getItem('plotrip:reactionLabel') || null;
    } catch {
      return null;
    }
  });

  const refsA = useRef(new Map());
  const refsB = useRef(new Map());
  const colRefA = useRef(null);
  const colRefB = useRef(null);

  const selectedMonth = selectedMonthFromWindow(tripWindow);

  useEffect(() => {
    let alive = true;
    setLoadingA(true);
    loadBranchBundle(branchAId).then((b) => {
      if (!alive) return;
      setBundleA(b);
      setLoadingA(false);
    });
    return () => {
      alive = false;
    };
  }, [branchAId]);

  useEffect(() => {
    let alive = true;
    setLoadingB(true);
    loadBranchBundle(branchBId).then((b) => {
      if (!alive) return;
      setBundleB(b);
      setLoadingB(false);
    });
    return () => {
      alive = false;
    };
  }, [branchBId]);

  // Fetch branch metadata (names + trip promoted id)
  useEffect(() => {
    let alive = true;
    (async () => {
      const ids = [branchAId, branchBId].filter(Boolean);
      if (ids.length === 0) return;
      const { data: branches } = await supabase.from('branches').select('id, name').in('id', ids);
      let promotedId = null;
      if (tripId) {
        const { data: trip } = await supabase
          .from('trips')
          .select('promoted_branch_id')
          .eq('id', tripId)
          .maybeSingle();
        promotedId = trip?.promoted_branch_id ?? null;
      }
      if (!alive) return;
      const byId = new Map((branches || []).map((b) => [b.id, b]));
      setBranchMeta({
        a: byId.get(branchAId) || null,
        b: byId.get(branchBId) || null,
        promotedId,
      });
    })();
    return () => {
      alive = false;
    };
  }, [tripId, branchAId, branchBId]);

  const handleSetLabel = useCallback((label) => {
    setMyLabel(label);
    try {
      localStorage.setItem('plotrip:reactionLabel', label);
    } catch {
      // ignore
    }
  }, []);

  const promote = async (side) => {
    if (!tripId) return;
    const targetBranchId = side === 'a' ? branchAId : branchBId;
    setPromotingSide(side);
    const { error } = await supabase
      .from('trips')
      .update({ promoted_branch_id: targetBranchId })
      .eq('id', tripId);
    if (error) {
      console.warn('[CompareView] promote error:', error.message);
    } else {
      setBranchMeta((m) => ({ ...m, promotedId: targetBranchId }));
    }
    setPromotingSide(null);
  };

  const registerRefA = (destId, node) => {
    if (node) refsA.current.set(destId, node);
    else refsA.current.delete(destId);
  };
  const registerRefB = (destId, node) => {
    if (node) refsB.current.set(destId, node);
    else refsB.current.delete(destId);
  };

  const handleScrollTo = (side, city) => {
    const name = norm(city?.name);
    if (!name) return;
    if (side === 'a' || side === 'both') {
      const match = bundleA.hydrated.find((e) => norm(e.city.name) === name);
      if (match) {
        const node = refsA.current.get(match.destination.id);
        node?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        colRefA.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
      }
    }
    if (side === 'b' || side === 'both') {
      const match = bundleB.hydrated.find((e) => norm(e.city.name) === name);
      if (match) {
        const node = refsB.current.get(match.destination.id);
        node?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        colRefB.current?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
      }
    }
  };

  const citiesA = useMemo(() => bundleA.hydrated.map((e) => e.city), [bundleA]);
  const citiesB = useMemo(() => bundleB.hydrated.map((e) => e.city), [bundleB]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2100,
        background: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="dialog"
      aria-label="Compare branches"
    >
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--s-3)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--font-md)',
            fontWeight: 'var(--fw-semibold)',
          }}
        >
          Compare branches
        </h1>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </header>

      {/* Body: two columns + diff strip */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          gap: 'var(--s-2)',
          padding: 'var(--s-2)',
        }}
      >
        {/* Scroll-snap column container (swipe on mobile) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <BranchColumn
            scrollRef={colRefA}
            title={branchMeta.a?.name || 'Branch A'}
            entries={bundleA.hydrated}
            loading={loadingA}
            selectedMonth={selectedMonth}
            tripWindow={tripWindow}
            onPromote={() => promote('a')}
            promoting={promotingSide === 'a'}
            promoted={branchMeta.promotedId === branchAId}
            moodMatch={moodMatchA}
            branchId={branchAId}
            myLabel={myLabel}
            onSetLabel={handleSetLabel}
            registerRef={registerRefA}
          />
          <BranchColumn
            scrollRef={colRefB}
            title={branchMeta.b?.name || 'Branch B'}
            entries={bundleB.hydrated}
            loading={loadingB}
            selectedMonth={selectedMonth}
            tripWindow={tripWindow}
            onPromote={() => promote('b')}
            promoting={promotingSide === 'b'}
            promoted={branchMeta.promotedId === branchBId}
            moodMatch={moodMatchB}
            branchId={branchBId}
            myLabel={myLabel}
            onSetLabel={handleSetLabel}
            registerRef={registerRefB}
          />
        </div>

        {/* Diff column (hidden on narrow) */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}>
          {loadingA || loadingB ? (
            <div style={{ width: 200, padding: 'var(--s-2)' }}>
              <Skeleton height={160} />
            </div>
          ) : (
            <BranchDiff
              branchACities={citiesA}
              branchBCities={citiesB}
              onScrollTo={handleScrollTo}
            />
          )}
        </div>
      </div>
    </div>
  );
}
