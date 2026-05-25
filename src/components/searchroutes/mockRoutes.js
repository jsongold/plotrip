import { haversineKm } from '../../lib/distance';

const MODES = [
  { mode: 'flight', label: 'Flight', kmh: 700, perKm: 0.15, base: 80, minHours: 1.5 },
  { mode: 'train', label: 'Train', kmh: 120, perKm: 0.12, base: 25 },
  { mode: 'bus', label: 'Bus', kmh: 70, perKm: 0.06, base: 12 },
  { mode: 'car', label: 'Car', kmh: 90, perKm: 0.08, base: 15 },
];

function formatHours(h) {
  const total = Math.max(1, Math.round(h * 60));
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  if (hh === 0) return `${mm}m`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${mm}m`;
}

export function mockRoutes(from, to) {
  if (!to) return [];
  if (!from) {
    return MODES.map((m) => ({
      mode: m.mode,
      label: m.label,
      hoursLabel: '—',
      priceLabel: '—',
    }));
  }
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  if (!isFinite(km) || km <= 0) return [];
  return MODES.map((m) => {
    const hours = Math.max(m.minHours || 0, km / m.kmh);
    const price = Math.round(km * m.perKm + m.base);
    const eligible = !(m.mode === 'flight' && km < 200) && !(m.mode === 'bus' && km > 1500) && !(m.mode === 'train' && km > 1500);
    return {
      mode: m.mode,
      label: m.label,
      hoursLabel: eligible ? formatHours(hours) : '—',
      priceLabel: eligible ? `$${price}` : '—',
      disabled: !eligible,
    };
  });
}
