"""Generate temperature heatmap JSON from city_monthly CSV.

Reads CSV with (city_name, lat, lng, month, avg_high_c, ...),
interpolates (IDW) onto a 72x36 equirectangular grid, outputs JSON per month.

Usage:
    cd pipeline
    uv run python scripts/generate_heatmap.py -i data/climate/city_monthly.csv -o ../public/heatmap
"""

import argparse
import csv
import json
from pathlib import Path

import numpy as np

GRID_W = 72
GRID_H = 36
IDW_POWER = 2


def idw_interpolate(points, values, grid_lats, grid_lons, power=IDW_POWER):
    pts = np.array(points)
    vals = np.array(values)
    result = np.full((len(grid_lats), len(grid_lons)), np.nan)

    for i in range(len(grid_lats)):
        for j in range(len(grid_lons)):
            dlat = pts[:, 0] - grid_lats[i]
            dlon = pts[:, 1] - grid_lons[j]
            dist = np.sqrt(dlat**2 + dlon**2)

            close = dist < 0.01
            if np.any(close):
                result[i, j] = vals[close][0]
                continue

            weights = 1.0 / dist**power
            result[i, j] = np.sum(weights * vals) / np.sum(weights)

    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", required=True, help="Input CSV path")
    parser.add_argument("-o", "--outdir", default="../public/heatmap", help="Output directory")
    parser.add_argument("--month", type=int, help="Single month (1-12). Omit for all.")
    args = parser.parse_args()

    by_month = {}
    with open(args.input) as f:
        for row in csv.DictReader(f):
            temp = row.get("avg_high_c")
            if not temp:
                continue
            m = int(row["month"])
            if m not in by_month:
                by_month[m] = {"points": [], "values": []}
            by_month[m]["points"].append((float(row["lat"]), float(row["lng"])))
            by_month[m]["values"].append(float(temp))

    print(f"Loaded {sum(len(v['points']) for v in by_month.values())} data points")
    for m in sorted(by_month):
        print(f"  month {m:2d}: {len(by_month[m]['points'])} cities")

    grid_lats = np.linspace(90 - (180.0 / GRID_H / 2), -90 + (180.0 / GRID_H / 2), GRID_H)
    grid_lons = np.linspace(-180 + (360.0 / GRID_W / 2), 180 - (360.0 / GRID_W / 2), GRID_W)

    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    months = [args.month] if args.month else list(range(1, 13))

    for m in months:
        if m not in by_month:
            print(f"  month {m:2d}: no data, skipping")
            continue
        data = by_month[m]
        print(f"  Interpolating month {m:2d}...", end=" ", flush=True)
        grid = idw_interpolate(data["points"], data["values"], grid_lats, grid_lons)
        grid_list = [[None if np.isnan(v) else round(float(v), 1) for v in row] for row in grid]
        out_path = outdir / f"{m:02d}.json"
        out_path.write_text(json.dumps(grid_list, separators=(',', ':')))
        print(f"{out_path} ({out_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
