import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CATALOG } from '../data/cities';

// Fix default marker icons broken by Vite asset handling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

/**
 * Calculate bearing in degrees from point A to point B.
 */
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

export function Map({ cities, onCitySelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const lineLayerRef = useRef(null);
  const catalogLayerRef = useRef(null);

  // Init map once
  useEffect(() => {
    const map = L.map(containerRef.current).setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    lineLayerRef.current = L.layerGroup().addTo(map);
    catalogLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => map.remove();
  }, []);

  // Render catalog dots (only once — onCitySelect ref handles dynamic callback)
  const onCitySelectRef = useRef(onCitySelect);
  useEffect(() => { onCitySelectRef.current = onCitySelect; }, [onCitySelect]);

  useEffect(() => {
    const catalog = catalogLayerRef.current;
    catalog.clearLayers();
    CATALOG.forEach(([name, lat, lng]) => {
      const dot = L.circleMarker([lat, lng], {
        radius: 5, color: '#555', weight: 1,
        fillColor: '#bbb', fillOpacity: 0.85,
        interactive: true, bubblingMouseEvents: false,
      });
      dot.bindTooltip(name, { direction: 'top' });
      dot.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onCitySelectRef.current({ name, lat, lng });
      });
      dot.addTo(catalog);
    });
  }, []);

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

      // Draw arrowheads at the midpoint of each segment using DivIcon
      for (let i = 0; i < cities.length - 1; i++) {
        const a = cities[i];
        const b = cities[i + 1];
        const midLat = (a.lat + b.lat) / 2;
        const midLng = (a.lng + b.lng) / 2;
        const angle = bearing(a.lat, a.lng, b.lat, b.lng);

        const arrowIcon = L.divIcon({
          className: '',
          html: `<div style="
            color: #ef4444;
            font-size: 18px;
            line-height: 1;
            transform: rotate(${angle - 90}deg);
            transform-origin: center center;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          ">&#9654;</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        L.marker([midLat, midLng], { icon: arrowIcon, interactive: false })
          .addTo(lineLayerRef.current);
      }
    }

    if (cities.length === 1) {
      map.setView([cities[0].lat, cities[0].lng], 5);
    } else if (cities.length > 1) {
      map.fitBounds(L.latLngBounds(cities.map(c => [c.lat, c.lng])), { padding: [40, 40] });
    }

    // Keep catalog dots on top
    catalogLayerRef.current.eachLayer(l => l.bringToFront?.());
  }, [cities]);

  return <div ref={containerRef} style={{ flex: '1 1 65%', minHeight: 300 }} />;
}
