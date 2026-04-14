import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCatalogLoader } from '../hooks/useCatalogLoader';
import { useItineraryRender } from '../hooks/useItineraryRender';

// Fix default marker icons broken by Vite asset handling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

export function Map({ cities, onCitySelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const lineLayerRef = useRef(null);
  const catalogLayerRef = useRef(null);
  const onCitySelectRef = useRef(onCitySelect);
  const totalDaysRef = useRef(null);

  useEffect(() => { onCitySelectRef.current = onCitySelect; }, [onCitySelect]);

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
        div.style.cssText = 'background:#fff;padding:6px 12px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.15);font-size:14px;font-weight:700;color:#ef4444;margin:10px;';
        div.innerHTML = '0 days';
        totalDaysRef.current = div;
        return div;
      },
    });
    new TotalDays({ position: 'topright' }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Center on first destination once cities are loaded
  const initialViewSetRef = useRef(false);
  useEffect(() => {
    if (initialViewSetRef.current) return;
    if (!cities || cities.length === 0) return;
    if (!mapRef.current) return;
    initialViewSetRef.current = true;
    const first = cities[0];
    mapRef.current.invalidateSize();
    mapRef.current.setView([first.lat, first.lng], 5);
  }, [cities]);

  useCatalogLoader(mapRef, catalogLayerRef, onCitySelectRef);
  useItineraryRender(mapRef, markerLayerRef, lineLayerRef, totalDaysRef, cities, catalogLayerRef);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
