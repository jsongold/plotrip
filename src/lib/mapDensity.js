/**
 * Viewport-area-based pin density helper.
 *
 * 表示する pin 数を「画面 px²」と「1 pin あたりの目安 px²」から動的に決める。
 * 固定 zoom bucket より滑らか、デバイス解像度 (モバイル/4K) に自動適応。
 *
 * Cartographic convention: Imhof 等の label density 研究によれば読みやすい密度は
 * 概ね 1 label / 1000 px² 前後 (font 12-13px 相当)。本アプリではラベル+アイコンで
 * さらに余白が要るため badge 用には pxPerPin=45000 程度、小ドット用には 10000 程度
 * を推奨。
 *
 * 使い方:
 *   const n = maxPinsForMap(map, { pxPerPin: 45000, max: 80 });
 *
 * @param {any} map Leaflet Map
 * @param {{ pxPerPin?: number, max?: number, minZoom?: number, min?: number }} [opts]
 *   - pxPerPin: 1 pin あたりの目安 px² (デフォルト 45000: badge+label)
 *   - max: 件数上限 (デフォルト 80)
 *   - minZoom: この zoom 以下では 0 を返す (デフォルト 3, world view では出さない)
 *   - min: 画面が小さくても最低限出す件数 (デフォルト 3)
 * @returns {number}
 */
export function maxPinsForMap(map, opts = {}) {
  const { pxPerPin = 45000, max = 80, minZoom = 3, min = 3 } = opts;
  if (!map || typeof map.getZoom !== 'function') return 0;
  const zoom = map.getZoom();
  if (zoom <= minZoom) return 0;
  const size = map.getSize();
  if (!size) return min;
  const area = size.x * size.y;
  const raw = Math.round(area / pxPerPin);
  if (raw <= 0) return 0;
  return Math.max(min, Math.min(max, raw));
}
