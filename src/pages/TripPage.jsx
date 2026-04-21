import { useState, useEffect } from 'react';
import { Map } from '../components/Map';
import { Toolbar } from '../components/Toolbar';
import { CityList } from '../components/CityList';
import { BranchBar } from '../components/BranchBar';
import { PasswordGate } from '../components/PasswordGate';
import { DestinationSheet } from '../components/DestinationSheet';
import { CompareView } from '../components/CompareView';
import { useBranch } from '../hooks/useBranch';
import { loadTrip, isProtected, isUnlocked, getDefaultBranchId } from '../hooks/useTrip';
import { useTripHandlers } from '../hooks/useTripHandlers';
import { FilterProvider } from '../context/FilterContext';
import { FilterBar } from '../components/filterbar/FilterBar';
import { CitySuggestionCarousel } from '../components/CitySuggestionCarousel';
import { AuthActions } from '../components/auth';
import { ItinerarySuggestionButton } from '../components/itinerary-suggestion/ItinerarySuggestionButton';
import { ItinerarySuggestionSheet } from '../components/itinerary-suggestion/ItinerarySuggestionSheet';
import { useItinerarySuggestion } from '../components/itinerary-suggestion/useItinerarySuggestion';

export function TripPage({ tripId, branchId, navigate, replace }) {
  const [trip, setTrip] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  const { cities, loading: citiesLoading, addCity, removeCity, reorderCity, updateDays, clearCities } =
    useBranch(branchId, branches);
  const [status, setStatus] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [compareBranchId, setCompareBranchId] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [showTooltips, setShowTooltips] = useState(true);
  const [suggestFor, setSuggestFor] = useState(null);
  const [suggestOption, setSuggestOption] = useState(null);
  const [previewCity, setPreviewCity] = useState(null);
  const [itGenOpen, setItGenOpen] = useState(false);
  const { generate, generating, error: genError } = useItinerarySuggestion({ navigate, tripId, branchId, addCity });
  const startDate = trip?.start_date || null;

  const handleCityTap = (city) => {
    if (city?.lat == null || city?.lng == null) return;
    setFocusRequest({ lat: city.lat, lng: city.lng, _tick: Date.now() });
    setPanelOpen(false);
  };

  const handleSuggestOrigin = (origin) => {
    const { option, ...city } = origin;
    setPanelOpen(false);
    setSuggestFor(city);
    setSuggestOption(option || null);
  };

  const handleSuggestClose = () => {
    setSuggestFor(null);
    setSuggestOption(null);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadTrip(tripId).then(({ trip: t, branches: b }) => {
      if (cancelled) return;
      setTrip(t);
      setBranches(b);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tripId]);

  useEffect(() => {
    if (!trip || loading) return;
    if (branchId) return;
    getDefaultBranchId(tripId).then(defaultId => {
      replace(`/t/${tripId}/b/${defaultId}`);
    });
  }, [trip, loading, branchId, tripId, replace]);

  const {
    handleAdd,
    handleFork,
    handleShare,
    handleRemove,
    handleTripNameChange,
    handleBranchNameChange,
    handleBranchSwitch,
    handleNewTrip,
    handleNewBranch,
    handleDeleteBranch,
    handleStartDateChange,
  } = useTripHandlers({
    tripId,
    branchId,
    cities,
    trip,
    branches,
    addCity,
    removeCity,
    clearCities,
    setTrip,
    setBranches,
    setStatus,
    navigate,
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--text-muted)' }}>
        Loading trip...
      </div>
    );
  }

  if (isProtected(trip) && !isUnlocked(tripId) && !unlocked) {
    return <PasswordGate trip={trip} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <FilterProvider>
      <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      {/* Layer 1: Map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Map
          cities={cities}
          onCitySelect={handleAdd}
          onSuggest={handleSuggestOrigin}
          focusRequest={focusRequest}
          previewCity={previewCity}
          showTooltips={showTooltips}
        />
      </div>

      {/* Layer 2: Destination list (bottom sheet) */}
      <div style={{
        position: 'fixed',
        top: 'max(12px, env(safe-area-inset-top))',
        right: 16,
        zIndex: 1300,
      }}>
        <AuthActions navigate={navigate} compact />
      </div>

      <DestinationSheet
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        header={
          <div style={{
            padding: '4px 16px 8px',
            background: '#fff',
          }}>
            <BranchBar
              tripId={tripId}
              tripName={trip?.name}
              branches={branches}
              currentBranchId={branchId}
              onSwitch={handleBranchSwitch}
              onTripNameChange={handleTripNameChange}
              onBranchNameChange={handleBranchNameChange}
              onShare={handleShare}
              onSelectTrip={(tId, bId) => navigate(`/t/${tId}/b/${bId}`)}
              onNewBranch={handleNewBranch}
              onDeleteBranch={handleDeleteBranch}
              onCompare={() => {
                const other = branches.find((b) => b.id !== branchId);
                if (other) setCompareBranchId(other.id);
              }}
            />
          </div>
        }
      >
        <div style={{ padding: '8px 16px 100px' }}>
          <CityList cities={cities} onRemove={handleRemove} onReorder={reorderCity} onDaysChange={updateDays} onFork={handleFork} startDate={startDate} onStartDateChange={handleStartDateChange} onCityTap={handleCityTap} />
        </div>
      </DestinationSheet>

      {/* Layer 3: Search bar (always on top, fixed to viewport) */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          title="Show destinations"
          style={{
            position: 'fixed', left: '50%',
            bottom: 'calc(70px + env(safe-area-inset-bottom))',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: 64, height: 64,
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            color: 'var(--text-muted)',
          }}
        >
          <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 14l6-6 6 6" />
          </svg>
          {cities.length > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 6, right: 6,
                minWidth: 20, height: 20, padding: '0 5px',
                borderRadius: 10,
                background: 'var(--accent, #2563eb)',
                color: 'var(--accent-text)',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              {cities.length}
            </span>
          )}
        </button>
      )}
      <div
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', left: 0, right: 0,
          bottom: 'calc(24px + env(safe-area-inset-bottom))',
          zIndex: 1000, padding: '0 16px',
          pointerEvents: 'auto',
        }}
      >
        <Toolbar onAdd={(city) => {
          setPreviewCity({ ...city, _tick: Date.now() });
        }} status={status} />
      </div>
      <ItinerarySuggestionButton
        onClick={() => setItGenOpen(true)}
        style={{
          position: 'fixed',
          right: 72,
          bottom: 'max(calc(80px + env(safe-area-inset-bottom)), calc(var(--dest-sheet-top, 0px) + 10px), calc(var(--rec-carousel-top, 0px) + 10px))',
          zIndex: 1200,
          transition: 'bottom 200ms ease-out',
        }}
      />
      <ItinerarySuggestionSheet
        open={itGenOpen}
        onOpenChange={setItGenOpen}
        generating={generating}
        error={genError}
        onGenerate={async (filters, opts) => {
          await generate(filters, opts);
        }}
      />
      <button
        onClick={() => setShowTooltips((v) => !v)}
        aria-label={showTooltips ? 'Hide labels' : 'Show labels'}
        aria-pressed={!showTooltips}
        title={showTooltips ? 'Hide labels' : 'Show labels'}
        style={{
          position: 'fixed',
          right: 128,
          bottom: 'max(calc(80px + env(safe-area-inset-bottom)), calc(var(--dest-sheet-top, 0px) + 10px), calc(var(--rec-carousel-top, 0px) + 10px))',
          zIndex: 1200,
          width: 44, height: 44,
          borderRadius: 'var(--r-lg)',
          border: `1px solid ${showTooltips ? 'var(--text)' : 'var(--border)'}`,
          background: showTooltips ? 'var(--text)' : 'var(--surface)',
          color: showTooltips ? 'var(--bg)' : 'var(--text)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      </button>
      <FilterBar />

      {compareBranchId && (
        <CompareView
          tripId={tripId}
          branchAId={branchId}
          branchBId={compareBranchId}
          onClose={() => setCompareBranchId(null)}
        />
      )}

      {suggestFor && suggestOption && (
        <CitySuggestionCarousel
          origin={suggestFor}
          suggestionOption={suggestOption}
          onClose={handleSuggestClose}
          onFocusCity={(c) => setFocusRequest({ lat: c.lat, lng: c.lng, _tick: Date.now() })}
          onAddCity={(c) => handleAdd({ name: c.name, lat: c.lat, lng: c.lng, country: c.country })}
          onSuggest={(c, option) => {
            setSuggestFor({ id: c.id, name: c.name, country: c.country, lat: c.lat, lng: c.lng });
            if (option) setSuggestOption(option);
          }}
        />
      )}
      </div>
    </FilterProvider>
  );
}
