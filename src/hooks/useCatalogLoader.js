import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { supabase } from '../lib/supabase';

// Min population thresholds by zoom level
export function minPopForZoom(zoom) {
  if (zoom >= 12) return 0;
  if (zoom >= 10) return 500;
  if (zoom >= 8) return 5000;
  if (zoom >= 6) return 20000;
  if (zoom >= 4) return 100000;
  return 500000;
}

export function useCatalogLoader(mapRef, catalogLayerRef, onCitySelectRef) {
  const loadTimerRef = useRef(null);
  const abortRef = useRef(null);

  const loadCatalog = useCallback(async (map) => {
    if (!map) return;

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const minPop = minPopForZoom(zoom);

    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    let query = supabase
      .from('catalog_cities')
      .select('name,lat,lng,country')
      .gte('lat', south)
      .lte('lat', north)
      .gte('lng', west)
      .lte('lng', east)
      .gte('population', minPop)
      .order('population', { ascending: false })
      .limit(500);

    const { data, error } = await query;
    if (controller.signal.aborted || error) return;

    const catalog = catalogLayerRef.current;
    catalog.clearLayers();

    (data || []).forEach(({ name, lat, lng, country }) => {
      const dot = L.circleMarker([lat, lng], {
        radius: 3, color: '#888', weight: 1,
        fillColor: '#aaa', fillOpacity: 0.7,
        interactive: true, bubblingMouseEvents: false,
      });
      dot.bindTooltip(country ? `${name}, ${country}` : name, { direction: 'top' });
      dot.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onCitySelectRef.current({ name, lat, lng, country });
      });
      dot.addTo(catalog);
    });
  }, [catalogLayerRef, onCitySelectRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function onMoveEnd() {
      clearTimeout(loadTimerRef.current);
      loadTimerRef.current = setTimeout(() => loadCatalog(map), 300);
    }
    map.on('moveend', onMoveEnd);
    map.on('zoomend', onMoveEnd);

    // Initial load
    loadCatalog(map);

    return () => {
      map.off('moveend', onMoveEnd);
      map.off('zoomend', onMoveEnd);
    };
  }, [mapRef, loadCatalog]);

  return loadCatalog;
}
