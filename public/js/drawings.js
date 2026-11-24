// Drawing tools, implemented as a Lightweight Charts series primitive.
// Points are stored as { time, price } so drawings survive zooming, scrolling,
// history loading and chart-type changes. Saved per symbol in localStorage.

import { t } from './i18n.js';
import { fixed } from './util.js';

const FIB_LEVELS = [
  [0, '#8E8A82'], [0.236, '#EC5246'], [0.382, '#FF9800'], [0.5, '#4CAF50'],
  [0.618, '#34B886'], [0.786, '#00BCD4'], [1, '#8E8A82'],
];
const FIB_EXT_LEVELS = [[1.618, '#4FA3F7'], [2.618, '#EC5246'], [3.618, '#9C27B0'], [4.236, '#E040FB']];
const FIB_CHANNEL_LEVELS = [...FIB_LEVELS, ...FIB_EXT_LEVELS];
const FIB_TIME_LEVELS = [
  [0, '#8E8A82'], [0.382, '#FF9800'], [0.5, '#4CAF50'], [0.618, '#34B886'], [1, '#8E8A82'],
  [1.382, '#00BCD4'], [1.618, '#4FA3F7'], [2, '#8E8A82'], [2.618, '#EC5246'], [3.618, '#9C27B0'], [4.236, '#E040FB'],
];

export const TOOLS = {
  cursor: { label: t('draw.tool.cursor'), points: 0 },
  trend: { label: t('draw.tool.trend'), points: 2, color: '#4FA3F7' },
  ray: { label: t('draw.tool.ray'), points: 2, color: '#4FA3F7' },
  extended: { label: t('draw.tool.extended'), points: 2, color: '#4FA3F7' },
  arrow: { label: t('draw.tool.arrow'), points: 2, color: '#EC5246' },
  hline: { label: t('draw.tool.hline'), points: 1, color: '#FF9800' },
  hray: { label: t('draw.tool.hray'), points: 1, color: '#FF9800' },
  vline: { label: t('draw.tool.vline'), points: 1, color: '#8E8A82' },
  rect: { label: t('draw.tool.rect'), points: 2, color: '#9C27B0' },
  channel: { label: t('draw.tool.channel'), points: 3, color: '#4FA3F7' },
  text: { label: t('draw.tool.text'), points: 1, color: '#D9D5CD' },
  fib: { label: t('draw.tool.fib'), points: 2, color: '#8E8A82' },
  fibtime: { label: t('draw.tool.fibtime'), points: 3, color: '#8E8A82' },
  fibchannel: { label: t('draw.tool.fibchannel'), points: 3, color: '#8E8A82' },
  measure: { label: t('draw.tool.measure'), points: 2, color: '#4FA3F7' },
  long: { label: t('draw.tool.long'), points: 2, color: '#34B886' },
  short: { label: t('draw.tool.short'), points: 2, color: '#EC5246' },
};

export const DRAW_COLORS = ['#4FA3F7', '#00BCD4', '#34B886', '#FFEB3B', '#FF9800', '#EC5246', '#E040FB', '#D9D5CD'];

const HIT_PX = 6;
const HANDLE_PX = 8;

function rgba(hex, a) {
  if (!hex?.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Extends the segment p1→p2 far past p2 (and past p1 when both is true); the canvas clips it. */
function extend(x1, y1, x2, y2, both) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const k = 5000 / len;
  const ex = [x2 + (x2 - x1) * k, y2 + (y2 - y1) * k];
  const sx = both ? [x1 - (x2 - x1) * k, y1 - (y2 - y1) * k] : [x1, y1];
  return [sx[0], sx[1], ex[0], ex[1]];
}

const store = {
  load(key) {
    try { return JSON.parse(localStorage.getItem(`wickline.drawings.${key}`)) || []; } catch { return []; }
  },
  save(key, items) {
    try { localStorage.setItem(`wickline.drawings.${key}`, JSON.stringify(items)); } catch { /* ignore */ }
  },
};

const clone = (o) => JSON.parse(JSON.stringify(o));
const POINT_KEYS = ['p1', 'p2', 'p3'];

export class DrawingLayer {
  constructor({ formatPrice, onToolChange, onSelect, theme }) {
    this.formatPrice = formatPrice;
    this.onToolChange = onToolChange;
    this.onSelect = onSelect;
    this.theme = theme || { bg: '#0F1012', text: '#D9D5CD' };
    this.items = [];
    this.pending = null;
    this.selectedId = null;
    this.tool = 'cursor';
    this.key = null;
    this.bars = [];
    this.tfSec = 3600;
    this.chart = null;
    this.series = null;
    this.drag = null;
    this._request = null;
    this._paneViews = [{ zOrder: () => 'top', renderer: () => ({ draw: (t) => this._draw(t) }) }];
    this._axisViews = [];
  }

  // --- ISeriesPrimitive -----------------------------------------------------
  attached({ chart, series, requestUpdate }) {
    this.chart = chart;
    this.series = series;
    this._request = requestUpdate;
  }
  detached() { this.series = null; this._request = null; }
  updateAllViews() {}
  paneViews() { return this._paneViews; }
  priceAxisViews() { return this._axisViews; }

  // --- context ----------------------------------------------------------------
  setContext(symbolKey, tfSec) {
    this.key = symbolKey;
    this.tfSec = tfSec;
    this.items = store.load(symbolKey).filter((d) => TOOLS[d.type]);
    this.pending = null;
    this.select(null);
    this._changed(false);
  }

  setBars(bars) { this.bars = bars; this._request?.(); }
  setTheme(theme) { this.theme = theme; this._request?.(); }

  setTool(tool) {
    this.tool = tool;
    this.pending = null;
    if (tool !== 'cursor') this.select(null);
    this._request?.();
  }

  get selected() { return this.items.find((d) => d.id === this.selectedId) || null; }

  select(id) {
    if (id === this.selectedId) return;
    this.selectedId = id;
    this._request?.();
    this.onSelect?.(this.selected);
  }

  updateSelected(patch) {
    const d = this.selected;
    if (!d) return;
    Object.assign(d, patch);
    this._changed(true);
    this.onSelect?.(d);
  }

  cancel() {
    if (this.pending) { this.pending = null; this._finishTool(); return true; }
    if (this.selectedId) { this.select(null); return true; }
    return false;
  }

  deleteSelected() {
    if (!this.selectedId) return false;
    this.items = this.items.filter((d) => d.id !== this.selectedId);
    this.select(null);
    this._changed(true);
    return true;
  }

  clearAll() {
    this.items = [];
    this.pending = null;
    this.select(null);
    this._changed(true);
  }

  _changed(save) {
    if (save && this.key) store.save(this.key, this.items);
    this._axisViews = this.items.filter((d) => d.type === 'hline' || d.type === 'hray').map((d) => ({
      coordinate: () => this.series?.priceToCoordinate(d.p1.price) ?? -1000,
      text: () => this.formatPrice(d.p1.price),
      textColor: () => '#FFFFFF',
      backColor: () => d.color,
      visible: () => true,
      tickVisible: () => true,
    }));
    this._request?.();
  }

  _finishTool() {
    this.tool = 'cursor';
    this.onToolChange?.('cursor');
    this._request?.();
  }

  // --- time <-> logical index (works between bars and beyond the last bar) ---
  logicalFromTime(t) {
    const b = this.bars, n = b.length;
    if (!n) return 0;
    if (t <= b[0].time) return (t - b[0].time) / this.tfSec;
    if (t >= b[n - 1].time) return n - 1 + (t - b[n - 1].time) / this.tfSec;
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (b[mid].time <= t) lo = mid; else hi = mid;
    }
    return lo + (t - b[lo].time) / (b[hi].time - b[lo].time);
  }

  timeFromLogical(l) {
    const b = this.bars, n = b.length;
    if (!n) return 0;
    if (l <= 0) return Math.round(b[0].time + l * this.tfSec);
    if (l >= n - 1) return Math.round(b[n - 1].time + (l - (n - 1)) * this.tfSec);
    const i = Math.floor(l), f = l - i;
    return Math.round(b[i].time + f * (b[i + 1].time - b[i].time));
  }

  _x(time) { return this.chart.timeScale().logicalToCoordinate(this.logicalFromTime(time)); }
  _y(price) { return this.series.priceToCoordinate(price); }

  /** Chart position under (x, y) in the price pane, with time snapped to a bar. */
  _point(x, y, snap = true) {
    if (!this.series || !this.chart) return null;
    const logical = this.chart.timeScale().coordinateToLogical(x);
    const price = this.series.coordinateToPrice(y);
    if (logical == null || price == null) return null;
    return { logical, time: this.timeFromLogical(snap ? Math.round(logical) : logical), price };
  }

  /** Price on the line p1→p2 at a given time (for parallel channels). */
  _linePriceAt(p1, p2, time) {
    const l1 = this.logicalFromTime(p1.time), l2 = this.logicalFromTime(p2.time), l = this.logicalFromTime(time);
    if (l2 === l1) return p1.price;
    return p1.price + ((p2.price - p1.price) * (l - l1)) / (l2 - l1);
  }

  /** x of a trend-based Fib time level: p3 plus lvl times the p1→p2 span, counted in bars. */
  _fibTimeX(d, lvl) {
    const span = this.logicalFromTime(d.p2.time) - this.logicalFromTime(d.p1.time);
    return this.chart.timeScale().logicalToCoordinate(this.logicalFromTime(d.p3.time) + Math.abs(span) * lvl);
  }

  // --- creating drawings ----------------------------------------------------------
  /** Returns true when the click was used by the drawing layer. */
  handleClick(param) {
    if (this.tool === 'cursor') {
      if (!param.point) return false;
      const hit = this.hitTest(param.point.x, param.point.y);
      this.select(hit);
      return !!hit;
    }
    if (!param.point) return false;
    const pt = this._point(param.point.x, param.point.y);
    if (!pt) return false;
    const p = { time: pt.time, price: pt.price };
    const spec = TOOLS[this.tool];
    if (spec.points === 1) {
      const item = { id: crypto.randomUUID(), type: this.tool, p1: p, p2: { ...p }, color: spec.color };
      if (this.tool === 'text') item.text = t('draw.tool.text');
      this.items.push(item);
      this._changed(true);
      this._finishTool();
      this.select(item.id);
      return true;
    }
    if (!this.pending) {
      this.pending = { id: crypto.randomUUID(), type: this.tool, p1: p, p2: { ...p }, color: spec.color, step: 1 };
      if (spec.points === 3) this.pending.p3 = { ...p };
      this._request?.();
      return true;
    }
    const three = TOOLS[this.pending.type].points === 3;
    if (three && this.pending.step === 1) {
      this.pending.p2 = p;
      this.pending.p3 = { ...p };
      this.pending.step = 2;
      this._request?.();
      return true;
    }
    if (three) this.pending.p3 = p;
    else this.pending.p2 = p;
    const item = this.pending;
    delete item.step;
    if (item.type === 'long' || item.type === 'short') {
      // Stop starts at the same distance on the other side (1:1 risk/reward); drag it to adjust.
      item.p3 = { time: item.p1.time, price: item.p1.price - (item.p2.price - item.p1.price) };
    }
    this.items.push(item);
    this.pending = null;
    this._changed(true);
    this._finishTool();
    this.select(item.id);
    return true;
  }

  handleMove(param) {
    if (!this.pending || !param.point) return;
    const pt = this._point(param.point.x, param.point.y);
    if (!pt) return;
    const p = { time: pt.time, price: pt.price };
    if (this.pending.step === 2) this.pending.p3 = p;
    else this.pending.p2 = p;
    this._request?.();
  }

  // --- editing: drag a drawing or one of its handles --------------------------------
  _handles(d) {
    const pts = [];
    const x1 = this._x(d.p1.time), y1 = this._y(d.p1.price);
    switch (d.type) {
      case 'hline': pts.push(['p1', this.chart.timeScale().width() / 2, y1]); break;
      case 'hray': case 'text': pts.push(['p1', x1, y1]); break;
      case 'vline': pts.push(['p1', x1, 40]); break;
      case 'long': case 'short':
        pts.push(['p1', x1, y1], ['p2', this._x(d.p2.time), this._y(d.p2.price)], ['p3', x1, this._y(d.p3.price)]);
        break;
      case 'fibtime':
        pts.push(['p1', x1, y1], ['p2', this._x(d.p2.time), this._y(d.p2.price)], ['p3', this._x(d.p3.time), this._y(d.p3.price)]);
        break;
      case 'channel': case 'fibchannel': {
        const off = d.p3.price - this._linePriceAt(d.p1, d.p2, d.p3.time);
        pts.push(['p1', x1, y1], ['p2', this._x(d.p2.time), this._y(d.p2.price)],
          ['p3', (x1 + this._x(d.p2.time)) / 2, this._y((d.p1.price + d.p2.price) / 2 + off)]);
        break;
      }
      default: pts.push(['p1', x1, y1], ['p2', this._x(d.p2.time), this._y(d.p2.price)]);
    }
    return pts.filter(([, x, y]) => x != null && y != null);
  }

  /** Starts dragging when (x, y) is on the selected drawing's handle or on any drawing. */
  beginDrag(x, y) {
    if (this.tool !== 'cursor' || !this.series) return false;
    const sel = this.selected;
    if (sel) {
      const h = this._handles(sel).find(([, hx, hy]) => Math.hypot(hx - x, hy - y) <= HANDLE_PX);
      if (h) { this.drag = { item: sel, handle: h[0], start: this._point(x, y, false), orig: clone(sel) }; return !!this.drag.start; }
    }
    const id = this.hitTest(x, y);
    if (!id) return false;
    this.select(id);
    const item = this.selected;
    this.drag = { item, handle: 'body', start: this._point(x, y, false), orig: clone(item) };
    return !!this.drag.start;
  }

  dragMove(x, y) {
    const d = this.drag;
    if (!d) return;
    const pt = this._point(x, y, false);
    if (!pt) return;
    const { item, orig } = d;
    if (d.handle === 'body') {
      const dl = Math.round(pt.logical - d.start.logical);
      const dp = pt.price - d.start.price;
      for (const k of POINT_KEYS) {
        if (!orig[k]) continue;
        item[k] = { time: this.timeFromLogical(this.logicalFromTime(orig[k].time) + dl), price: orig[k].price + dp };
      }
    } else if (d.handle === 'p3' && (item.type === 'long' || item.type === 'short')) {
      item.p3 = { time: item.p1.time, price: pt.price };
    } else {
      item[d.handle] = { time: this.timeFromLogical(Math.round(pt.logical)), price: pt.price };
    }
    this._changed(false);
  }

  endDrag() {
    if (!this.drag) return;
    this.drag = null;
    this._changed(true);
    this.onSelect?.(this.selected);
  }

  hitTest(x, y) {
    if (!this.series || !this.chart) return null;
    let best = null, bestD = HIT_PX;
    for (const d of this.items) {
      const dist = this._distance(d, x, y);
      if (dist != null && dist <= bestD) { best = d.id; bestD = dist; }
    }
    return best;
  }

  _distance(d, x, y) {
    const x1 = this._x(d.p1.time), y1 = this._y(d.p1.price);
    const x2 = this._x(d.p2.time), y2 = this._y(d.p2.price);
    if (y1 == null) return null;
    const inBox = (ax, ay, bx, by) => x >= Math.min(ax, bx) && x <= Math.max(ax, bx) && y >= Math.min(ay, by) && y <= Math.max(ay, by);
    switch (d.type) {
      case 'hline': return Math.abs(y - y1);
      case 'hray': return x1 != null && x >= x1 - HIT_PX ? Math.abs(y - y1) : null;
      case 'vline': return x1 == null ? null : Math.abs(x - x1);
      case 'text': return x1 != null && x >= x1 - 4 && x <= x1 + (d._w || 40) + 4 && y >= y1 - 16 && y <= y1 + 4 ? 0 : null;
      case 'trend': case 'arrow':
        return x1 == null || x2 == null || y2 == null ? null : distToSegment(x, y, x1, y1, x2, y2);
      case 'ray': case 'extended': {
        if (x1 == null || x2 == null || y2 == null) return null;
        const [a, b, c, e] = extend(x1, y1, x2, y2, d.type === 'extended');
        return distToSegment(x, y, a, b, c, e);
      }
      case 'rect': case 'measure':
        return x1 == null || x2 == null || y2 == null ? null : inBox(x1, y1, x2, y2) ? 0 : null;
      case 'long': case 'short': {
        const y3 = this._y(d.p3.price);
        return x1 == null || x2 == null || y2 == null || y3 == null ? null
          : (inBox(x1, y1, x2, y2) || inBox(x1, y1, x2, y3)) ? 0 : null;
      }
      case 'channel': {
        if (x1 == null || x2 == null || y2 == null) return null;
        const off = d.p3.price - this._linePriceAt(d.p1, d.p2, d.p3.time);
        const ya = this._y(d.p1.price + off), yb = this._y(d.p2.price + off);
        if (ya == null || yb == null) return null;
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        if (x < minX - HIT_PX || x > maxX + HIT_PX) return null;
        const t = maxX === minX ? 0 : (x - x1) / (x2 - x1);
        const yl1 = y1 + (y2 - y1) * t, yl2 = ya + (yb - ya) * t;
        return y >= Math.min(yl1, yl2) - HIT_PX && y <= Math.max(yl1, yl2) + HIT_PX ? 0 : null;
      }
      case 'fib': {
        if (x1 == null || x2 == null) return null;
        if (x < Math.min(x1, x2) - HIT_PX || x > Math.max(x1, x2) + HIT_PX) return null;
        let m = Infinity;
        for (const [lvl] of FIB_LEVELS) {
          const ly = this._y(d.p2.price + (d.p1.price - d.p2.price) * lvl);
          if (ly != null) m = Math.min(m, Math.abs(y - ly));
        }
        return m;
      }
      case 'fibtime': {
        if (x1 == null || x2 == null || y2 == null) return null;
        let m = distToSegment(x, y, x1, y1, x2, y2);
        const x3 = this._x(d.p3.time), y3 = this._y(d.p3.price);
        if (x3 != null && y3 != null) m = Math.min(m, distToSegment(x, y, x2, y2, x3, y3));
        for (const [lvl] of FIB_TIME_LEVELS) {
          const lx = this._fibTimeX(d, lvl);
          if (lx != null) m = Math.min(m, Math.abs(x - lx));
        }
        return m;
      }
      case 'fibchannel': {
        if (x1 == null || x2 == null || y2 == null) return null;
        const off = d.p3.price - this._linePriceAt(d.p1, d.p2, d.p3.time);
        let m = Infinity;
        for (const [lvl] of FIB_CHANNEL_LEVELS) {
          const ya = this._y(d.p1.price + off * lvl), yb = this._y(d.p2.price + off * lvl);
          if (ya != null && yb != null) m = Math.min(m, distToSegment(x, y, x1, ya, x2, yb));
        }
        return m;
      }
      default: return null;
    }
  }

  // --- rendering --------------------------------------------------------------
  _draw(target) {
    if (!this.series || !this.chart) return;
    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      const list = this.pending ? [...this.items, this.pending] : this.items;
      for (const d of list) {
        ctx.save();
        try { this._drawItem(ctx, d, mediaSize, d === this.pending || d.id === this.selectedId); } catch { /* skip */ }
        ctx.restore();
      }
    });
  }

  _label(ctx, text, x, y, bg, align = 'center') {
    ctx.font = '600 11px -apple-system, "Segoe UI", Roboto, sans-serif';
    const lines = String(text).split('\n');
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12;
    const h = lines.length * 15 + 6;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = bg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(left, y - h / 2, w, h, 4); else ctx.rect(left, y - h / 2, w, h);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    lines.forEach((l, k) => ctx.fillText(l, left + 6, y - h / 2 + 3 + 7.5 + k * 15));
  }

  _drawItem(ctx, d, size, active) {
    const x1 = this._x(d.p1.time), y1 = this._y(d.p1.price);
    const x2 = this._x(d.p2.time), y2 = this._y(d.p2.price);
    if (y1 == null) return;
    ctx.lineWidth = 2;
    ctx.strokeStyle = d.color;
    ctx.fillStyle = d.color;
    ctx.font = '11px -apple-system, "Segoe UI", Roboto, sans-serif';
    const line = (ax, ay, bx, by) => { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); };

    switch (d.type) {
      case 'hline': line(0, y1, size.width, y1); break;
      case 'hray': if (x1 != null) line(x1, y1, size.width, y1); break;
      case 'vline': if (x1 != null) { ctx.lineWidth = 1.5; line(x1, 0, x1, size.height); } break;
      case 'text': {
        if (x1 == null) break;
        ctx.font = '600 14px -apple-system, "Segoe UI", Roboto, sans-serif';
        ctx.textBaseline = 'alphabetic';
        ctx.shadowColor = this.theme.bg;
        ctx.shadowBlur = 4;
        const text = d.text || t('draw.tool.text');
        ctx.fillText(text, x1, y1);
        d._w = ctx.measureText(text).width;
        break;
      }
      default: break;
    }
    if (['hline', 'hray', 'vline', 'text'].includes(d.type)) {
      if (active) for (const [, hx, hy] of this._handles(d)) this._handle(ctx, hx, hy, d.color);
      return;
    }
    if (x1 == null || x2 == null || y2 == null) return;

    switch (d.type) {
      case 'trend': line(x1, y1, x2, y2); break;
      case 'ray': case 'extended': { const [a, b, c, e] = extend(x1, y1, x2, y2, d.type === 'extended'); line(a, b, c, e); break; }
      case 'arrow': {
        line(x1, y1, x2, y2);
        const ang = Math.atan2(y2 - y1, x2 - x1), s = 12;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - s * Math.cos(ang - 0.45), y2 - s * Math.sin(ang - 0.45));
        ctx.lineTo(x2 - s * Math.cos(ang + 0.45), y2 - s * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'rect':
        ctx.fillStyle = rgba(d.color, 0.15);
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        break;
      case 'channel': {
        const off = d.p3.price - this._linePriceAt(d.p1, d.p2, d.p3.time);
        const ya = this._y(d.p1.price + off), yb = this._y(d.p2.price + off);
        if (ya == null || yb == null) break;
        ctx.fillStyle = rgba(d.color, 0.12);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x2, yb); ctx.lineTo(x1, ya); ctx.closePath(); ctx.fill();
        line(x1, y1, x2, y2);
        line(x1, ya, x2, yb);
        ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
        line(x1, (y1 + ya) / 2, x2, (y2 + yb) / 2);
        ctx.setLineDash([]);
        break;
      }
      case 'fib': {
        const left = Math.min(x1, x2), right = Math.max(x1, x2);
        let prevY = null;
        for (const [lvl, color] of FIB_LEVELS) {
          const price = d.p2.price + (d.p1.price - d.p2.price) * lvl;
          const y = this._y(price);
          if (y == null) continue;
          if (prevY != null) {
            ctx.fillStyle = rgba(color, 0.1);
            ctx.fillRect(left, Math.min(prevY, y), right - left, Math.abs(y - prevY));
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          line(left, y, right, y);
          ctx.fillStyle = color;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${lvl} (${this.formatPrice(price)})`, left - 6, y);
          prevY = y;
        }
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#8E8A82';
        line(x1, y1, x2, y2);
        ctx.setLineDash([]);
        break;
      }
      case 'fibtime': {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#8E8A82';
        ctx.lineWidth = 1;
        line(x1, y1, x2, y2);
        const x3 = this._x(d.p3.time), y3 = this._y(d.p3.price);
        if (d.step !== 1 && x3 != null && y3 != null) line(x2, y2, x3, y3);
        ctx.setLineDash([]);
        if (d.step === 1 || x3 == null) break;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        let prevX = null;
        for (const [lvl, color] of FIB_TIME_LEVELS) {
          const x = this._fibTimeX(d, lvl);
          if (x == null) continue;
          if (prevX != null) {
            ctx.fillStyle = rgba(color, 0.06);
            ctx.fillRect(Math.min(prevX, x), 0, Math.abs(x - prevX), size.height);
          }
          ctx.strokeStyle = color;
          line(x, 0, x, size.height);
          ctx.fillStyle = color;
          ctx.fillText(String(lvl), x + 4, size.height - 4);
          prevX = x;
        }
        break;
      }
      case 'fibchannel': {
        if (d.step === 1) { ctx.lineWidth = 1; line(x1, y1, x2, y2); break; }
        const off = d.p3.price - this._linePriceAt(d.p1, d.p2, d.p3.time);
        let prev = null;
        for (const [lvl, color] of FIB_CHANNEL_LEVELS) {
          const ya = this._y(d.p1.price + off * lvl), yb = this._y(d.p2.price + off * lvl);
          if (ya == null || yb == null) continue;
          if (prev) {
            ctx.fillStyle = rgba(color, 0.1);
            ctx.beginPath(); ctx.moveTo(x1, prev[0]); ctx.lineTo(x2, prev[1]); ctx.lineTo(x2, yb); ctx.lineTo(x1, ya); ctx.closePath(); ctx.fill();
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          line(x1, ya, x2, yb);
          ctx.fillStyle = color;
          ctx.textAlign = x1 <= x2 ? 'right' : 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(lvl), x1 + (x1 <= x2 ? -6 : 6), ya);
          prev = [ya, yb];
        }
        break;
      }
      case 'measure': {
        const up = d.p2.price >= d.p1.price;
        const col = up ? '#4FA3F7' : '#EC5246';
        ctx.fillStyle = rgba(col, 0.15);
        ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        line(mx, y1, mx, y2);
        line(x1, my, x2, my);
        const dp = d.p2.price - d.p1.price;
        const pct = d.p1.price ? (dp / d.p1.price) * 100 : 0;
        const nb = Math.round(this.logicalFromTime(d.p2.time) - this.logicalFromTime(d.p1.time));
        const secs = Math.abs(d.p2.time - d.p1.time);
        const dur = secs >= 86400 ? t('draw.durD', { n: Math.round(secs / 86400) })
          : secs >= 3600 ? t('draw.durH', { n: Math.round(secs / 3600) }) : t('draw.durM', { n: Math.round(secs / 60) });
        this._label(ctx, `${dp >= 0 ? '+' : ''}${this.formatPrice(dp)} (${pct >= 0 ? '+' : ''}${fixed(pct, 2)}%)\n${t('draw.measure', { n: nb, dur })}`,
          mx, up ? Math.min(y1, y2) - 22 : Math.max(y1, y2) + 22, col);
        break;
      }
      case 'long': case 'short': {
        const y3 = this._y(d.p3.price);
        if (y3 == null) break;
        const left = Math.min(x1, x2), w = Math.abs(x2 - x1);
        ctx.fillStyle = 'rgba(52, 184, 134, 0.2)';
        ctx.fillRect(left, Math.min(y1, y2), w, Math.abs(y2 - y1));
        ctx.fillStyle = 'rgba(236, 82, 70, 0.2)';
        ctx.fillRect(left, Math.min(y1, y3), w, Math.abs(y3 - y1));
        ctx.strokeStyle = '#8E8A82';
        ctx.lineWidth = 1;
        line(left, y1, left + w, y1);
        const entry = d.p1.price, target = d.p2.price, stop = d.p3.price;
        const pct = (p) => `${p >= entry ? '+' : ''}${fixed(((p - entry) / entry) * 100, 2)}%`;
        const rr = Math.abs(stop - entry) ? Math.abs(target - entry) / Math.abs(stop - entry) : 0;
        const cx = left + w / 2;
        this._label(ctx, t('draw.target', { price: this.formatPrice(target), pct: pct(target) }), cx, y2 + (y2 < y1 ? -14 : 14), '#34B886');
        this._label(ctx, t('draw.stop', { price: this.formatPrice(stop), pct: pct(stop) }), cx, y3 + (y3 < y1 ? -14 : 14), '#EC5246');
        this._label(ctx, t(d.type === 'long' ? 'draw.longRR' : 'draw.shortRR', { rr: fixed(rr, 2) }), cx, y1, '#34373C');
        break;
      }
      default: break;
    }
    if (active) for (const [, hx, hy] of this._handles(d)) this._handle(ctx, hx, hy, d.color);
  }

  _handle(ctx, x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = this.theme.bg;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}
