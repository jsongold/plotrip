export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function ordinal(n) {
  if (n % 100 >= 11 && n % 100 <= 13) return n + 'th';
  switch (n % 10) {
    case 1: return n + 'st';
    case 2: return n + 'nd';
    case 3: return n + 'rd';
    default: return n + 'th';
  }
}

export function calcDateObj(cities, index, startDate) {
  if (!startDate) return null;
  const d = new Date(startDate + 'T00:00:00');
  for (let i = 0; i < index; i++) {
    d.setDate(d.getDate() + (cities[i].days || 1));
  }
  return d;
}

export function formatDate(d) {
  if (!d) return '';
  return `${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}`;
}

export function toIso(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
