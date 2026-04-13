import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';

// Fix default marker icons broken by Vite asset handling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

function bearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

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
      L.circleMarker([c.lat, c.lng], {
        radius: 8,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.9,
        weight: 2,
      })
        .bindTooltip(`${i + 1}. ${c.name}`, { permanent: true, direction: 'top', offset: [0, -10] })
        .addTo(markerLayerRef.current);
    });

    if (cities.length >= 2) {
      const latlngs = cities.map(c => [c.lat, c.lng]);
      L.polyline(latlngs, { color: '#ef4444', weight: 3, opacity: 0.8 })
        .addTo(lineLayerRef.current);

      for (let i = 0; i < cities.length - 1; i++) {
        const a = cities[i];
        const b = cities[i + 1];
        const angle = bearing(a.lat, a.lng, b.lat, b.lng);

        const makeArrow = (lat, lng) => {
          const icon = L.divIcon({
            className: '',
            html: `<svg width="16" height="16" viewBox="0 0 24 24" style="transform:rotate(${angle}deg);pointer-events:none;">
              <path d="M5,12 L19,12 M13,6 L19,12 L13,18" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          return L.marker([lat, lng], { icon, interactive: false });
        };

        // Arrow near the destination (80% along the segment)
        const endLat = a.lat + (b.lat - a.lat) * 0.8;
        const endLng = a.lng + (b.lng - a.lng) * 0.8;
        makeArrow(endLat, endLng).addTo(lineLayerRef.current);
      }
    }

    if (cities.length === 1) {
      map.setView([cities[0].lat, cities[0].lng], 5);
    } else if (cities.length > 1) {
      map.fitBounds(L.latLngBounds(cities.map(c => [c.lat, c.lng])), { padding: [40, 40] });
    }

    catalogLayerRef.current.eachLayer(l => l.bringToFront?.());
  }, [cities]);

  return <div ref={containerRef} style={{ flex: '1 1 65%', minHeight: 300 }} />;
}
