export function buildHotelUrl(city, checkin, checkout, filters = {}) {
  const params = new URLSearchParams({
    ss: city,
    checkin,
    checkout,
    group_adults: '2',
    no_rooms: '1',
  });

  const nflt = [];
  if (filters.budget) nflt.push(`pri=${filters.budget}`);
  if (filters.rating) nflt.push(`review_score=${filters.rating}`);
  if (nflt.length) params.set('nflt', nflt.join(';'));

  return `https://www.booking.com/searchresults.html?${params}`;
}

export function buildFlightUrl(from, to, date) {
  const params = new URLSearchParams({ q: `${from} to ${to}` });
  if (date) params.set('d1', date);
  return `https://www.google.com/travel/flights?${params}`;
}

export function buildTrainUrl(from, to, date) {
  const params = new URLSearchParams({ from, to });
  if (date) params.set('departure_date', date);
  return `https://www.omio.com/search?${params}`;
}

export function buildBusUrl(from, to, date) {
  return buildTrainUrl(from, to, date);
}
