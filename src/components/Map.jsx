import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import 'leaflet-arrowheads';

// Fix default marker icons broken by Vite asset handling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

// Min population thresholds by zoom level
function minPopForZoom(zoom) {
  if (zoom >= 12) return 0;
  if (zoom >= 10) return 500;
  if (zoom >= 8) return 5000;
  if (zoom >= 6) return 20000;
  if (zoom >= 4) return 100000;
  return 500000;
}

export function Map({ cities, onCitySelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const lineLayerRef = useRef(null);
  const catalogLayerRef = useRef(null);
  const onCitySelectRef = useRef(onCitySelect);
  const loadTimerRef = useRef(null);
  const abortRef = useRef(null);
  const totalDaysRef = useRef(null);

  useEffect(() => { onCitySelectRef.current = onCitySelect; }, [onCitySelect]);

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
  }, []);

  // Init map once
  useEffect(() => {
    const map = L.map(containerRef.current).setView([20, 0], 2);
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
        div.style.cssText = 'background:#fff;padding:6px 12px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.15);font-size:14px;font-weight:700;color:#ef4444;';
        div.innerHTML = '0 days';
        totalDaysRef.current = div;
        return div;
      },
    });
    new TotalDays({ position: 'topright' }).addTo(map);

    // Load catalog on map move/zoom with debounce
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
      map.remove();
    };
  }, [loadCatalog]);

  // Update itinerary markers and route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerLayerRef.current.clearLayers();
    lineLayerRef.current.clearLayers();

    cities.forEach((c, i) => {
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background: #ef4444;
          width: 10px; height: 10px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([c.lat, c.lng], { icon, interactive: false })
        .bindTooltip(`${i + 1}. ${c.name} (${c.days || 1})`, { permanent: true, direction: 'top', offset: [0, -8] })
        .addTo(markerLayerRef.current);
    });

    if (cities.length >= 2) {
      for (let i = 0; i < cities.length - 1; i++) {
        const segment = [[cities[i].lat, cities[i].lng], [cities[i + 1].lat, cities[i + 1].lng]];
        L.polyline(segment, { color: '#ef4444', weight: 3, opacity: 0.8 })
          .arrowheads({
            size: '15px',
            frequency: 'endonly',
            yawn: 50,
            fill: true,
            color: '#ef4444',
          })
          .addTo(lineLayerRef.current);
      }
    }

    if (cities.length === 1) {
      map.setView([cities[0].lat, cities[0].lng], 5);
    } else if (cities.length > 1) {
      map.fitBounds(L.latLngBounds(cities.map(c => [c.lat, c.lng])), { padding: [40, 40] });
    }

    catalogLayerRef.current.eachLayer(l => l.bringToFront?.());

    // Update total days
    if (totalDaysRef.current) {
      const total = cities.reduce((sum, c) => sum + (c.days || 1), 0);
      totalDaysRef.current.innerHTML = `${total} days`;
    }
  }, [cities]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
