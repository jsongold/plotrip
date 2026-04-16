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
  const startDate = trip?.start_date || null;

  const handleCityTap = (city) => {
    if (city?.lat == null || city?.lng == null) return;
    setFocusRequest({ lat: city.lat, lng: city.lng, _tick: Date.now() });
    setPanelOpen(false);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: '#888' }}>
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
          focusRequest={focusRequest}
          showTooltips={showTooltips}
        />
      </div>

      {/* Layer 2: Destination list (bottom sheet) */}
      <DestinationSheet
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        header={
          <div style={{
            padding: '4px 16px 8px',
            borderBottom: '1px solid #eee', background: '#fff',
          }}>
            <BranchBar
              tripName={trip?.name}
              branches={branches}
              currentBranchId={branchId}
              onSwitch={handleBranchSwitch}
              onTripNameChange={handleTripNameChange}
              onBranchNameChange={handleBranchNameChange}
              onShare={handleShare}
              onNewTrip={handleNewTrip}
              onNewBranch={handleNewBranch}
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
            color: '#444',
          }}
        >
          <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 14l6-6 6 6" />
          </svg>
        </button>
      )}
      <FilterBar />
      <button
        onClick={() => setShowTooltips((v) => !v)}
        aria-label={showTooltips ? 'ツールチップを隠す' : 'ツールチップを表示'}
        aria-pressed={!showTooltips}
        title={showTooltips ? 'Hide labels' : 'Show labels'}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          zIndex: 1000,
          width: 40, height: 40,
          borderRadius: '50%',
          border: '1.5px solid var(--border)',
          background: showTooltips ? 'var(--accent)' : 'var(--surface, #fff)',
          color: showTooltips ? '#fff' : 'var(--text, #111)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      </button>
      <div style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        zIndex: 1000, padding: '0 16px',
        pointerEvents: 'auto',
      }}>
        <Toolbar onAdd={handleAdd} status={status} />
      </div>

      {compareBranchId && (
        <CompareView
          tripId={tripId}
          branchAId={branchId}
          branchBId={compareBranchId}
          onClose={() => setCompareBranchId(null)}
        />
      )}
      </div>
    </FilterProvider>
  );
}
