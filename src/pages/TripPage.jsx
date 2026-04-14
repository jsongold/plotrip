import { useState, useEffect } from 'react';
import { Map } from '../components/Map';
import { Toolbar } from '../components/Toolbar';
import { CityList } from '../components/CityList';
import { BranchBar } from '../components/BranchBar';
import { PasswordGate } from '../components/PasswordGate';
import { DestinationSheet } from '../components/DestinationSheet';
import { useBranch } from '../hooks/useBranch';
import { loadTrip, isProtected, isUnlocked, getDefaultBranchId } from '../hooks/useTrip';
import { useTripHandlers } from '../hooks/useTripHandlers';

export function TripPage({ tripId, branchId, navigate, replace }) {
  const [trip, setTrip] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  const { cities, loading: citiesLoading, addCity, removeCity, reorderCity, updateDays, clearCities } =
    useBranch(branchId, branches);
  const [status, setStatus] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const startDate = trip?.start_date || null;

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
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      {/* Layer 1: Map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <Map
          cities={cities}
          onCitySelect={handleAdd}
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
            />
          </div>
        }
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 80px', minHeight: 0 }}>
          <CityList cities={cities} onRemove={handleRemove} onReorder={reorderCity} onDaysChange={updateDays} onFork={handleFork} startDate={startDate} onStartDateChange={handleStartDateChange} />
        </div>
      </DestinationSheet>

      {/* Layer 3: Search bar (always on top) */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          title="Show destinations"
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            bottom: 'calc(70px + env(safe-area-inset-bottom))',
            zIndex: 500,
            width: 36, height: 36, borderRadius: '50%',
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            color: '#333',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
          }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <ellipse cx="12" cy="12" rx="4" ry="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      )}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        zIndex: 500, padding: '0 16px',
      }}>
        <Toolbar onAdd={handleAdd} status={status} />
      </div>
    </div>
  );
}
