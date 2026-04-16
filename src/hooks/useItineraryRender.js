import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-arrowheads';
import { mountCityPinPopup } from '../components/CityPinPopup';

export function useItineraryRender(mapRef, markerLayerRef, lineLayerRef, totalDaysRef, cities, catalogLayerRef, onDestinationTap) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerLayerRef.current.clearLayers();
    lineLayerRef.current.clearLayers();

    cities.forEach((c, i) => {
      // Visible 10px red dot centred inside a transparent 32px hit area,
      // so fingertips actually land on the target.
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:32px;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
        "><div style="
          background: #ef4444;
          width: 10px; height: 10px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        "></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([c.lat, c.lng], { icon, interactive: true, bubblingMouseEvents: false })
        .bindTooltip(`${i + 1}. ${c.name} (${c.days || 1})`, {
          permanent: true,
          direction: 'top',
          offset: [0, -12],
          interactive: true,
        })
        .addTo(markerLayerRef.current);

      const openPopup = () => {
        const content = mountCityPinPopup(
          { id: null, name: c.name, country: c.country },
          {} // view-only: no onAdd, so no red pin button
        );
        const popup = L.popup({
          closeButton: true,
          offset: [0, -6],
          autoPan: true,
          autoPanPadding: [40, 40],
          minWidth: 240,
          maxWidth: 240,
        })
          .setLatLng([c.lat, c.lng])
          .setContent(content);

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
        onDestinationTap?.(c, i);
      };

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        openPopup();
      });

      // Force pointer events on the permanent tooltip (Leaflet's default CSS
      // sets pointer-events:none and interactive:true doesn't always win).
      const tooltipEl = marker.getTooltip()?.getElement();
      if (tooltipEl) {
        tooltipEl.style.pointerEvents = 'auto';
        tooltipEl.style.cursor = 'pointer';
        L.DomEvent.on(tooltipEl, 'click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          openPopup();
        });
      }
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
