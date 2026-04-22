import { useState, useEffect } from 'react';
import { Map } from '../components/Map';
import { SearchBar } from '../components/SearchBar';
import { CityList } from '../components/CityList';
import { BranchBar } from '../components/BranchBar';
import { PasswordGate } from '../components/PasswordGate';
import { DestinationSheet } from '../components/DestinationSheet';
import { DestinationToggle } from '../components/DestinationToggle';
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
import { LabelToggle } from '../components/LabelToggle';
import { MapIconBar } from '../components/MapIconBar';

export function TripPage({ tripId, branchId, navigate, replace }) {
  const [trip, setTrip] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  const { cities, loading: citiesLoading, addCity, removeCity, reorderCity, updateDays, clearCities } =
    useBranch(branchId, branches);
  const [status, setStatus] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
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
              cities={cities}
              startDate={startDate}
            />
          </div>
        }
      >
        <div style={{ padding: '8px 16px 100px' }}>
          <CityList cities={cities} onRemove={handleRemove} onReorder={reorderCity} onDaysChange={updateDays} onFork={handleFork} startDate={startDate} onStartDateChange={handleStartDateChange} onCityTap={handleCityTap} />
        </div>
      </DestinationSheet>

      {/* Layer 3: Search bar (always on top, fixed to viewport) */}
      <SearchBar onAdd={(city) => setPreviewCity({ ...city, _tick: Date.now() })} status={status} />
      <ItinerarySuggestionSheet
        open={itGenOpen}
        onOpenChange={setItGenOpen}
        generating={generating}
        error={genError}
        onGenerate={async (filters, opts) => {
          await generate(filters, opts);
        }}
      />
      <MapIconBar>
        <FilterBar />
        <DestinationToggle count={cities.length} onClick={() => setPanelOpen((v) => !v)} />
        <LabelToggle active={showTooltips} onClick={() => setShowTooltips((v) => !v)} />
      </MapIconBar>

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
