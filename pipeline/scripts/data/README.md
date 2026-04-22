# ETL Data Files

## `ne_50m_land.geojson`

Natural Earth 1:50m **land** polygons — a global coastline FeatureCollection used by `scripts/etl/climate-shapes.mjs` to clip per-city 30km circle buffers to land.

- **Source:** https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_land.geojson
- **Upstream:** https://www.naturalearthdata.com/downloads/50m-physical-vectors/ (1:50m Physical → Land)
- **License:** Public domain (Natural Earth). No attribution required.
- **Size:** ~4 MB raw, ~1.5 MB gzipped.

### Re-download

```sh
curl -L -o scripts/etl/data/ne_50m_land.geojson \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson
```

### Upgrade to 10m

If a coastal city's shape looks too blocky (e.g. Tokyo Bay, Hong Kong harbor),
consider adding `ne_10m_land.geojson` (~25 MB; use `git lfs`) and switching the
ETL to read it for selected cities.
