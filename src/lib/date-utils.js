import Holidays from 'date-holidays';

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Simple ISO country code map for common country names
const COUNTRY_CODES = {
  'Japan': 'JP', 'United States': 'US', 'USA': 'US', 'United Kingdom': 'GB', 'UK': 'GB',
  'France': 'FR', 'Germany': 'DE', 'Italy': 'IT', 'Spain': 'ES', 'Portugal': 'PT',
  'Netherlands': 'NL', 'Belgium': 'BE', 'Switzerland': 'CH', 'Austria': 'AT',
  'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI', 'Iceland': 'IS',
  'Ireland': 'IE', 'Poland': 'PL', 'Czechia': 'CZ', 'Czech Republic': 'CZ',
  'Hungary': 'HU', 'Greece': 'GR', 'Turkey': 'TR', 'Russia': 'RU',
  'Canada': 'CA', 'Mexico': 'MX', 'Brazil': 'BR', 'Argentina': 'AR', 'Chile': 'CL',
  'Australia': 'AU', 'New Zealand': 'NZ', 'China': 'CN', 'South Korea': 'KR', 'Korea': 'KR',
  'Taiwan': 'TW', 'Hong Kong': 'HK', 'Singapore': 'SG', 'Malaysia': 'MY', 'Thailand': 'TH',
  'Vietnam': 'VN', 'Indonesia': 'ID', 'Philippines': 'PH', 'India': 'IN',
  'Estonia': 'EE', 'Latvia': 'LV', 'Lithuania': 'LT', 'Croatia': 'HR', 'Slovenia': 'SI',
};

const holidaysCache = new Map();
function getHolidays(country) {
  if (!country) return null;
  const code = COUNTRY_CODES[country] || country;
  if (!holidaysCache.has(code)) {
    try {
      holidaysCache.set(code, new Holidays(code));
    } catch {
      holidaysCache.set(code, null);
    }
  }
  return holidaysCache.get(code);
}

export function isHoliday(d, country) {
  if (!d) return false;
  const hd = getHolidays(country);
  if (!hd) return false;
  const result = hd.isHoliday(d);
  if (!result) return false;
  return Array.isArray(result) ? result.some(h => h.type === 'public') : result.type === 'public';
}

export function isWeekend(d) {
  if (!d) return false;
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function formatDayOfWeek(d) {
  if (!d) return '';
  return DAYS[d.getDay()];
}

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
