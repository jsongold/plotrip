import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Skeleton } from './Skeleton';
import { Modal } from './Modal';
import { ClimateStrip } from './widgets/ClimateStrip';
import { CrowdHeatmap } from './widgets/CrowdHeatmap';
import { RadarChart } from './widgets/RadarChart';
import { VisitorMixBar } from './widgets/VisitorMixBar';
import { ReachabilityBadge } from './widgets/ReachabilityBadge';
import { ReactionBar } from './ReactionBar';
import { useCityMeta } from '../hooks/useCityMeta';

function matchTone(score) {
  if (score == null) return 'var(--border-strong)';
  if (score >= 0.7) return 'var(--match-high)';
  if (score >= 0.4) return 'var(--match-mid)';
  return 'var(--match-low)';
}

function costLabel(tier) {
  if (tier === 1) return '$';
  if (tier === 2) return '$$';
  if (tier === 3) return '$$$';
  return '–';
}

function SafetyMeter({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const color = v >= 70 ? 'var(--success)' : v >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', minWidth: 0 }}>
      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Safety</span>
      <span
        style={{
          position: 'relative',
          flex: 1,
          height: 6,
          borderRadius: 'var(--r-pill)',
          background: 'var(--surface-2)',
          overflow: 'hidden',
          minWidth: 40,
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${v}%`,
            background: color,
            borderRadius: 'var(--r-pill)',
          }}
        />
      </span>
      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text)', fontWeight: 'var(--fw-medium)' }}>
        {Math.round(v)}
      </span>
    </div>
  );
}

function Thumb({ url, name }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name || ''}
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--r-md)',
          objectFit: 'cover',
          flexShrink: 0,
          background: 'var(--surface-2)',
        }}
      />
    );
  }
  const initial = (name || '?').slice(0, 1).toUpperCase();
  return (
    <div
      aria-hidden="true"
      style={{
        width: 48,
        height: 48,
        borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontWeight: 'var(--fw-semibold)',
        fontSize: 'var(--font-md)',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

function formatIsoRange(w) {
  if (!w) return null;
  const s = w.start instanceof Date ? w.start.toISOString().slice(0, 10) : String(w.start).slice(0, 10);
  const e = w.end instanceof Date ? w.end.toISOString().slice(0, 10) : String(w.end).slice(0, 10);
  return { start: s, end: e };
}

export function CityCard({
  city,
  selectedMonth = 1,
  tripWindow,
  onAdd,
  expanded: expandedProp,
  defaultExpanded = false,
  showReactions = false,
  branchId = null,
  destinationId = null,
  myLabel = null,
  onSetLabel,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultExpanded);
  const isControlled = typeof expandedProp === 'boolean';
  const expanded = isControlled ? expandedProp : internalOpen;
  const toggleExpanded = () => {
    if (!isControlled) setInternalOpen((v) => !v);
  };

  const [monthly, setMonthly] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [events, setEvents] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);
  const fetchedOnceRef = useRef(false);

  const cityId = city?.city_id;
  const ref = useCityMeta(city, { month: selectedMonth });

  // TODO(F1): migrate to ref.get('monthly.*') once useCityMeta is verified
  useEffect(() => {
    if (!expanded || !cityId || fetchedOnceRef.current) return;
    fetchedOnceRef.current = true;
    let alive = true;
    setMonthlyLoading(true);
    supabase
      .from('city_monthly')
      .select('month, avg_high_c, avg_low_c, crowd_index, event_count, season_label')
      .eq('city_id', cityId)
      .order('month')
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.warn('[CityCard] city_monthly error:', error.message);
          setMonthly([]);
        } else {
          setMonthly(data || []);
        }
        setMonthlyLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [expanded, cityId]);

  useEffect(() => {
    if (!expanded || !cityId || !tripWindow) return;
    const range = formatIsoRange(tripWindow);
    if (!range) return;
    let alive = true;
    setEventsLoading(true);
    supabase
      .from('events')
      .select('*')
      .eq('city_id', cityId)
      .gte('start_date', range.start)
      .lte('start_date', range.end)
      .order('start_date')
      .limit(4)
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.warn('[CityCard] events error:', error.message);
          setEvents([]);
        } else {
          setEvents(data || []);
        }
        setEventsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [expanded, cityId, tripWindow?.start, tripWindow?.end]);

  const tone = matchTone(city?.match_score);
  const tags = Array.isArray(city?.top_tags) ? city.top_tags.slice(0, 4) : [];

  // Radar scores: DiscoverResult gives us a subset; approximate the 8 axes.
  const radarScores = {
    safety: ref.get('scores.safety') ?? city?.safety ?? 0,
    affordability: (() => {
      const ct = ref.get('scores.cost_tier') ?? city?.cost_tier;
      return ct != null ? Math.max(0, 100 - (ct - 1) * 40) : 0;
    })(),
    language: ref.get('scores.language_ease') ?? city?.language_ease ?? 0,
    photogenic: tags.includes('photogenic') ? 90 : 60,
    nightlife: tags.includes('nightlife') ? 90 : 40,
    outdoors: tags.includes('outdoors') || tags.includes('nature') ? 90 : 40,
    culture: tags.includes('culture') || tags.includes('history') ? 90 : 50,
    food: tags.includes('food') ? 90 : 50,
  };

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 'var(--s-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-3)',
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--text)',
      }}
    >
      {/* Hero row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
        <Thumb url={city?.cover_photo_url} name={city?.name} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            type="button"
            onClick={toggleExpanded}
            style={{
              all: 'unset',
              cursor: isControlled ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--s-2)',
              minWidth: 0,
            }}
            title={isControlled ? '' : expanded ? 'Collapse' : 'Expand'}
          >
            <span
              style={{
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {city?.name}
            </span>
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 32,
                height: 20,
                padding: '0 6px',
                borderRadius: 'var(--r-pill)',
                background: tone,
                color: '#fff',
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--fw-semibold)',
              }}
            >
              {city?.match_score != null ? Math.round(city.match_score * 100) : '–'}
            </span>
          </button>
          <span
            style={{
              fontSize: 'var(--font-xs)',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {city?.country || '\u00a0'}
          </span>
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: 'var(--font-lg)',
              lineHeight: 1,
              flexShrink: 0,
            }}
            title="Add to trip"
            aria-label="Add to trip"
          >
            +
          </button>
        )}
      </div>

      {/* Reason/top tag chips */}
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-1)' }}>
          {tags.map((t) => (
            <span
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--accent-weak)',
                color: 'var(--accent)',
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--fw-medium)',
                whiteSpace: 'nowrap',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          {/* Climate */}
          <div>
            <div
              style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--s-1)',
              }}
            >
              Climate
            </div>
            {monthlyLoading || monthly == null ? (
              <Skeleton height={52} />
            ) : (
              <ClimateStrip monthly={monthly} selectedMonth={selectedMonth} />
            )}
          </div>

          {/* Crowd */}
          <div>
            <div
              style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--s-1)',
              }}
            >
              Crowd
            </div>
            {monthlyLoading || monthly == null ? (
              <Skeleton height={24} />
            ) : (
              <CrowdHeatmap monthly={monthly} selectedMonth={selectedMonth} />
            )}
          </div>

          {/* Meta pills row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)', alignItems: 'center' }}>
            <ReachabilityBadge visa="unknown" flightHours={null} />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 'var(--r-pill)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: 'var(--font-xs)',
                fontWeight: 'var(--fw-semibold)',
              }}
              title="Cost tier"
            >
              {costLabel(city?.cost_tier)}
            </span>
            {city?.event_count != null && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--font-xs)',
                }}
              >
                {city.event_count} events
              </span>
            )}
          </div>

          {/* Safety meter */}
          {city?.safety != null && <SafetyMeter value={city.safety} />}

          {/* Events in window */}
          {tripWindow && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Events in your window
              </div>
              {eventsLoading || events == null ? (
                <div style={{ display: 'flex', gap: 'var(--s-1)' }}>
                  <Skeleton width={80} height={20} />
                  <Skeleton width={100} height={20} />
                  <Skeleton width={70} height={20} />
                </div>
              ) : events.length === 0 ? (
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-subtle)' }}>
                  No events found
                </span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-1)' }}>
                  {events.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id ?? `${ev.name}-${ev.start_date}`}
                      title={ev.name}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: 'var(--r-pill)',
                        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                        color: 'var(--accent)',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 'var(--fw-medium)',
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.name}
                    </span>
                  ))}
                  {events.length > 3 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: 'var(--r-pill)',
                        background: 'var(--surface-2)',
                        color: 'var(--text-muted)',
                        fontSize: 'var(--font-xs)',
                      }}
                    >
                      +{events.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Visitor mix */}
          {city?.visitor_mix && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Visitor mix</div>
              <VisitorMixBar mix={city.visitor_mix} />
            </div>
          )}

          {/* Radar preview (tap to expand) */}
          <button
            type="button"
            onClick={() => setRadarOpen(true)}
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--s-2)',
              cursor: 'pointer',
              padding: 'var(--s-2)',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
            }}
            title="Show full vibe radar"
          >
            <RadarChart scores={radarScores} size={60} compact />
            <span
              style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-muted)',
                fontWeight: 'var(--fw-medium)',
              }}
            >
              Tap for full vibe radar
            </span>
          </button>

          {showReactions && branchId && destinationId && (
            <ReactionBar
              branchId={branchId}
              destinationId={destinationId}
              myLabel={myLabel}
              onSetLabel={onSetLabel}
            />
          )}
        </div>
      )}

      <Modal
        open={radarOpen}
        onOpenChange={setRadarOpen}
        title={`${city?.name || 'City'} — vibe radar`}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--s-3)' }}>
          <RadarChart scores={radarScores} size={240} />
        </div>
      </Modal>
    </article>
  );
}
