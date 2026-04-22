#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 1. Extract: Open-Meteo → data/climate/city + all_cities.json ==="
uv run python scripts/get_open_meteo.py -o data/climate/city

echo "=== 2. Upload: all_cities.json → Supabase Storage ==="
supabase storage cp data/climate/all_cities.json ss:///etl-raw/climate/all_cities.json --experimental

echo "=== 3. Transform: all_cities.json → city_monthly.csv ==="
uv run python scripts/transform_climate.py -i data/climate/all_cities.json -o data/climate/city_monthly.csv

echo "=== 4. Generate: city_monthly.csv → public/heatmap/*.json ==="
uv run python scripts/generate_heatmap.py -i data/climate/city_monthly.csv -o ../public/heatmap

echo "=== Done ==="
