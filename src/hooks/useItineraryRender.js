import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-arrowheads';

export function useItineraryRender(mapRef, markerLayerRef, lineLayerRef, totalDaysRef, cities, catalogLayerRef) {
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


    if (catalogLayerRef?.current) {
      catalogLayerRef.current.eachLayer(l => l.bringToFront?.());
    }

    // Update total days
    if (totalDaysRef.current) {
      const total = cities.reduce((sum, c) => sum + (c.days || 1), 0);
      totalDaysRef.current.innerHTML = `${total} days`;
    }
  }, [cities, mapRef, markerLayerRef, lineLayerRef, totalDaysRef, catalogLayerRef]);
}
