import { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import { mountCityPinPopup } from '../components/CityPinPopup';
import { maxPinsForMap } from '../lib/mapDensity';

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
    // 小ドットなので密に置ける (pxPerPin 10000 = 1ドット 100×100 相当に余白)
    const maxPins = maxPinsForMap(map, { pxPerPin: 10000, max: 150, minZoom: 3 });

    const catalog = catalogLayerRef.current;
    if (maxPins <= 0) {
      catalog.clearLayers();
      return;
    }

    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    const { data, error } = await supabase
      .from('catalog_cities')
      .select('id,name,lat,lng,country')
      .gte('lat', south)
      .lte('lat', north)
      .gte('lng', west)
      .lte('lng', east)
      .gte('population', minPop)
      .order('population', { ascending: false })
      .limit(maxPins);
    if (controller.signal.aborted || error) return;

    catalog.clearLayers();

    (data || []).forEach(({ id, name, lat, lng, country }) => {
      const dot = L.circleMarker([lat, lng], {
        radius: 3, color: '#888', weight: 1,
        fillColor: '#aaa', fillOpacity: 0.7,
        interactive: true, bubblingMouseEvents: false,
      });

      const openPopup = () => {
        const onAdd = () => {
          onCitySelectRef.current({ name, lat, lng, country });
          map.closePopup();
        };
        const content = mountCityPinPopup({ id, name, country }, { onAdd });
        const popup = L.popup({
          closeButton: true,
          offset: [0, -6],
          autoPan: true,
          autoPanPadding: [40, 40],
          minWidth: 240,
          maxWidth: 240,
        })
          .setLatLng([lat, lng])
          .setContent(content);

        // Re-run autoPan while content is still loading (thumbnail/text
        // arrive asynchronously). Stops on first user pan so we never yank
        // the map back once they've taken control.
        let ro = null;
        const stopObserving = () => { ro?.disconnect(); ro = null; };
        if (typeof ResizeObserver !== 'undefined') {
          ro = new ResizeObserver(() => { try { popup.update(); } catch {} });
          ro.observe(content);
          map.once('dragstart', stopObserving);
        }
        popup.on('remove', () => {
          stopObserving();
          content._unmount?.();
        });

        popup.openOn(map);
      };

      dot.bindTooltip(country ? `${name}, ${country}` : name, {
        direction: 'top',
      });
      dot.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        openPopup();
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
