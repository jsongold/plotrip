import L from 'leaflet';
import { registerFilter } from '../registry';

const GRID_W = 72;
const GRID_H = 36;
const TEMP_MIN = -20;
const TEMP_MAX = 40;
const OVERLAY_OPACITY = 0.3;
const CELL_LAT = 180 / GRID_H;
const CELL_LNG = 360 / GRID_W;

const STOPS = [
  [0.0, 230, 230, 240],
  [0.33, 40, 100, 220],
  [0.5, 0, 150, 100],
  [0.67, 20, 160, 60],
  [0.83, 230, 100, 10],
  [1.0, 200, 30, 30],
];

function tempToColor(t) {
  const norm = Math.max(0, Math.min(1, (t - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)));
  let i = 0;
  while (i < STOPS.length - 2 && STOPS[i + 1][0] < norm) i++;
  const [p0, r0, g0, b0] = STOPS[i];
  const [p1, r1, g1, b1] = STOPS[i + 1];
  const f = (norm - p0) / (p1 - p0);
  return `rgba(${Math.round(r0 + (r1 - r0) * f)},${Math.round(g0 + (g1 - g0) * f)},${Math.round(b0 + (b1 - b0) * f)},${OVERLAY_OPACITY})`;
}

const cache = new Map();

async function loadGrid(month) {
  if (cache.has(month)) return cache.get(month);
  const pad = String(month).padStart(2, '0');
  const resp = await fetch(`${import.meta.env.BASE_URL}heatmap/${pad}.json`);
  const grid = await resp.json();
  cache.set(month, grid);
  return grid;
}

const TemperatureOverlay = L.Layer.extend({
  initialize(options) {
    L.Util.setOptions(this, options);
    this._grid = options.grid;
  },

  onAdd(map) {
    this._map = map;
    this._canvas = L.DomUtil.create('canvas', 'leaflet-temperature-overlay');
    const pane = map.getPane('overlayPane');
    pane.appendChild(this._canvas);
    this._canvas.style.position = 'absolute';
    this._canvas.style.pointerEvents = 'none';

    this._draw = this._draw.bind(this);
    map.on('moveend', this._draw);
    map.on('zoomend', this._draw);
    map.on('resize', this._draw);
    this._draw();
  },

  onRemove(map) {
    map.off('moveend', this._draw);
    map.off('zoomend', this._draw);
    map.off('resize', this._draw);
    if (this._canvas && this._canvas.parentNode) {
      this._canvas.parentNode.removeChild(this._canvas);
    }
    this._canvas = null;
  },

  _draw() {
    const map = this._map;
    if (!map || !this._canvas) return;

    const size = map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;

    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);

    const ctx = this._canvas.getContext('2d');
    ctx.clearRect(0, 0, size.x, size.y);

    const grid = this._grid;
    for (let r = 0; r < GRID_H; r++) {
      for (let c = 0; c < GRID_W; c++) {
        const temp = grid[r][c];
        if (temp == null) continue;

        const latN = 90 - r * CELL_LAT;
        const latS = 90 - (r + 1) * CELL_LAT;
        const lngW = -180 + c * CELL_LNG;
        const lngE = -180 + (c + 1) * CELL_LNG;

        const nw = map.latLngToContainerPoint([latN, lngW]);
        const se = map.latLngToContainerPoint([latS, lngE]);

        const x = nw.x;
        const y = nw.y;
        const w = se.x - nw.x;
        const h = se.y - nw.y;

        if (x + w < 0 || x > size.x || y + h < 0 || y > size.y) continue;

        ctx.fillStyle = tempToColor(temp);
        ctx.fillRect(x, y, w, h);
      }
    }
  },
});

registerFilter({
  slug: 'climate',
  label: 'Temperature',
  icon: '🌡️',
  kind: 'layer',
  dependsOnMonth: true,
  order: 10,
  mountLayer(map, ctx) {
    const { layerGroup, month } = ctx;
    let cancelled = false;
    let overlay;

    loadGrid(month).then((grid) => {
      if (cancelled) return;
      overlay = new TemperatureOverlay({ grid });
      overlay.addTo(map);
    });

    return () => {
      cancelled = true;
      if (overlay && map.hasLayer(overlay)) map.removeLayer(overlay);
    };
  },
});
