"""Generate temperature heatmap PNGs from WorldClim monthly average data.

Usage:
    cd pipeline
    uv run python scripts/generate_heatmap.py --month 1 --out ../docs/heatmap_01.png

First run downloads WorldClim 10-minute resolution data (~5MB zip) and caches it locally.
"""

import argparse
import io
import zipfile
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from PIL import Image

WORLDCLIM_URL = "https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_10m_tavg.zip"
CACHE_DIR = Path(__file__).resolve().parent / ".cache"

TEMP_MIN = -20.0
TEMP_MAX = 40.0

COLORMAP = np.array(
    [
        [0.0, 0.18, 0.53, 0.96],   # -20C  blue
        [0.15, 0.02, 0.71, 0.84],  # -10C  cyan-ish
        [0.33, 0.06, 0.82, 0.56],  #   0C  teal
        [0.50, 0.10, 0.87, 0.33],  #  10C  green
        [0.67, 0.96, 0.81, 0.13],  #  20C  yellow
        [0.83, 0.96, 0.49, 0.08],  #  30C  orange
        [1.0, 0.93, 0.27, 0.27],   #  40C  red
    ]
)


def temp_to_rgba(temp_c: np.ndarray, alpha: int = 140) -> np.ndarray:
    norm = np.clip((temp_c - TEMP_MIN) / (TEMP_MAX - TEMP_MIN), 0, 1)

    positions = COLORMAP[:, 0]
    r_vals = COLORMAP[:, 1]
    g_vals = COLORMAP[:, 2]
    b_vals = COLORMAP[:, 3]

    r = np.interp(norm, positions, r_vals)
    g = np.interp(norm, positions, g_vals)
    b = np.interp(norm, positions, b_vals)

    rgba = np.zeros((*temp_c.shape, 4), dtype=np.uint8)
    rgba[..., 0] = (r * 255).astype(np.uint8)
    rgba[..., 1] = (g * 255).astype(np.uint8)
    rgba[..., 2] = (b * 255).astype(np.uint8)
    rgba[..., 3] = np.where(np.isnan(temp_c), 0, alpha).astype(np.uint8)

    return rgba


def load_worldclim_month(month: int, target_h: int = 36, target_w: int = 72) -> np.ndarray:
    cache_zip = CACHE_DIR / "wc2.1_10m_tavg.zip"

    if not cache_zip.exists():
        print(f"Downloading WorldClim data...")
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with urlopen(WORLDCLIM_URL) as resp:
            cache_zip.write_bytes(resp.read())
        print(f"Cached: {cache_zip} ({cache_zip.stat().st_size // 1024} KB)")

    tif_name = f"wc2.1_10m_tavg_{month:02d}.tif"
    with zipfile.ZipFile(cache_zip) as zf:
        with zf.open(tif_name) as f:
            img = Image.open(io.BytesIO(f.read()))
            data = np.array(img, dtype=np.float32)

    mask = data < -999
    data[mask] = 0.0

    from scipy.ndimage import zoom
    scale_h = target_h / data.shape[0]
    scale_w = target_w / data.shape[1]
    resampled = zoom(data, (scale_h, scale_w), order=1)

    mask_resampled = zoom(mask.astype(np.float32), (scale_h, scale_w), order=0) > 0.5
    resampled[mask_resampled] = np.nan

    return resampled


def main():
    parser = argparse.ArgumentParser(description="Generate temperature heatmap PNG")
    parser.add_argument("--month", type=int, required=True, help="Month (1-12)")
    parser.add_argument("--out", type=str, default="heatmap.png", help="Output PNG path")
    args = parser.parse_args()

    print(f"Loading WorldClim month={args.month}...")
    data = load_worldclim_month(args.month)
    print(f"Grid shape: {data.shape}, range: {np.nanmin(data):.1f}C to {np.nanmax(data):.1f}C")

    rgba = temp_to_rgba(data)
    img = Image.fromarray(rgba, "RGBA")

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(out_path), optimize=True)
    print(f"Saved: {out_path} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
