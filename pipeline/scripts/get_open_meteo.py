"""Fetch daily weather from Open-Meteo archive API for climate seed cities.

Downloads 5-year daily data per city and saves as individual JSON files.

Usage:
    cd pipeline
    uv run python scripts/get_open_meteo.py -o data/climate/city
"""

import argparse
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from urllib.request import Request, urlopen

ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
YEARS_BACK = 1
SLEEP_SEC = 1.0

CITIES = [
    {"name": "Reykjavik", "lat": 64.15, "lng": -21.94},
    {"name": "Tromsø", "lat": 69.65, "lng": 18.96},
    {"name": "Helsinki", "lat": 60.17, "lng": 24.94},
    {"name": "Stockholm", "lat": 59.33, "lng": 18.07},
    {"name": "Oslo", "lat": 59.91, "lng": 10.75},
    {"name": "Moscow", "lat": 55.76, "lng": 37.62},
    {"name": "London", "lat": 51.51, "lng": -0.13},
    {"name": "Dublin", "lat": 53.35, "lng": -6.26},
    {"name": "Paris", "lat": 48.86, "lng": 2.35},
    {"name": "Berlin", "lat": 52.52, "lng": 13.41},
    {"name": "Warsaw", "lat": 52.23, "lng": 21.01},
    {"name": "Madrid", "lat": 40.42, "lng": -3.70},
    {"name": "Lisbon", "lat": 38.72, "lng": -9.14},
    {"name": "Rome", "lat": 41.90, "lng": 12.50},
    {"name": "Athens", "lat": 37.98, "lng": 23.73},
    {"name": "Istanbul", "lat": 41.01, "lng": 28.98},
    {"name": "Bucharest", "lat": 44.43, "lng": 26.10},
    {"name": "Kyiv", "lat": 50.45, "lng": 30.52},
    {"name": "Split", "lat": 43.51, "lng": 16.44},
    {"name": "Zurich", "lat": 47.38, "lng": 8.54},
    {"name": "Cairo", "lat": 30.04, "lng": 31.24},
    {"name": "Marrakech", "lat": 31.63, "lng": -8.00},
    {"name": "Tunis", "lat": 36.81, "lng": 10.17},
    {"name": "Algiers", "lat": 36.75, "lng": 3.04},
    {"name": "Tripoli", "lat": 32.90, "lng": 13.18},
    {"name": "Tehran", "lat": 35.69, "lng": 51.39},
    {"name": "Baghdad", "lat": 33.31, "lng": 44.37},
    {"name": "Riyadh", "lat": 24.71, "lng": 46.68},
    {"name": "Dubai", "lat": 25.20, "lng": 55.27},
    {"name": "Muscat", "lat": 23.59, "lng": 58.54},
    {"name": "Amman", "lat": 31.95, "lng": 35.93},
    {"name": "Tel Aviv", "lat": 32.09, "lng": 34.78},
    {"name": "Dakar", "lat": 14.69, "lng": -17.44},
    {"name": "Bamako", "lat": 12.64, "lng": -8.00},
    {"name": "Lagos", "lat": 6.52, "lng": 3.38},
    {"name": "Accra", "lat": 5.56, "lng": -0.19},
    {"name": "Kinshasa", "lat": -4.44, "lng": 15.27},
    {"name": "Nairobi", "lat": -1.29, "lng": 36.82},
    {"name": "Addis Ababa", "lat": 9.02, "lng": 38.75},
    {"name": "Dar es Salaam", "lat": -6.79, "lng": 39.28},
    {"name": "Luanda", "lat": -8.84, "lng": 13.23},
    {"name": "Harare", "lat": -17.83, "lng": 31.05},
    {"name": "Johannesburg", "lat": -26.20, "lng": 28.05},
    {"name": "Cape Town", "lat": -33.92, "lng": 18.42},
    {"name": "Maputo", "lat": -25.97, "lng": 32.57},
    {"name": "Antananarivo", "lat": -18.88, "lng": 47.51},
    {"name": "Khartoum", "lat": 15.50, "lng": 32.56},
    {"name": "Niamey", "lat": 13.51, "lng": 2.11},
    {"name": "Douala", "lat": 4.05, "lng": 9.77},
    {"name": "Windhoek", "lat": -22.56, "lng": 17.08},
    {"name": "Mumbai", "lat": 19.08, "lng": 72.88},
    {"name": "Delhi", "lat": 28.61, "lng": 77.21},
    {"name": "Kolkata", "lat": 22.57, "lng": 88.36},
    {"name": "Chennai", "lat": 13.08, "lng": 80.27},
    {"name": "Karachi", "lat": 24.86, "lng": 67.01},
    {"name": "Lahore", "lat": 31.55, "lng": 74.35},
    {"name": "Dhaka", "lat": 23.81, "lng": 90.41},
    {"name": "Colombo", "lat": 6.93, "lng": 79.85},
    {"name": "Kathmandu", "lat": 27.72, "lng": 85.32},
    {"name": "Tashkent", "lat": 41.30, "lng": 69.28},
    {"name": "Almaty", "lat": 43.24, "lng": 76.95},
    {"name": "Astana", "lat": 51.17, "lng": 71.43},
    {"name": "Bishkek", "lat": 42.87, "lng": 74.59},
    {"name": "Ulaanbaatar", "lat": 47.89, "lng": 106.91},
    {"name": "Tokyo", "lat": 35.68, "lng": 139.65},
    {"name": "Osaka", "lat": 34.69, "lng": 135.50},
    {"name": "Sapporo", "lat": 43.06, "lng": 141.35},
    {"name": "Seoul", "lat": 37.57, "lng": 126.98},
    {"name": "Beijing", "lat": 39.90, "lng": 116.40},
    {"name": "Shanghai", "lat": 31.23, "lng": 121.47},
    {"name": "Hong Kong", "lat": 22.40, "lng": 114.11},
    {"name": "Taipei", "lat": 25.03, "lng": 121.57},
    {"name": "Guangzhou", "lat": 23.13, "lng": 113.26},
    {"name": "Chengdu", "lat": 30.57, "lng": 104.07},
    {"name": "Harbin", "lat": 45.75, "lng": 126.65},
    {"name": "Urumqi", "lat": 43.83, "lng": 87.62},
    {"name": "Lhasa", "lat": 29.65, "lng": 91.11},
    {"name": "Bangkok", "lat": 13.76, "lng": 100.50},
    {"name": "Ho Chi Minh City", "lat": 10.82, "lng": 106.63},
    {"name": "Hanoi", "lat": 21.03, "lng": 105.85},
    {"name": "Singapore", "lat": 1.35, "lng": 103.82},
    {"name": "Jakarta", "lat": -6.21, "lng": 106.85},
    {"name": "Denpasar", "lat": -8.67, "lng": 115.21},
    {"name": "Manila", "lat": 14.60, "lng": 120.98},
    {"name": "Kuala Lumpur", "lat": 3.14, "lng": 101.69},
    {"name": "Yangon", "lat": 16.87, "lng": 96.20},
    {"name": "Phnom Penh", "lat": 11.56, "lng": 104.92},
    {"name": "Novosibirsk", "lat": 55.01, "lng": 82.93},
    {"name": "Yakutsk", "lat": 62.04, "lng": 129.74},
    {"name": "Vladivostok", "lat": 43.12, "lng": 131.87},
    {"name": "Irkutsk", "lat": 52.29, "lng": 104.30},
    {"name": "Murmansk", "lat": 68.97, "lng": 33.09},
    {"name": "Yekaterinburg", "lat": 56.84, "lng": 60.60},
    {"name": "Krasnoyarsk", "lat": 56.01, "lng": 92.87},
    {"name": "Petropavlovsk-Kamchatsky", "lat": 53.04, "lng": 158.65},
    {"name": "Magadan", "lat": 59.56, "lng": 150.80},
    {"name": "New York", "lat": 40.71, "lng": -74.01},
    {"name": "Los Angeles", "lat": 34.05, "lng": -118.24},
    {"name": "Chicago", "lat": 41.88, "lng": -87.63},
    {"name": "Toronto", "lat": 43.65, "lng": -79.38},
    {"name": "Vancouver", "lat": 49.28, "lng": -123.12},
    {"name": "Mexico City", "lat": 19.43, "lng": -99.13},
    {"name": "Miami", "lat": 25.76, "lng": -80.19},
    {"name": "Houston", "lat": 29.76, "lng": -95.37},
    {"name": "Denver", "lat": 39.74, "lng": -104.98},
    {"name": "Phoenix", "lat": 33.45, "lng": -112.07},
    {"name": "Seattle", "lat": 47.61, "lng": -122.33},
    {"name": "Montreal", "lat": 45.50, "lng": -73.57},
    {"name": "Anchorage", "lat": 61.22, "lng": -149.90},
    {"name": "Fairbanks", "lat": 64.84, "lng": -147.72},
    {"name": "Winnipeg", "lat": 49.90, "lng": -97.14},
    {"name": "Havana", "lat": 23.11, "lng": -82.37},
    {"name": "Guatemala City", "lat": 14.63, "lng": -90.51},
    {"name": "San José", "lat": 9.93, "lng": -84.08},
    {"name": "Panama City", "lat": 8.98, "lng": -79.52},
    {"name": "Kingston", "lat": 18.00, "lng": -76.79},
    {"name": "Santo Domingo", "lat": 18.47, "lng": -69.90},
    {"name": "São Paulo", "lat": -23.55, "lng": -46.63},
    {"name": "Buenos Aires", "lat": -34.60, "lng": -58.38},
    {"name": "Lima", "lat": -12.05, "lng": -77.04},
    {"name": "Bogotá", "lat": 4.71, "lng": -74.07},
    {"name": "Santiago", "lat": -33.45, "lng": -70.67},
    {"name": "Rio de Janeiro", "lat": -22.91, "lng": -43.17},
    {"name": "Quito", "lat": -0.18, "lng": -78.47},
    {"name": "Caracas", "lat": 10.48, "lng": -66.90},
    {"name": "Manaus", "lat": -3.12, "lng": -60.02},
    {"name": "La Paz", "lat": -16.50, "lng": -68.15},
    {"name": "Montevideo", "lat": -34.88, "lng": -56.16},
    {"name": "Ushuaia", "lat": -54.80, "lng": -68.30},
    {"name": "Punta Arenas", "lat": -53.15, "lng": -70.92},
    {"name": "Sydney", "lat": -33.87, "lng": 151.21},
    {"name": "Melbourne", "lat": -37.81, "lng": 144.96},
    {"name": "Perth", "lat": -31.95, "lng": 115.86},
    {"name": "Brisbane", "lat": -27.47, "lng": 153.03},
    {"name": "Darwin", "lat": -12.46, "lng": 130.84},
    {"name": "Auckland", "lat": -36.85, "lng": 174.76},
    {"name": "Wellington", "lat": -41.29, "lng": 174.78},
    {"name": "Christchurch", "lat": -43.53, "lng": 172.64},
    {"name": "Suva", "lat": -18.14, "lng": 178.44},
    {"name": "Port Moresby", "lat": -9.44, "lng": 147.18},
    {"name": "Noumea", "lat": -22.28, "lng": 166.46},
    {"name": "Honolulu", "lat": 21.31, "lng": -157.86},
    {"name": "Papeete", "lat": -17.53, "lng": -149.57},
    {"name": "Nuuk", "lat": 64.18, "lng": -51.72},
    {"name": "Longyearbyen", "lat": 78.22, "lng": 15.63},
    {"name": "Barrow", "lat": 71.29, "lng": -156.79},
    {"name": "Yellowknife", "lat": 62.45, "lng": -114.37},
    {"name": "Whitehorse", "lat": 60.72, "lng": -135.06},
    {"name": "Iqaluit", "lat": 63.75, "lng": -68.52},
    {"name": "Las Palmas", "lat": 28.10, "lng": -15.41},
    {"name": "Funchal", "lat": 32.65, "lng": -16.91},
    {"name": "Praia", "lat": 14.93, "lng": -23.51},
    {"name": "Reunion", "lat": -21.12, "lng": 55.53},
    {"name": "Mauritius", "lat": -20.16, "lng": 57.50},
    {"name": "Seychelles", "lat": -4.68, "lng": 55.49},
    {"name": "Maldives", "lat": 4.17, "lng": 73.51},
    {"name": "Guam", "lat": 13.44, "lng": 144.79},
    {"name": "Naha", "lat": 26.33, "lng": 127.80},
    {"name": "Palau", "lat": 7.51, "lng": 134.58},
    {"name": "Omsk", "lat": 54.99, "lng": 73.37},
    {"name": "Tomsk", "lat": 56.50, "lng": 84.97},
    {"name": "Tbilisi", "lat": 41.69, "lng": 44.80},
    {"name": "Baku", "lat": 40.41, "lng": 49.87},
    {"name": "Kabul", "lat": 34.53, "lng": 69.17},
    {"name": "Islamabad", "lat": 33.69, "lng": 73.04},
    {"name": "Kunming", "lat": 25.04, "lng": 102.71},
    {"name": "Norilsk", "lat": 69.35, "lng": 88.20},
    {"name": "Alice Springs", "lat": -23.70, "lng": 133.88},
    {"name": "Edmonton", "lat": 53.55, "lng": -113.49},
    {"name": "Brasilia", "lat": -15.79, "lng": -47.88},
    {"name": "Aswan", "lat": 24.09, "lng": 32.90},
    {"name": "Timbuktu", "lat": 16.77, "lng": -3.01},
    {"name": "N'Djamena", "lat": 12.13, "lng": 15.06},
    {"name": "Bangui", "lat": 4.36, "lng": 18.56},
    {"name": "Lusaka", "lat": -15.39, "lng": 28.32},
    {"name": "Gaborone", "lat": -24.66, "lng": 25.91},
    {"name": "Ulan-Ude", "lat": 51.83, "lng": 107.59},
    {"name": "Chita", "lat": 52.03, "lng": 113.50},
    {"name": "Anadyr", "lat": 64.73, "lng": 177.51},
    {"name": "Tiksi", "lat": 71.64, "lng": 128.87},
    {"name": "Verkhoyansk", "lat": 67.55, "lng": 133.39},
    {"name": "Churchill", "lat": 58.77, "lng": -94.17},
    {"name": "Resolute", "lat": 74.70, "lng": -94.97},
    {"name": "Alert", "lat": 82.50, "lng": -62.35},
    {"name": "McMurdo Station", "lat": -77.85, "lng": 166.67},
    {"name": "Rothera", "lat": -67.57, "lng": -68.13},
    {"name": "Vostok Station", "lat": -78.46, "lng": 106.84},
]


def slug(name):
    import unicodedata
    normalized = unicodedata.normalize("NFKD", name)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    return ascii_only.lower().replace("'", "").replace(" ", "-").strip("-")


def fetch_city(city):
    end = datetime.now() - timedelta(days=7)
    start = end.replace(year=end.year - YEARS_BACK)
    url = (
        f"{ARCHIVE}?latitude={city['lat']}&longitude={city['lng']}"
        f"&start_date={start.strftime('%Y-%m-%d')}&end_date={end.strftime('%Y-%m-%d')}"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=UTC"
    )
    req = Request(url, headers={"User-Agent": "plotrip-etl/1.0"})
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-o", "--outdir", required=True, help="Output directory for raw JSON files")
    parser.add_argument("--city", help="Fetch single city by name")
    args = parser.parse_args()

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    targets = CITIES
    if args.city:
        targets = [c for c in CITIES if c["name"].lower() == args.city.lower()]
        if not targets:
            print(f"City not found: {args.city}")
            return

    for i, city in enumerate(targets):
        out_path = outdir / f"{slug(city['name'])}.json"
        if out_path.exists():
            print(f"  [{i+1}/{len(targets)}] {city['name']}: cached")
            continue
        print(f"  [{i+1}/{len(targets)}] {city['name']}...")
        try:
            payload = fetch_city(city)
            payload["_city"] = city
            out_path.write_text(json.dumps(payload))
        except Exception as e:
            print(f"    ERROR: {e}")
        if i < len(targets) - 1:
            time.sleep(SLEEP_SEC)

    merged = []
    for f in sorted(outdir.glob("*.json")):
        merged.append(json.loads(f.read_text()))
    merged_path = outdir.parent / "all_cities.json"
    merged_path.write_text(json.dumps(merged))
    print(f"Merged {len(merged)} cities → {merged_path}")



if __name__ == "__main__":
    main()
