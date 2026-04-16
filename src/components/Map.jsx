import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCatalogLoader } from '../hooks/useCatalogLoader';
import { useItineraryRender } from '../hooks/useItineraryRender';
import { useFilter } from '../context/FilterContext';
import { getFilter, getLayerFilters } from '../lib/filters/registry';

// Aliased to avoid name collision with the Map component defined below
const NativeMap = globalThis.Map;

// Fix default marker icons broken by Vite asset handling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

export function Map({ cities, onCitySelect, focusRequest, showTooltips = true }) {
  const { activeFilters, month, filterValues } = useFilter();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const lineLayerRef = useRef(null);
  const catalogLayerRef = useRef(null);
  const onCitySelectRef = useRef(onCitySelect);
  const totalDaysRef = useRef(null);
  const citiesRef = useRef(cities);
  const didInitialViewRef = useRef(false);
  const filterLayersRef = useRef(/** @type {Map<string, any>} */ (new NativeMap()));

  useEffect(() => { onCitySelectRef.current = onCitySelect; }, [onCitySelect]);
  useEffect(() => { citiesRef.current = cities; }, [cities]);

  // Init map once
  useEffect(() => {
    // Set initial view based on first city if available, else world
    const firstCity = citiesRef.current?.[0];
    const initialCenter = firstCity ? [firstCity.lat, firstCity.lng] : [20, 0];
    const initialZoom = firstCity ? 5 : 2;
    const map = L.map(containerRef.current).setView(initialCenter, initialZoom);
    if (firstCity) didInitialViewRef.current = true;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    lineLayerRef.current = L.layerGroup().addTo(map);
    catalogLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Total days control (top-right)
    const TotalDays = L.Control.extend({
      onAdd() {
        const div = L.DomUtil.create('div');
        div.style.cssText = 'background:#fff;padding:6px 12px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.15);font-size:14px;font-weight:700;color:#ef4444;margin:10px;';
        div.innerHTML = '0 days';
        totalDaysRef.current = div;
        return div;
      },
    });
    new TotalDays({ position: 'topright' }).addTo(map);

    return () => {
      // Filter layer cleanup
      for (const [, entry] of filterLayersRef.current.entries()) {
        try { entry.cleanup?.(); } catch {}
      }
      filterLayersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Filter layer管理: activeFilters/month/filterValues の変化に追従
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = filterLayersRef.current;
    const allLayerFilters = getLayerFilters();
    const activeLayerSlugs = new Set(
      allLayerFilters.filter((f) => activeFilters.has(f.slug)).map((f) => f.slug)
    );

    // 1) 無効化された layer を cleanup
    for (const [slug, entry] of layers.entries()) {
      if (!activeLayerSlugs.has(slug)) {
        try { entry.cleanup?.(); } catch (e) { /* silent */ }
        try { entry.layerGroup?.remove(); } catch (e) { /* silent */ }
        layers.delete(slug);
      }
    }

    // 2) 新規 active layer を mount (cities は citiesRef.current から取得)
    for (const slug of activeLayerSlugs) {
      const existing = layers.get(slug);
      const def = getFilter(slug);
      if (!def || typeof def.mountLayer !== 'function') continue;

      const currentValue = filterValues.get(slug);

      // dependsOnMonth / dependsOnValue の filter は既存を落として再 mount
      const needsRemount = existing && (
        (def.dependsOnMonth && existing.mountedMonth !== month) ||
        (def.dependsOnValue && existing.mountedValue !== currentValue)
      );
      if (needsRemount) {
        try { existing.cleanup?.(); } catch (e) {}
        try { existing.layerGroup?.remove(); } catch (e) {}
        layers.delete(slug);
      } else if (existing) {
        continue; // すでに mount 済み、再 mount 不要
      }

      const layerGroup = L.layerGroup().addTo(map);
      let cleanup;
      try {
        cleanup = def.mountLayer(map, {
          month,
          value: currentValue,
          cities: citiesRef.current,
          layerGroup,
        });
      } catch (e) {
        console.warn(`[Map] filter ${slug} mountLayer failed:`, e?.message || e);
      }
      layers.set(slug, {
        layerGroup,
        cleanup,
        mountedMonth: month,
        mountedValue: currentValue,
      });
    }
  }, [activeFilters, month, filterValues]);

  // Toggle tooltip visibility via CSS class on container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.toggle('hide-tooltips', !showTooltips);
  }, [showTooltips]);

  // If cities arrive AFTER map init, center on first destination
  useEffect(() => {
    if (didInitialViewRef.current) return;
    if (!cities || cities.length === 0) return;
    const map = mapRef.current;
    if (!map) return;
    didInitialViewRef.current = true;
    const first = cities[0];
    map.invalidateSize();
    map.setView([first.lat, first.lng], 5, { animate: false });
  }, [cities]);

  // Focus map on a city when parent sends a new focusRequest
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusRequest) return;
    const { lat, lng } = focusRequest;
    if (lat == null || lng == null) return;
    map.invalidateSize();
    const targetZoom = Math.max(map.getZoom(), 7);
    map.setView([lat, lng], targetZoom, { animate: true });
  }, [focusRequest]);

  useCatalogLoader(mapRef, catalogLayerRef, onCitySelectRef);
  useItineraryRender(mapRef, markerLayerRef, lineLayerRef, totalDaysRef, cities, catalogLayerRef);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
