import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-arrowheads';
import { mountCityPinPopup } from '../components/CityPinPopup';

function near(a, b) { return Math.abs(a - b) < 0.01; }

function overlapsEarlier(cities, index) {
  const a = cities[index], b = cities[index + 1];
  for (let j = 0; j < index; j++) {
    const c = cities[j], d = cities[j + 1];
    if ((near(a.lat, c.lat) && near(a.lng, c.lng) && near(b.lat, d.lat) && near(b.lng, d.lng)) ||
        (near(a.lat, d.lat) && near(a.lng, d.lng) && near(b.lat, c.lat) && near(b.lng, c.lng))) {
      return true;
    }
  }
  return false;
}

function curvedPath(from, to, n = 12) {
  const dLat = to.lat - from.lat, dLng = to.lng - from.lng;
  const len = Math.sqrt(dLat * dLat + dLng * dLng);
  if (len === 0) return [[from.lat, from.lng], [to.lat, to.lng]];
  const off = len * 0.15;
  const cLat = (from.lat + to.lat) / 2 + (-dLng / len) * off;
  const cLng = (from.lng + to.lng) / 2 + (dLat / len) * off;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      (1 - t) * (1 - t) * from.lat + 2 * (1 - t) * t * cLat + t * t * to.lat,
      (1 - t) * (1 - t) * from.lng + 2 * (1 - t) * t * cLng + t * t * to.lng,
    ]);
  }
  return pts;
}

export function useItineraryRender(mapRef, markerLayerRef, lineLayerRef, totalDaysRef, cities, catalogLayerRef, onCitySelectRef, onSuggestRef) {
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
        const onSuggest = (option) => {
          onSuggestRef?.current?.({ id: null, name: c.name, country: c.country, lat: c.lat, lng: c.lng, option });
        };
        const onAdd = () => {
          onCitySelectRef?.current?.({ name: c.name, lat: c.lat, lng: c.lng, country: c.country });
          try { map.closePopup(); } catch {}
        };
        const content = mountCityPinPopup(
          { id: null, name: c.name, country: c.country, lat: c.lat, lng: c.lng },
          { onAdd, onSuggest }
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
        const a = cities[i];
        const b = cities[i + 1];
        const segment = overlapsEarlier(cities, i)
          ? curvedPath(a, b)
          : [[a.lat, a.lng], [b.lat, b.lng]];
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
