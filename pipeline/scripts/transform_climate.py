"""Transform: all_cities.json → city_monthly CSV.

Reads raw Open-Meteo payloads, aggregates daily data into monthly normals.

Usage:
    cd pipeline
    uv run python scripts/transform_climate.py -i data/climate/all_cities.json -o data/climate/city_monthly.csv
"""

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path


def aggregate_monthly(daily):
    buckets = defaultdict(lambda: {"highs": [], "lows": [], "precip": []})
    times = daily.get("time", [])
    t_max = daily.get("temperature_2m_max", [])
    t_min = daily.get("temperature_2m_min", [])
    precip = daily.get("precipitation_sum", [])

    for i, date_str in enumerate(times):
        month = int(date_str[5:7])
        b = buckets[month]
        if i < len(t_max) and t_max[i] is not None:
            b["highs"].append(t_max[i])
        if i < len(t_min) and t_min[i] is not None:
            b["lows"].append(t_min[i])
        if i < len(precip) and precip[i] is not None:
            b["precip"].append(precip[i])

    years = set(d[:4] for d in times)
    year_count = len(years) or 1

    rows = []
    for m in range(1, 13):
        b = buckets.get(m)
        if not b:
            continue
        avg_high = round(sum(b["highs"]) / len(b["highs"]), 2) if b["highs"] else None
        avg_low = round(sum(b["lows"]) / len(b["lows"]), 2) if b["lows"] else None
        precip_mm = round(sum(b["precip"]) / year_count, 2)
        rows.append({"month": m, "avg_high_c": avg_high, "avg_low_c": avg_low, "precip_mm": precip_mm})
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", required=True, help="Input JSON path")
    parser.add_argument("-o", "--out", required=True, help="Output CSV path")
    args = parser.parse_args()

    entries = json.loads(Path(args.input).read_text())
    print(f"Loaded {len(entries)} cities")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    written = 0

    with open(out_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["city_name", "lat", "lng", "month", "avg_high_c", "avg_low_c", "precip_mm"])

        for entry in entries:
            city = entry.get("_city", {})
            daily = entry.get("daily")
            if not daily or not daily.get("time"):
                continue

            for m in aggregate_monthly(daily):
                w.writerow([city.get("name", ""), city.get("lat", ""), city.get("lng", ""),
                            m["month"], m["avg_high_c"], m["avg_low_c"], m["precip_mm"]])
                written += 1

    print(f"Wrote {written} rows to {out_path}")


if __name__ == "__main__":
    main()
