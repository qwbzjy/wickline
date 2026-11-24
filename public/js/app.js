// App shell: layouts of several charts, the active chart, header/toolbar, side panel
// (watchlist, markets, alerts), search, indicators dialog, script editor, pop-out windows
// and keyboard shortcuts. Each chart is a ChartView.

import { parseSymbol, displayTicker, SOURCES, loadUniverse, extendedHours } from './datafeed.js';
import { tfById, tfIdOf } from './timeframes.js';
import { TimeframeBar, IntervalBox } from './timeframe-ui.js';
import { INDICATORS, CATEGORIES, categoryLabel } from './indicators.js';
import {
  ChartView, normalizeChartState, cloneChartState, closeSettings, settingsOpen, CHART_TYPES,
} from './chart-view.js';
import {
  PRESETS, FIELDS, palette, presetId, isCustomized, currentMode, applyAppearance, onAppearanceChange,
  setPreset, setColor, resetColors,
} from './theme.js';
import { TOOLS } from './drawings.js';
import { SymbolSearch } from './search.js';
import { QuoteList } from './quote-list.js';
import { cleanList, isSection, sectionName, symbolsOf, addSection, renameSection, removeSection, moveEntry } from './watchlist.js';
import { MarketBrowser } from './market-browser.js';
import { MARKET_GROUPS } from './markets.js';
import { AlertManager, CONDITIONS, alertText, chime } from './alerts.js';
import { ScriptEditor } from './script-editor.js';
import { StrategyTester } from './strategy-tester.js';
import { scriptStore, TEMPLATES } from './scripts.js';
import {
  loadCommunity, communityHtml, communityCount, communityEntry, installedCopy, installCommunity, fetchCommunityCode,
  setCommunityView, likeUrl, isOfficial, authorLabel,
} from './community.js';
import { settings, apiUrl, dataMode } from './env.js';
import { tdCheckKey } from './twelvedata.js';
import { checkForUpdate } from './update.js';
import { Screener } from './screener.js';
import { NewsPanel } from './news.js';
import { TradingPanel } from './trading.js';
import { HeatmapPanel, groupName as sectorName } from './heatmap.js';
import { OptionsPanel } from './options.js';
import { $, esc, store, formatNumber, smartDecimals, fixed } from './util.js';
import { t, lang, locale, applyI18n, LANGUAGES, savedLang, setLang } from './i18n.js';
import {
  LAYOUTS, layoutOf, equalSizes, validSizes, sizesEntry, paneRects, dividers, moveDivider, resetSplit,
} from './layouts.js';

// index.html's text in the UI language, before any code below reads or rewrites it.
applyI18n();

const POPOUT = new URLSearchParams(location.search).get('popout') === '1';
if (POPOUT) document.body.classList.add('popout', 'wl-closed');

// A layout's panes drawn in a 20 × 14 box, 1 apart.
const layoutIcon = (id) => {
  const l = layoutOf(id);
  const cell = (r) => {
    const x = r.x * 20 + (r.x > 0 ? 0.5 : 0), y = r.y * 14 + (r.y > 0 ? 0.5 : 0);
    const w = (r.x + r.w) * 20 - (r.x + r.w < 0.999 ? 0.5 : 0) - x, h = (r.y + r.h) * 14 - (r.y + r.h < 0.999 ? 0.5 : 0) - y;
    return `<rect x="${+x.toFixed(2)}" y="${+y.toFixed(2)}" width="${+w.toFixed(2)}" height="${+h.toFixed(2)}" rx="1.2" fill="none" stroke="currentColor" stroke-width="${l.n > 4 ? 1.2 : 1.4}"/>`;
  };
  return `<svg viewBox="-1 -1 22 16" width="22" height="16" aria-hidden="true">${paneRects(l, equalSizes(l)).map(cell).join('')}</svg>`;
};

const svg = (body) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${body}</svg>`;
const S = 'stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="2" fill="var(--bg)" ${S}/>`;
const TOOL_ICONS = {
  cursor: svg(`<path d="M12 4v16M4 12h16" ${S}/>`),
  trend: svg(`<path d="M5 19L19 5" ${S}/>${dot(5, 19)}${dot(19, 5)}`),
  ray: svg(`<path d="M5 19L21 3" ${S}/>${dot(5, 19)}${dot(12, 12)}`),
  extended: svg(`<path d="M2 22L22 2" ${S}/>${dot(8, 16)}${dot(16, 8)}`),
  arrow: svg(`<path d="M5 19L18 6M11 6h7v7" ${S}/>`),
  channel: svg(`<path d="M3 15L15 3M9 21L21 9" ${S}/>`),
  hline: svg(`<path d="M3 12h18" ${S}/>${dot(12, 12)}`),
  hray: svg(`<path d="M7 12h14" ${S}/>${dot(7, 12)}`),
  vline: svg(`<path d="M12 3v18" ${S}/>${dot(12, 12)}`),
  rect: svg(`<rect x="4.5" y="6.5" width="15" height="11" ${S}/>`),
  text: svg(`<path d="M6 6h12M12 6v13" ${S}/>`),
  fib: svg(`<path d="M3 5h18M3 9.5h18M3 13h18M3 19h18" ${S}/>`),
  fibtime: svg(`<path d="M4 3v18M8 3v18M12 3v18M18 3v18" ${S}/>`),
  fibchannel: svg(`<path d="M3 13L13 3M3 17L17 3M5 21L21 5" ${S}/>`),
  measure: svg(`<path d="M4 20L20 4M4 14v6h6M20 10V4h-6" ${S}/>`),
  long: svg(`<rect x="4" y="4" width="16" height="8" ${S}/><rect x="4" y="12" width="16" height="6" ${S} stroke-dasharray="2 2"/><path d="M12 9V6" ${S}/>`),
  short: svg(`<rect x="4" y="6" width="16" height="6" ${S} stroke-dasharray="2 2"/><rect x="4" y="12" width="16" height="8" ${S}/><path d="M12 15v3" ${S}/>`),
};
const TOOL_KEYS = { trend: 'Alt+T', hline: 'Alt+H', vline: 'Alt+V', rect: 'Alt+R', fib: 'Alt+F', channel: 'Alt+C', measure: 'Alt+M', text: 'Alt+X' };
const TOOL_GROUPS = [
  { id: 'cursor', tools: ['cursor'] },
  { id: 'lines', tools: ['trend', 'ray', 'extended', 'arrow', 'channel'] },
  { id: 'levels', tools: ['hline', 'hray', 'vline'] },
  { id: 'shapes', tools: ['rect', 'text'] },
  { id: 'fib', tools: ['fib', 'fibtime', 'fibchannel', 'measure'] },
  { id: 'positions', tools: ['long', 'short'] },
];

const DEFAULT_WATCHLIST = [
  'BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:SOLUSDT', 'BINANCEF:BTCUSDT',
  'YAHOO:AAPL', 'YAHOO:NVDA', 'YAHOO:TSLA', 'YAHOO:MSFT',
  'YAHOO:SPY', 'YAHOO:^GSPC', 'YAHOO:EURUSD=X', 'YAHOO:GC=F',
];

const STATUS_TEXT = {
  live: t('common.live'),
  polling: t('app.status.polling'),
  connecting: t('app.status.connecting'),
  reconnecting: t('app.status.reconnecting'),
  error: t('app.status.error'),
  replay: t('app.status.replay'),
};

const b64encode = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64decode = (b) => new TextDecoder().decode(Uint8Array.from(atob(b), (c) => c.charCodeAt(0)));

// ---------------------------------------------------------------------------
// Workspace (layout + every chart's settings)
// ---------------------------------------------------------------------------

function applyHash(state, hash) {
  if (hash.get('s')) state.symbol = hash.get('s');
  if (tfIdOf(hash.get('tf'))) state.tf = tfIdOf(hash.get('tf')); // any timeframe: 45m, 4h, 1D…
}

// What the charts in a layout share: symbol and timeframe off by default,
// the crosshair on.
const DEFAULT_SYNC = { symbol: false, interval: false, crosshair: true };

function loadWorkspace() {
  const hash = new URLSearchParams(location.hash.slice(1));
  if (POPOUT) {
    let st = null;
    try { st = hash.get('c') ? JSON.parse(b64decode(hash.get('c'))) : null; } catch { /* ignore */ }
    const s = normalizeChartState(st || {});
    applyHash(s, hash);
    return { layout: '1', active: 0, charts: [s] };
  }
  let w = store.get('workspace', null);
  if (!w || !Array.isArray(w.charts) || !w.charts.length) {
    w = { layout: '1', active: 0, charts: [store.get('state', {})] };
  }
  w.charts = w.charts.map(normalizeChartState);
  w.layout = layoutOf(w.layout).id;
  w.active = Math.max(0, Math.min(w.active || 0, layoutOf(w.layout).n - 1));
  w.sync = { ...DEFAULT_SYNC, ...w.sync };
  applyHash(w.charts[w.active], hash);
  return w;
}

let saveTimer = null;
function saveWorkspace() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    ws.charts = ws.charts.map((s, i) => views[i]?.state || s);
    if (!POPOUT) store.set('workspace', ws);
    const a = activeView?.state;
    if (!a) return;
    const hash = POPOUT
      ? `c=${encodeURIComponent(b64encode(JSON.stringify(a)))}`
      : new URLSearchParams({ s: a.symbol, tf: a.tf }).toString();
    history.replaceState(null, '', `${location.pathname}${location.search}#${hash}`);
  }, 150);
}

// ---------------------------------------------------------------------------
// Charts & layout
// ---------------------------------------------------------------------------

const chartsEl = $('#charts');
const views = [];
let activeView = null;
let maximized = null;
let crosshairOwner = null;

function createView(state) {
  const v = new ChartView(chartsEl, state, {
    onActivate: (x) => setActive(x),
    onChange: (x) => {
      saveWorkspace();
      if (x === activeView) { syncHeader(); syncTitle(); watchlistList.setActive(x.state.symbol); tester.render(); newsPanel.syncSymbol(); optionsPanel.syncSymbol(); }
      trading.onViewChange(x);
    },
    onStrategy: (x, entry) => tester.onResult(x, entry),
    onStatus: (x) => { if (x === activeView) syncStatus(); },
    onUpdate: (x) => { if (x === activeView) syncTitle(); trading.onChartUpdate(x); },
    onReplay: (x, event, payload) => {
      trading.onReplay(x, event, payload);
      if (x === activeView) { syncHeader(); syncStatus(); syncTitle(); }
    },
    onPaperDrag: (x, id, price) => trading.onDrag(x, id, price),
    onQuickTrade: (x, side, qty) => { setActive(x); trading.quickTrade(x, side, qty); },
    onQuickQty: (x, qty) => trading.setQty(qty, x.state.symbol),
    onCrosshair: syncCrosshair,
    onSymbol: (x, full) => chartChanged('symbol', x, full),
    onTimeframe: (x, tf) => chartChanged('interval', x, tf),
    onToolChange: (x, tool) => { if (x === activeView) setToolUI(tool); },
    onMaximize: (x) => setMaximized(maximized === x ? null : x),
    onPopout: popout,
    onSearch: (x) => { setActive(x); search.open('open'); },
    onEditScript: (x, id) => { if (id) editor.edit(id); },
    onSettings: () => openSettings(),
    onCreateAlert: (x, price) => openAlertDialog(x.state.symbol, price),
  });
  v.setAlerts(alerts.items);
  return v;
}

function newChartState() {
  const base = activeView?.state || ws.charts[0] || normalizeChartState();
  const used = new Set(ws.charts.map((s) => s.symbol));
  const symbol = symbolsOf(watchSymbols).find((s) => !used.has(s)) || base.symbol;
  return cloneChartState(base, { symbol, compares: [] });
}

function applyLayout(id) {
  const layout = layoutOf(id);
  ws.layout = layout.id;
  while (ws.charts.length < layout.n) ws.charts.push(newChartState());
  while (views.length > layout.n) {
    const v = views.pop();
    if (v === activeView) activeView = null;
    v.destroy();
  }
  for (let i = views.length; i < layout.n; i++) {
    const v = createView(ws.charts[i]);
    ws.charts[i] = v.state;
    views.push(v);
    v.load();
  }
  chartsEl.dataset.layout = layout.id;
  paneSizes = validSizes(layout, savedSizes[layout.id]);
  renderPanes();
  setMaximized(null);
  setActive(views[Math.min(ws.active, layout.n - 1)], true);
  renderLayoutMenu();
  saveWorkspace();
}

// --- Pane sizes ------------------------------------------------------------------------
// Panes are placed from layouts.js as fractions of the chart area (CSS turns them into
// positions), with a divider on every edge between panes. Dragging one resizes the panes on
// either side; double-clicking it makes that split equal again. Sizes are saved per layout.
const storedSizes = store.get('layoutSizes', null);
const savedSizes = storedSizes && typeof storedSizes === 'object' && !Array.isArray(storedSizes) ? storedSizes : {};
let paneSizes = [];
let splitEls = [];

function placeBox(el, r) {
  for (const k of ['x', 'y', 'w', 'h']) el.style.setProperty(`--${k}`, +r[k].toFixed(6));
}

function renderPanes() {
  const layout = layoutOf(ws.layout);
  paneRects(layout, paneSizes).forEach((r, i) => {
    const el = views[i]?.el;
    if (!el) return;
    placeBox(el, r);
    // The 1px line between panes is the gap on their right and bottom edges.
    el.style.setProperty('--gx', r.x + r.w < 0.9999 ? '1px' : '0px');
    el.style.setProperty('--gy', r.y + r.h < 0.9999 ? '1px' : '0px');
  });
  const list = dividers(layout, paneSizes);
  if (list.length !== splitEls.length || list.some((d, i) => splitEls[i].dataset.split !== d.id || splitEls[i].dataset.axis !== d.axis)) {
    for (const el of splitEls) el.remove();
    splitEls = list.map((d) => {
      const el = document.createElement('div');
      el.className = 'split';
      el.dataset.split = d.id;
      el.dataset.axis = d.axis;
      el.title = t('app.split');
      chartsEl.append(el);
      return el;
    });
  }
  list.forEach((d, i) => placeBox(splitEls[i], d));
}

function saveSizes() {
  if (POPOUT) return;
  savedSizes[ws.layout] = sizesEntry(layoutOf(ws.layout), paneSizes);
  store.set('layoutSizes', savedSizes);
}

chartsEl.addEventListener('pointerdown', (e) => {
  const el = e.target.closest?.('.split');
  if (!el || e.button !== 0) return;
  const layout = layoutOf(ws.layout);
  const d = dividers(layout, paneSizes).find((x) => x.id === el.dataset.split);
  if (!d) return;
  e.preventDefault();
  const along = d.axis === 'x' ? 'clientX' : 'clientY';
  const r = chartsEl.getBoundingClientRect();
  const box = { w: r.width, h: r.height };
  const from = e[along], start = d.axis === 'x' ? d.x * box.w : d.y * box.h;
  let at = from, frame = 0;
  // One update per frame: the charts resize (and redraw) as the panes change size.
  const apply = () => {
    frame = 0;
    paneSizes = moveDivider(layout, paneSizes, d.id, start + at - from, box);
    renderPanes();
  };
  const move = (ev) => { at = ev[along]; if (!frame) frame = requestAnimationFrame(apply); };
  const up = (ev) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    if (ev.type === 'pointerup') at = ev[along];
    cancelAnimationFrame(frame);
    apply();
    el.classList.remove('on');
    delete document.body.dataset.resizing;
    saveSizes();
  };
  try { el.setPointerCapture(e.pointerId); } catch { /* not a live pointer (synthetic events) */ }
  el.classList.add('on');
  document.body.dataset.resizing = d.axis;
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
});

chartsEl.addEventListener('dblclick', (e) => {
  const el = e.target.closest?.('.split');
  if (!el) return;
  paneSizes = resetSplit(layoutOf(ws.layout), paneSizes, el.dataset.split);
  renderPanes();
  saveSizes();
});

function setActive(v, force = false) {
  if (!v || (v === activeView && !force)) return;
  if (activeView && activeView !== v) {
    activeView.cancelDrawing();
    activeView.setTool('cursor');
  }
  activeView = v;
  ws.active = views.indexOf(v);
  for (const x of views) x.setActive(x === v && views.length > 1);
  syncHeader();
  syncStatus();
  syncTitle();
  watchlistList.setActive(v.state.symbol);
  marketsList.setActive(v.state.symbol);
  setToolUI(v.drawings.tool);
  tester.setView(v);
  newsPanel.syncSymbol();
  optionsPanel.syncSymbol();
  trading.onViewChange(v);
  saveWorkspace();
}

function setMaximized(v) {
  maximized = v;
  chartsEl.classList.toggle('has-max', !!v);
  for (const x of views) x.el.classList.toggle('max', x === v);
}

/** Mirror the crosshair (by real time) on the other charts. */
function syncCrosshair(src, param) {
  if (views.length < 2 || !syncSettings().crosshair) return;
  if (param.point && param.time != null) {
    crosshairOwner = src;
    const utc = src.utcAt(param.time);
    for (const v of views) if (v !== src) v.showCrosshairAt(utc);
  } else if (crosshairOwner === src) {
    crosshairOwner = null;
    for (const v of views) if (v !== src) v.showCrosshairAt(null);
  }
}

function popout(v) {
  const url = `${location.pathname}?popout=1#c=${encodeURIComponent(b64encode(JSON.stringify(v.state)))}`;
  const w = window.open(url, '_blank', 'popup=yes,width=1100,height=720');
  if (!w) toast(t('app.popupBlocked'));
}

// --- Sync across charts (Layout menu) ------------------------------------------------
// When the active chart's symbol or timeframe changes and that kind of sync is on, every
// other chart follows, including pop-out windows (through a BroadcastChannel). Pop-outs use
// the main window's settings.
const syncSettings = () => (POPOUT ? { ...DEFAULT_SYNC, ...store.get('workspace', null)?.sync } : ws.sync);
const syncChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('wickline-sync') : null;
let following = false;

function followAll(kind, value, src) {
  following = true; // the charts that follow must not broadcast in turn
  try {
    for (const v of views) {
      if (v === src) continue;
      if (kind === 'symbol') v.setSymbol(value); else v.setTimeframe(value);
    }
  } finally {
    following = false;
  }
}

function chartChanged(kind, v, value) {
  if (following || v !== activeView || !syncSettings()[kind]) return;
  followAll(kind, value, v);
  syncChannel?.postMessage({ kind, value });
}

if (syncChannel) {
  syncChannel.onmessage = (e) => {
    const { kind, value } = e.data || {};
    if ((kind === 'symbol' || kind === 'interval') && syncSettings()[kind]) followAll(kind, value, null);
  };
}

function setSync(kind, on) {
  ws.sync = { ...ws.sync, [kind]: on };
  saveWorkspace();
  renderLayoutMenu();
  if (!on || !activeView) {
    if (kind === 'crosshair' && !on) for (const v of views) v.showCrosshairAt(null);
    return;
  }
  // Turning it on brings every chart in line with the active one right away.
  if (kind === 'symbol') chartChanged('symbol', activeView, activeView.state.symbol);
  if (kind === 'interval') chartChanged('interval', activeView, activeView.state.tf);
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

// Timeframes (js/timeframe-ui.js): favourite buttons + ▾ menu, and the "Change interval" box
// that typing a number opens.
const tfBar = new TimeframeBar($('#tf-group'), {
  getTf: () => activeView?.state.tf,
  setTf: (id) => activeView?.setTimeframe(id),
  onResize: () => fitHeader(),
});
const intervalBox = new IntervalBox({
  apply: (id) => activeView?.setTimeframe(id),
  search: (text) => search.open('open', text),
});

$('#chart-type').innerHTML = CHART_TYPES.map(([k, label]) => `<option value="${k}">${label}</option>`).join('');

$('#ext-btn').addEventListener('click', () => {
  extendedHours.on = !extendedHours.on;
  // Reload intraday stock charts with (or without) pre/post-market bars.
  for (const v of views) {
    if (v.source === 'YAHOO' && !tfById(v.state.tf).daily) v.load();
  }
  syncHeader();
  toast(extendedHours.on ? t('app.ext.on') : t('app.ext.off'));
});

/**
 * Hides header button labels, a group at a time, until every button fits (rather than fixed
 * breakpoints, which break whenever a button is added or fonts differ).
 */
const topbar = $('.topbar');
const HEADER_STEPS = ['hdr-1', 'hdr-2', 'hdr-3', 'hdr-4', 'hdr-5', 'hdr-6'];
// If icons alone still don't fit, these move into the "⋯" menu, right-most first. The symbol,
// timeframes and chart type always stay on the bar.
const OVERFLOW = ['wl-btn', 'shot-btn', 'pop-btn', 'theme-btn', 'appearance-btn', 'settings-btn', 'log-btn', 'ext-btn',
  'layout-btn', 'alert-btn', 'tr-btn', 'rp-btn', 'st-btn', 'op-btn', 'nw-btn', 'hm-btn', 'sc-btn', 'ed-btn', 'ind-btn', 'compare-btn'];
const moreBtn = $('#more-btn');
const moreMenu = $('#more-menu');
const overflows = () => topbar.scrollWidth > topbar.clientWidth;
const shown = (el) => el.offsetParent !== null;
function fitHeader() {
  topbar.classList.remove(...HEADER_STEPS, 'hdr-7');
  for (const el of topbar.querySelectorAll('.ovf')) el.classList.remove('ovf');
  moreBtn.hidden = true;
  for (const c of HEADER_STEPS) {
    if (!overflows()) break;
    topbar.classList.add(c);
  }
  if (overflows()) {
    moreBtn.hidden = false;
    for (const id of OVERFLOW) {
      if (!overflows()) break;
      const b = document.getElementById(id);
      if (shown(b)) b.classList.add('ovf'); // ones already hidden (Ext off, pop-out window...) stay out of the menu
    }
    if (overflows()) topbar.classList.add('hdr-7'); // phones: only the active timeframe (the ▾ lists them all)
    // No divider left dangling before the spacer or another divider.
    for (const d of topbar.querySelectorAll('.divider')) {
      let n = d.nextElementSibling;
      while (n && !shown(n)) n = n.nextElementSibling;
      if (!n || n.matches('.divider, .spacer')) d.classList.add('ovf');
    }
  }
  if (moreBtn.hidden) moreMenu.hidden = true;
  else if (!moreMenu.hidden) renderMoreMenu();
}

const moreLabel = (b) => b.querySelector('span')?.textContent.trim() || b.title.split(/[:(：（]/)[0].trim() || b.textContent.trim();
function renderMoreMenu() {
  moreMenu.replaceChildren(...OVERFLOW.toReversed().map((id) => document.getElementById(id))
    .filter((b) => b.classList.contains('ovf'))
    .map((b) => {
      const item = document.createElement('button');
      item.className = `more-item${b.classList.contains('on') ? ' on' : ''}`;
      item.dataset.for = b.id;
      item.title = b.title;
      item.setAttribute('role', 'menuitem');
      const icon = document.createElement('span');
      icon.className = 'more-icon';
      icon.append(...[...b.querySelectorAll('svg')].map((s) => s.cloneNode(true)));
      const label = document.createElement('span');
      label.textContent = moreLabel(b);
      item.append(icon, label);
      return item;
    }));
}
moreBtn.addEventListener('click', () => {
  if (!moreMenu.hidden) { moreMenu.hidden = true; return; }
  renderMoreMenu();
  openMenu(moreMenu, moreBtn);
});
moreMenu.addEventListener('click', (e) => {
  const item = e.target.closest('[data-for]');
  if (!item) return;
  moreMenu.hidden = true;
  document.getElementById(item.dataset.for).click();
});
new ResizeObserver(fitHeader).observe(topbar);
document.fonts?.ready.then(fitHeader);

function syncHeader() {
  const v = activeView;
  if (!v) return;
  $('#symbol-ticker').textContent = v.ticker;
  tfBar.sync(v.state.tf); // highlights it, adding a button if it isn't a favourite
  // Extended hours only matter for stocks on intraday timeframes.
  const intraday = !tfById(v.state.tf).daily;
  $('#ext-btn').hidden = !(v.source === 'YAHOO' && intraday);
  $('#ext-btn').classList.toggle('on', extendedHours.on);
  $('#chart-type').value = v.state.chartType;
  queueMicrotask(fitHeader);
  $('#log-btn').classList.toggle('on', v.state.logScale);
  $('#rp-btn').classList.toggle('on', !!(v.replay || v.replayPick));
  $('#rp-btn').title = v.replay || v.replayPick ? t('app.hdr.rpExit') : t('app.hdr.rpTip');
  const src = SOURCES[v.source];
  $('#source').textContent = src?.crypto
    ? t('app.src.crypto', { name: src.name })
    : modeNow === 'static'
      ? t('app.src.static')
      : t('app.src.yahoo');
}

// ---------------------------------------------------------------------------
// Data sources (static site vs optional server) and settings
// ---------------------------------------------------------------------------

let modeNow = null;
const IS_DESKTOP = navigator.userAgent.includes('Electron');
const settingsModal = $('#settings-modal');

function syncDataMode() {
  const btn = $('#data-mode');
  btn.hidden = !modeNow;
  if (modeNow === 'server') btn.textContent = IS_DESKTOP ? t('app.mode.desktop') : t('app.mode.server');
  else btn.textContent = settings.tdKey ? t('app.mode.tdKey') : t('app.mode.cryptoOnly');
  btn.classList.toggle('warn', modeNow === 'static' && !settings.tdKey);
}

// Language: "System default", then each language under its own name (so anyone can find theirs).
$('#set-lang').innerHTML = `<option value="">${esc(t('app.set.langSystem'))}</option>`
  + LANGUAGES.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('');

function openSettings() {
  $('#set-lang').value = savedLang() ?? '';
  $('#set-td-key').value = settings.tdKey;
  $('#set-td-rate').value = settings.tdRate;
  $('#set-api').value = settings.apiBase;
  $('#set-status').textContent = '';
  $('#set-updates-row').hidden = !IS_DESKTOP;
  $('#set-updates').checked = store.get('updateCheck', true) !== false;
  $('#set-status').className = 'form-note set-status';
  // The Twelve Data key is only for the static website; with a server (the desktop app, `npm start`) nothing needs a key.
  const isStatic = modeNow !== 'server';
  $('#set-static').hidden = !isStatic;
  $('#set-adv').hidden = !isStatic;
  $('#set-test').hidden = !isStatic;
  $('#set-mode').innerHTML = !isStatic
    ? (IS_DESKTOP ? t('app.set.modeDesktop') : t('app.set.modeServer'))
    : t('app.set.modeStatic');
  openProxySettings(isStatic);
  settingsModal.hidden = false;
  if (isStatic) $('#set-td-key').focus();
}

// Network proxy: a setting of the desktop app itself (desktop/preload.cjs). A website goes through
// whatever proxy the browser uses, and `npm start` through the one in its WICKLINE_PROXY variable.
const desktopApi = window.wicklineDesktop || null;
let proxyLoaded = null;

async function openProxySettings(isStatic) {
  $('#set-proxy').hidden = !desktopApi;
  $('#set-proxy-web').hidden = !!desktopApi;
  $('#set-proxy-web').textContent = isStatic ? t('app.proxy.webStatic') : t('app.proxy.webServer');
  proxyLoaded = null;
  if (!desktopApi) return;
  const p = await desktopApi.getProxy().catch(() => null);
  if (!p) { $('#set-proxy').hidden = true; return; }
  proxyLoaded = p;
  $('#set-proxy-mode').value = p.mode;
  $('#set-proxy-server').value = p.server;
  syncProxyRow();
  showProxyNow(p);
}

function showProxyNow(p) {
  $('#set-proxy-now').textContent = p.active && p.active !== 'direct'
    ? t('app.proxy.now', { proxy: p.active }) : p.mode === 'off' ? '' : t('app.proxy.direct');
}

function syncProxyRow() {
  $('#set-proxy-row').hidden = $('#set-proxy-mode').value !== 'manual';
}

$('#set-proxy-mode').addEventListener('change', () => {
  syncProxyRow();
  if ($('#set-proxy-mode').value === 'manual') $('#set-proxy-server').focus();
});

// Why the desktop app can't use a proxy comes in English (lib/proxy.mjs): shown in the UI language.
const PROXY_ERRORS = {
  'Enter the proxy as host:port, e.g. 127.0.0.1:7890.': 'app.proxy.err.empty',
  'That isn\'t a proxy address. Use host:port, e.g. 127.0.0.1:7890.': 'app.proxy.err.invalid',
  'The proxy address needs a host.': 'app.proxy.err.host',
  'Enter only the proxy\'s host and port, no path.': 'app.proxy.err.path',
  'Add the proxy\'s port, e.g. 127.0.0.1:7890.': 'app.proxy.err.port',
  'Proxies that need a password aren\'t supported. Use a local proxy app, or "Use system proxy".': 'app.proxy.err.auth',
};
function proxyError(msg) {
  if (!msg) return t('app.proxy.failed');
  if (PROXY_ERRORS[msg]) return t(PROXY_ERRORS[msg]);
  const type = /^Unsupported proxy type "(.*)"\. Use http:\/\/, https:\/\/ or socks5:\/\/\.$/.exec(msg);
  return type ? t('app.proxy.err.scheme', { type: type[1] }) : msg;
}

/** Saves a changed proxy setting; false (with the reason shown) if it can't be used. */
async function saveProxySettings() {
  if (!desktopApi || !proxyLoaded) return true;
  const next = { mode: $('#set-proxy-mode').value, server: $('#set-proxy-server').value.trim() };
  if (next.mode === proxyLoaded.mode && next.server === proxyLoaded.server) return true;
  const r = await desktopApi.setProxy(next).catch((e) => ({ ok: false, error: e.message }));
  if (r?.ok) return true;
  const status = $('#set-status');
  status.textContent = proxyError(r?.error);
  status.className = 'form-note set-status bad';
  if (next.mode === 'manual') $('#set-proxy-server').focus();
  return false;
}

$('#settings-btn').addEventListener('click', openSettings);
$('#data-mode').addEventListener('click', openSettings);
settingsModal.addEventListener('mousedown', (e) => { if (e.target === settingsModal) settingsModal.hidden = true; });
settingsModal.querySelector('.close').addEventListener('click', () => { settingsModal.hidden = true; });
settingsModal.addEventListener('keydown', (e) => e.stopPropagation());
$('#set-test').addEventListener('click', async () => {
  const status = $('#set-status');
  const key = $('#set-td-key').value.trim();
  if (!key) { status.textContent = t('app.set.pasteKey'); status.className = 'form-note set-status bad'; return; }
  status.textContent = t('app.set.checking');
  status.className = 'form-note set-status';
  try {
    const u = await tdCheckKey(key);
    status.textContent = t('app.set.keyWorks', { plan: u.plan_category || t('app.set.plan'), used: u.current_usage ?? 0, limit: u.plan_limit ?? '?' });
    status.className = 'form-note set-status ok';
  } catch (e) {
    status.textContent = t('app.set.keyFailed', { error: e.message });
    status.className = 'form-note set-status bad';
  }
});
$('#settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!(await saveProxySettings())) return;
  settings.set('tdKey', $('#set-td-key').value.trim());
  settings.set('tdRate', Math.max(1, Math.round(Number($('#set-td-rate').value) || 8)));
  settings.set('apiBase', $('#set-api').value.trim());
  setLang($('#set-lang').value || null); // '' = follow the system
  settingsModal.hidden = true;
  location.reload(); // simplest way to reconnect every chart with the new sources
});

function syncStatus() {
  const s = activeView?.status || 'connecting';
  $('#status').className = `status ${s}`;
  $('#status-text').textContent = STATUS_TEXT[s] || s;
}

function syncTitle() {
  const v = activeView;
  if (!v) return;
  const last = v.lastBar;
  const prev = v.bars[v.bars.length - 2];
  if (!last || !v.feed) { document.title = `${v.ticker} · Wickline`; return; } // loading or failed
  if (v.replay) { document.title = t('app.titleReplay', { ticker: v.ticker, price: v.formatPrice(last.close) }); return; }
  const pct = prev ? ((last.close - prev.close) / prev.close) * 100 : 0;
  document.title = `${v.ticker} ${v.formatPrice(last.close)} ${pct >= 0 ? '▲' : '▼'}${fixed(Math.abs(pct), 2)}% · Wickline`;
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
}

$('#chart-type').addEventListener('change', (e) => activeView?.setChartType(e.target.value));
$('#log-btn').addEventListener('click', () => activeView?.setLogScale(!activeView.state.logScale));
$('#shot-btn').addEventListener('click', () => activeView?.screenshot());
$('#pop-btn').addEventListener('click', () => activeView && popout(activeView));
$('#compare-btn').addEventListener('click', () => search.open('compare'));
$('#wl-btn').addEventListener('click', () => {
  document.body.classList.toggle(window.innerWidth > 900 ? 'wl-closed' : 'wl-open');
});

// Theme: light/dark, presets and the user's own colors (js/theme.js)
function applyTheme(name) {
  document.documentElement.dataset.theme = name;
  store.set('theme', name);
  applyAppearance();
  if (!appearModal.hidden) renderAppearance();
}
$('#theme-btn').addEventListener('click', () => applyTheme(currentMode() === 'light' ? 'dark' : 'light'));

const appearModal = $('#appearance-modal');
function renderAppearance() {
  const mode = currentMode();
  $('#appear-presets').innerHTML = Object.entries(PRESETS).map(([id, p]) => {
    const c = p[mode];
    return `<button type="button" class="appear-preset${id === presetId() ? ' on' : ''}" data-preset="${id}">
      <span class="appear-swatch" style="background:${c.chartBg}">
        <i style="background:${c.up}"></i><i style="background:${c.down}"></i><i style="background:${c.accent}"></i>
      </span>${esc(p.name)}</button>`;
  }).join('');
  const custom = isCustomized(mode);
  const editing = { mode: mode === 'dark' ? t('theme.mode.dark') : t('theme.mode.light'), preset: PRESETS[presetId()].name };
  $('#appear-mode-label').textContent = custom ? t('theme.editingCustom', editing) : t('theme.editing', editing);
  $('#appear-mode-switch').textContent = mode === 'dark' ? t('theme.editLight') : t('theme.editDark');
  $('#appear-reset').hidden = !custom;
  const p = palette(mode);
  let group = '';
  $('#appear-fields').innerHTML = FIELDS.map((f) => {
    const head = f.group !== group ? `<div class="appear-group">${esc((group = f.group))}</div>` : '';
    return `${head}<label class="appear-field"><input type="color" data-key="${f.key}" value="${p[f.key]}"><span>${esc(f.label)}</span>
      <code>${p[f.key]}</code></label>`;
  }).join('');
}
function openAppearance() {
  renderAppearance();
  appearModal.hidden = false;
}
$('#appearance-btn').addEventListener('click', openAppearance);
appearModal.addEventListener('click', (e) => {
  if (e.target === appearModal || e.target.closest('.close, .appear-done')) { appearModal.hidden = true; return; }
  const preset = e.target.closest('[data-preset]');
  if (preset) { setPreset(preset.dataset.preset); renderAppearance(); }
});
$('#appear-fields').addEventListener('input', (e) => {
  const key = e.target.dataset?.key;
  if (!key) return;
  setColor(key, e.target.value, { live: true }); // charts follow a moment after the picker stops moving
  e.target.parentElement.querySelector('code').textContent = e.target.value.toUpperCase();
});
$('#appear-fields').addEventListener('change', () => renderAppearance());
$('#appear-mode-switch').addEventListener('click', () => applyTheme(currentMode() === 'light' ? 'dark' : 'light'));
$('#appear-reset').addEventListener('click', () => { resetColors(); renderAppearance(); });
applyAppearance();

// Layout picker
const layoutMenu = $('#layout-menu');
function renderLayoutMenu() {
  const sync = ws.sync || DEFAULT_SYNC;
  const linked = sync.symbol || sync.interval;
  $('#layout-btn').innerHTML = `${layoutIcon(ws.layout)}<span>${esc(t('app.hdr.layout'))}</span>${linked ? `<i class="sync-dot" title="${esc(t('app.layout.synced'))}"></i>` : ''}`;
  $('#layout-btn').title = linked ? t('app.hdr.layoutTipSynced') : t('app.hdr.layoutTip');
  const check = (kind, label, hint) => `<label class="menu-check" title="${esc(hint)}">
      <input type="checkbox" data-sync="${kind}"${sync[kind] ? ' checked' : ''}><span>${esc(label)}</span></label>`;
  // One row per chart count, a button for each shape.
  const counts = [...new Set(LAYOUTS.map((l) => l.n))];
  layoutMenu.innerHTML = `<div class="menu-title">${esc(t('app.charts'))}</div>`
    + counts.map((n) => `<div class="layout-row"><span class="layout-n">${n}</span>${LAYOUTS.filter((l) => l.n === n).map((l) => `
      <button class="layout-pick${l.id === ws.layout ? ' on' : ''}" data-layout="${l.id}" title="${esc(l.title)}" aria-label="${esc(l.title)}">${layoutIcon(l.id)}</button>`).join('')}
    </div>`).join('')
    + `<div class="menu-sep"></div><div class="menu-title">${esc(t('app.layout.sync'))}</div>
    ${check('symbol', t('common.symbol'), t('app.layout.syncSymbolTip'))}
    ${check('interval', t('app.hdr.timeframe'), t('app.layout.syncIntervalTip'))}
    ${check('crosshair', t('app.layout.crosshair'), t('app.layout.syncCrosshairTip'))}`;
}

function openMenu(menu, anchor, { above = false, side = false } = {}) {
  menu.hidden = false;
  const r = anchor.getBoundingClientRect();
  if (side) {
    menu.style.left = `${r.right + 4}px`;
    menu.style.top = `${Math.min(r.top, window.innerHeight - menu.offsetHeight - 8)}px`;
  } else {
    menu.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = above ? `${r.top - menu.offsetHeight - 4}px` : `${r.bottom + 4}px`;
  }
}

$('#layout-btn').addEventListener('click', () => {
  if (!layoutMenu.hidden) { layoutMenu.hidden = true; return; }
  const b = $('#layout-btn');
  openMenu(layoutMenu, b.classList.contains('ovf') ? moreBtn : b); // picked from the "⋯" menu
});
layoutMenu.addEventListener('click', (e) => {
  const b = e.target.closest('[data-layout]');
  if (!b) return;
  layoutMenu.hidden = true;
  applyLayout(b.dataset.layout);
});
layoutMenu.addEventListener('change', (e) => {
  const kind = e.target.dataset?.sync;
  if (kind) setSync(kind, e.target.checked);
});

document.addEventListener('mousedown', (e) => {
  for (const [menu, owner] of [[layoutMenu, '#layout-btn'], [toolMenu, '[data-more]'], [moreMenu, '#more-btn']]) {
    if (!menu.hidden && !menu.contains(e.target) && !e.target.closest(owner)) menu.hidden = true;
  }
});

// ---------------------------------------------------------------------------
// Drawing toolbar (grouped, with flyouts)
// ---------------------------------------------------------------------------

const toolMenu = $('#tool-menu');
const groupTool = store.get('toolGroups', {});
const currentOf = (g) => (g.tools.includes(groupTool[g.id]) ? groupTool[g.id] : g.tools[0]);
const toolTitle = (id) => `${TOOLS[id].label}${TOOL_KEYS[id] ? ` (${TOOL_KEYS[id]})` : ''}`;

function renderToolbar() {
  $('#toolbar').innerHTML = TOOL_GROUPS.map((g) => {
    const tool = currentOf(g);
    return `<div class="tool-group" data-group="${g.id}">
      <button data-tool="${tool}" title="${toolTitle(tool)}" aria-label="${TOOLS[tool].label}">${TOOL_ICONS[tool]}</button>
      ${g.tools.length > 1 ? `<button class="tool-more" data-more="${g.id}" title="${esc(t('app.tool.more'))}" aria-label="${esc(t(`app.tool.moreGroup.${g.id}`))}"></button>` : ''}
    </div>`;
  }).join('') + `<div class="tool-sep"></div>
    <button id="clear-drawings" title="${esc(t('app.tool.clearAll'))}" aria-label="${esc(t('app.tool.clearAll'))}">${svg(`<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" ${S}/>`)}</button>`;
  setToolUI(activeView?.drawings.tool || 'cursor');
}

function setToolUI(tool) {
  document.querySelectorAll('#toolbar [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === tool));
  for (const v of views) v.chartEl.classList.toggle('drawing', v === activeView && tool !== 'cursor');
}

function selectTool(tool) {
  const g = TOOL_GROUPS.find((x) => x.tools.includes(tool));
  if (g && currentOf(g) !== tool) {
    groupTool[g.id] = tool;
    store.set('toolGroups', groupTool);
    renderToolbar();
  }
  activeView?.setTool(tool);
  setToolUI(tool);
}

$('#toolbar').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || !activeView) return;
  if (b.dataset.more) {
    const g = TOOL_GROUPS.find((x) => x.id === b.dataset.more);
    toolMenu.innerHTML = g.tools.map((id) => `<button class="layout-opt" data-pick="${id}">${TOOL_ICONS[id]}<span>${TOOLS[id].label}</span><kbd>${TOOL_KEYS[id] || ''}</kbd></button>`).join('');
    openMenu(toolMenu, b.closest('.tool-group'), { side: true });
    return;
  }
  if (b.dataset.tool) selectTool(b.dataset.tool);
  if (b.id === 'clear-drawings') {
    if (!activeView.drawings.items.length) { toast(t('app.tool.none')); return; }
    if (confirm(t('app.tool.confirmClear', { ticker: activeView.ticker }))) activeView.clearDrawings();
  }
});
toolMenu.addEventListener('click', (e) => {
  const b = e.target.closest('[data-pick]');
  if (!b) return;
  toolMenu.hidden = true;
  selectTool(b.dataset.pick);
});

// ---------------------------------------------------------------------------
// Indicators dialog (built-ins by category + your scripts)
// ---------------------------------------------------------------------------

const indModal = $('#ind-modal');
let indCat = 'All'; // a category id (English), also 'All', 'My scripts' and 'Community'
const catLabel = (c) => (c === 'All' ? t('common.all') : c === 'My scripts' ? t('app.ind.mine')
  : c === 'Community' ? t('app.ind.community') : categoryLabel(c));

function renderIndicatorList() {
  const f = $('#ind-search').value.trim().toLowerCase();
  const cats = ['All', ...CATEGORIES, 'My scripts', 'Community'];
  $('#ind-cats').innerHTML = cats.map((c) => {
    const count = c === 'All' ? Object.keys(INDICATORS).length : c === 'My scripts' ? scriptStore.list().length
      : c === 'Community' ? (communityCount() ?? '')
        : Object.values(INDICATORS).filter((d) => d.category === c).length;
    return `<button data-cat="${esc(c)}" class="${c === indCat ? 'on' : ''}">${esc(catLabel(c))}<small>${count}</small></button>`;
  }).join('');

  if (indCat === 'Community') {
    $('#ind-list').innerHTML = communityHtml(f);
    return;
  }
  const match = (name, extra = '') => !f || name.toLowerCase().includes(f) || extra.toLowerCase().includes(f);
  let html = '';
  if (indCat === 'My scripts' || (indCat === 'All' && f)) {
    const scripts = scriptStore.list().filter((s) => match(s.name)).sort((a, b) => a.name.localeCompare(b.name));
    if (indCat === 'My scripts') {
      html += `<button class="ind-item ind-new" data-new="1"><span class="ind-name">${esc(t('app.ind.newScript'))}</span>
        <span class="ind-desc">${esc(t('app.ind.newScriptDesc'))}</span></button>`;
    }
    html += scripts.map((s) => `<div class="ind-item ind-script" data-script="${esc(s.id)}" role="button" tabindex="0">
        <span class="ind-name">${esc(s.name)}</span><span class="ind-desc">${esc(!s.community ? t('app.ind.yourScript') : isOfficial(s.community) ? t('app.ind.official')
          : t('app.ind.fromCommunity', { author: authorLabel(s.community) }))}</span>
        <button class="ind-edit" data-edit="${esc(s.id)}">${esc(t('common.edit'))}</button></div>`).join('');
    if (indCat === 'My scripts' && !scripts.length) html += `<div class="sr-empty">${esc(t('app.ind.noScripts'))}</div>`;
  }
  if (indCat !== 'My scripts') {
    html += Object.entries(INDICATORS)
      .filter(([, d]) => (indCat === 'All' || d.category === indCat) && match(d.name, `${d.short} ${d.description}`))
      .map(([key, d]) => `<button class="ind-item" data-type="${key}">
          <span class="ind-name">${esc(d.name)}</span>
          <span class="ind-desc">${esc(d.description)}${d.overlay ? '' : esc(t('app.ind.separatePane'))}</span>
        </button>`).join('');
  }
  $('#ind-list').innerHTML = html || `<div class="sr-empty">${esc(t('app.ind.noMatches'))}</div>`;
}

const rerenderIndicators = () => { if (!indModal.hidden) renderIndicatorList(); };

function openIndicators() {
  indModal.hidden = false;
  $('#ind-search').value = '';
  renderIndicatorList();
  $('#ind-search').focus();
  loadCommunity({ onDone: rerenderIndicators }); // for the Community count
}

$('#ind-btn').addEventListener('click', openIndicators);
let indSearchTimer = 0; // re-render once typing pauses, not on every key
$('#ind-search').addEventListener('input', () => { clearTimeout(indSearchTimer); indSearchTimer = setTimeout(renderIndicatorList, 100); });
$('#ind-cats').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  indCat = b.dataset.cat;
  renderIndicatorList();
  if (indCat === 'Community') loadCommunity({ onDone: rerenderIndicators });
});
indModal.addEventListener('mousedown', (e) => { if (e.target === indModal) indModal.hidden = true; });
indModal.querySelector('.close').addEventListener('click', () => { indModal.hidden = true; });

/** Community list clicks: sort/filter, publish, retry, code, like, update, or add to the chart. */
async function onCommunityClick(e) {
  const target = e.target;
  const sort = target.closest('[data-cm-sort]'), kind = target.closest('[data-cm-kind]');
  if (sort || kind) { setCommunityView({ sort: sort?.dataset.cmSort, kind: kind?.dataset.cmKind }); renderIndicatorList(); return true; }
  if (target.closest('[data-cm-retry]')) { loadCommunity({ refresh: true, onDone: rerenderIndicators }); renderIndicatorList(); return true; }
  if (target.closest('[data-cm-publish]')) {
    indModal.hidden = true;
    editor.open();
    editor.print('info', t('app.ind.publishHint'));
    return true;
  }
  const like = target.closest('[data-cm-like]');
  if (like) { const s = communityEntry(like.dataset.cmLike); if (s) window.open(likeUrl(s), '_blank', 'noopener'); return true; }
  const code = target.closest('[data-cm-code]');
  if (code) {
    const s = communityEntry(code.dataset.cmCode);
    if (!s) return true;
    try {
      const copy = installedCopy(s);
      if (copy) { indModal.hidden = true; editor.edit(copy.id); return true; }
      const text = await fetchCommunityCode(s);
      indModal.hidden = true;
      if (editor.confirmDiscard()) editor.loadTemplate({ name: t('app.ind.nameBy', { name: s.name, author: authorLabel(s) }), code: text });
      editor.open();
    } catch (err) { toast(err.message); }
    return true;
  }
  const upd = target.closest('[data-cm-update]');
  const row = target.closest('[data-comm]');
  if (!upd && !row) return false;
  const s = communityEntry(upd ? upd.dataset.cmUpdate : row.dataset.comm);
  if (!s) return true;
  if (upd && !confirm(t('app.ind.confirmUpdate', { name: s.name }))) return true;
  try {
    const id = await installCommunity(s, { update: !!upd });
    if (upd) { toast(t('app.ind.updated', { name: s.name })); renderIndicatorList(); return true; }
    if (!activeView) return true;
    if (!activeView.hasScript(id)) activeView.addScript(id);
    indModal.hidden = true;
    toast(t('app.ind.addedBy', { name: s.name, author: authorLabel(s) }));
  } catch (err) { toast(err.message); }
  return true;
}

$('#ind-list').addEventListener('click', async (e) => {
  if (indCat === 'Community' && await onCommunityClick(e)) return;
  if (!activeView) return;
  const edit = e.target.closest('[data-edit]');
  if (edit) { indModal.hidden = true; editor.edit(edit.dataset.edit); return; }
  if (e.target.closest('[data-new]')) {
    indModal.hidden = true;
    if (editor.confirmDiscard()) editor.loadTemplate(TEMPLATES[0]);
    editor.open();
    return;
  }
  const script = e.target.closest('[data-script]');
  if (script) {
    activeView.addScript(script.dataset.script);
    indModal.hidden = true;
    toast(t('app.ind.added', { name: scriptStore.get(script.dataset.script)?.name || t('app.ind.script') }));
    return;
  }
  const item = e.target.closest('[data-type]');
  if (!item) return;
  const added = activeView.addIndicator(item.dataset.type);
  indModal.hidden = true;
  toast(added ? t('app.ind.added', { name: INDICATORS[item.dataset.type].name }) : t('app.ind.volumeOn'));
});

// ---------------------------------------------------------------------------
// Script editor
// ---------------------------------------------------------------------------

const editor = new ScriptEditor({ getView: () => activeView, toast });
$('#ed-btn').addEventListener('click', () => editor.toggle());

const tester = new StrategyTester({
  getView: () => activeView, toast,
  browseStrategies: () => { indCat = 'Community'; setCommunityView({ kind: 'strategy' }); openIndicators(); },
});
onAppearanceChange(() => tester.applyTheme());
$('#st-btn').addEventListener('click', () => { tester.setView(activeView); tester.toggle(); });

// Paper trading and bar replay.
const trading = new TradingPanel({
  getView: () => activeView,
  getViews: () => views,
  toast,
  onPick: (full) => activeView?.setSymbol(full),
  evaluate: !POPOUT,
});
$('#tr-btn').addEventListener('click', () => trading.toggle());
$('#rp-btn').addEventListener('click', () => {
  const v = activeView;
  if (!v) return;
  if (v.replay || v.replayPick) v.stopReplay();
  else if (!v.startReplayPick()) toast(t('app.rp.wait'));
  syncHeader();
});

// Screener: rows open on the active chart.
const screener = new Screener({
  onPick: (full) => activeView?.setSymbol(full),
  getActiveSymbol: () => activeView?.state.symbol.replace(/^YAHOO:/, ''),
});
$('#sc-btn').addEventListener('click', () => screener.toggle());

// Stock heatmap: tiles open on the active chart.
const heatmap = new HeatmapPanel({ onPick: (full) => activeView?.setSymbol(full) });
$('#hm-btn').addEventListener('click', () => heatmap.toggle());

// News: tickers open on the active chart; the symbol tab follows the active chart.
const newsPanel = new NewsPanel({
  onPick: (full) => activeView?.setSymbol(full),
  getActiveSymbol: () => activeView?.state.symbol,
});
$('#nw-btn').addEventListener('click', () => newsPanel.toggle());

// Options: the option chain of the active chart's symbol; a contract opens its own chart there.
const optionsPanel = new OptionsPanel({
  onPick: (full) => activeView?.setSymbol(full),
  getActiveSymbol: () => activeView?.state.symbol,
});
$('#op-btn').addEventListener('click', () => optionsPanel.toggle());
scriptStore.onChange(() => { if (!indModal.hidden) renderIndicatorList(); });

// ---------------------------------------------------------------------------
// Side panel: watchlist, markets, alerts
// ---------------------------------------------------------------------------

// Symbols and section headings in order (public/js/watchlist.js); collapsed sections by name.
let watchSymbols = cleanList(store.get('watchlist', DEFAULT_WATCHLIST)) || [...DEFAULT_WATCHLIST];
const collapsedSections = new Set(store.get('watchlistCollapsed', []));
const saveCollapsed = () => store.set('watchlistCollapsed', [...collapsedSections]);
const watchlistList = new QuoteList($('#wl-rows'), {
  onSelect: (full) => activeView?.setSymbol(full),
  onRemove: (full) => setWatchlist(watchSymbols.filter((s) => s !== full)),
  onMove: (from, to) => setWatchlist(moveEntry(watchSymbols, from, to)),
  sections: {
    onToggle: (name) => {
      if (collapsedSections.has(name)) collapsedSections.delete(name); else collapsedSections.add(name);
      saveCollapsed();
      setWatchlist(watchSymbols);
    },
    onRename: (name, to) => {
      const next = renameSection(watchSymbols, name, to);
      if (collapsedSections.delete(name)) { collapsedSections.add(next.name); saveCollapsed(); }
      setWatchlist(next.list);
    },
    onRemove: (name) => {
      if (collapsedSections.delete(name)) saveCollapsed();
      setWatchlist(removeSection(watchSymbols, name));
    },
  },
  empty: t('app.wl.empty'),
  useCredits: true,
});

function setWatchlist(list) {
  watchSymbols = cleanList(list) || [];
  store.set('watchlist', watchSymbols);
  watchlistList.setItems(watchSymbols.map((e) => (isSection(e)
    ? { section: sectionName(e), collapsed: collapsedSections.has(sectionName(e)) }
    : { full: e })));
  watchlistList.setActive(activeView?.state.symbol);
  marketsList.refreshStars();
}

// Markets: complete markets (every US stock and ETF, every crypto pair), curated lists, screeners.
const marketsList = new MarketBrowser($('#mk-rows'), $('#mk-count'), {
  onSelect: (full) => activeView?.setSymbol(full),
  onStar: (full) => {
    const on = watchSymbols.includes(full);
    setWatchlist(on ? watchSymbols.filter((s) => s !== full) : [...watchSymbols, full]);
    toast(on ? t('app.wl.removed', { ticker: displayTicker(full) }) : t('app.wl.added', { ticker: displayTicker(full) }));
  },
  isStarred: (full) => watchSymbols.includes(full),
});

const mkSelect = $('#mk-group');
const mkSector = $('#mk-sector');
const option = (g) => `<option value="${g.id}">${esc(g.title)}${g.items ? ` (${g.items.length})` : ''}</option>`;
function buildMarketSelect(server) {
  // Yahoo screeners need the server; on a static site the US lists are names only and
  // prices fill in from the live stream.
  const usLabel = server ? t('app.mk.complete') : t('app.mk.completeStatic');
  mkSelect.innerHTML = `
    <optgroup label="${esc(usLabel)}">${MARKET_GROUPS.filter((g) => g.universe).map(option).join('')}</optgroup>
    <optgroup label="${esc(t('app.mk.popular'))}">${MARKET_GROUPS.filter((g) => g.items).map(option).join('')}</optgroup>
    ${server ? `<optgroup label="${esc(t('app.mk.screeners'))}">${MARKET_GROUPS.filter((g) => g.screener).map(option).join('')}</optgroup>` : ''}`;
  mkSelect.value = store.get('marketGroup', 'all:us-stocks');
  if (!mkSelect.value) mkSelect.value = 'all:us-stocks';
}
buildMarketSelect(false);

// Popular ETFs first in the full ETF list (the source has no size or volume data).
const ETF_POPULAR = new Map((MARKET_GROUPS.find((g) => g.id === 'etfs')?.items || [])
  .map((it, i, a) => [it.full, a.length - i + 1e6]));
const universeCache = new Map(); // id -> { t, rows }

async function universeRows(id) {
  const hit = universeCache.get(id);
  if (hit && Date.now() - hit.t < 10 * 60 * 1000) return hit.rows;
  let rows = await loadUniverse(id);
  if (id === 'us-etfs') rows = rows.map((r) => ({ ...r, rank: ETF_POPULAR.get(r.full) || 0 }));
  universeCache.set(id, { t: Date.now(), rows });
  return rows;
}

let marketsSeq = 0;
let marketsLoaded = null;
async function loadMarketGroup() {
  const g = MARKET_GROUPS.find((x) => x.id === mkSelect.value) || MARKET_GROUPS[0];
  store.set('marketGroup', g.id);
  marketsLoaded = g.id;
  const seq = ++marketsSeq;
  $('#mk-filter').value = '';
  marketsList.filter = '';
  marketsList.sector = '';
  mkSector.hidden = true;
  const done = (rows) => {
    if (seq !== marketsSeq) return;
    marketsList.setRows(rows);
    const sectors = g.filterLabel ? marketsList.sectors() : [];
    mkSector.hidden = sectors.length < 2;
    mkSector.innerHTML = `<option value="">${esc(g.filterLabel || t('common.all'))}</option>`
      + sectors.map(([s, n]) => `<option value="${esc(s)}">${esc(sectorName(s))} (${n.toLocaleString(locale)})</option>`).join('');
    marketsList.setActive(activeView?.state.symbol);
  };
  if (g.items) {
    done(g.items.map((it, i, a) => ({ ...it, ticker: displayTicker(it.full), rank: a.length - i })));
    return;
  }
  marketsList.setMessage(g.universe ? t('app.mk.loading', { list: lang === 'en' ? g.title.toLowerCase() : g.title }) : t('common.loading'));
  try {
    if (g.universe) {
      done(await universeRows(g.universe));
    } else {
      const r = await fetch(apiUrl(`api/yahoo/screener?id=${encodeURIComponent(g.screener)}`));
      const rows = await r.json();
      if (!r.ok) throw new Error(rows?.error || t('common.error'));
      done(rows.map((q, i, a) => ({
        full: `YAHOO:${q.symbol}`, ticker: q.symbol, name: q.name, price: q.price, change: q.change, precision: q.precision, rank: a.length - i,
      })));
    }
  } catch (e) {
    if (seq === marketsSeq) marketsList.setMessage(t('app.mk.failed', { error: e.message }));
  }
}
mkSelect.addEventListener('change', loadMarketGroup);
mkSector.addEventListener('change', () => marketsList.setSector(mkSector.value));
$('#mk-sort').addEventListener('change', (e) => marketsList.setSort(e.target.value));
let filterTimer;
$('#mk-filter').addEventListener('input', (e) => {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => marketsList.setFilter(e.target.value), 120);
});
$('#mk-filter').addEventListener('keydown', (e) => e.stopPropagation());

function showTab(tab) {
  store.set('sideTab', tab);
  document.querySelectorAll('.side-tabs [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  document.querySelectorAll('.side-panel').forEach((p) => { p.hidden = p.dataset.panel !== tab; });
  if (tab === 'markets') {
    if (marketsLoaded !== mkSelect.value) loadMarketGroup();
    else marketsList.resume();
  } else {
    marketsList.stop(); // don't stream quotes for a hidden list
  }
}
document.querySelector('.side-tabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) showTab(b.dataset.tab);
});
$('#wl-add').addEventListener('click', () => search.open('add'));
$('#wl-sec-add').addEventListener('click', () => {
  const { list, name } = addSection(watchSymbols, t('wl.newSection'));
  setWatchlist(list);
  watchlistList.el.scrollTop = watchlistList.el.scrollHeight;
  watchlistList.editSection(name); // type its name right away
});
$('#wl-browse').addEventListener('click', () => showTab('markets'));

// Alerts
const alertModal = $('#alert-modal');
let alertSymbol = null;

const alerts = new AlertManager({
  evaluate: !POPOUT,
  onTrigger: (a) => {
    const what = alertText(a.condition, displayTicker(a.symbol), formatNumber(a.price, smartDecimals(a.price)));
    chime();
    const card = document.createElement('div');
    card.className = 'alert-toast';
    card.innerHTML = `<b>🔔 ${esc(what)}</b><span>${esc(t('alert.now', { price: formatNumber(a.triggerPrice, smartDecimals(a.triggerPrice)) }))}${a.message ? ` · ${esc(a.message)}` : ''}</span><button aria-label="${esc(t('alert.dismiss'))}">×</button>`;
    card.querySelector('button').addEventListener('click', () => card.remove());
    card.addEventListener('click', (e) => { if (!e.target.closest('button')) { activeView?.setSymbol(a.symbol); card.remove(); } });
    $('#alert-toasts').prepend(card);
    setTimeout(() => card.remove(), 60000);
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(`Wickline: ${what}`, { body: a.message || t('alert.notifyBody', { price: a.triggerPrice }), tag: a.id }); } catch { /* ignore */ }
    }
  },
  onChange: (items) => {
    for (const v of views) v.setAlerts(items);
    renderAlerts(items);
  },
});

function renderAlerts(items = alerts.items) {
  const active = items.filter((a) => a.active).length;
  const badge = $('#alert-count');
  badge.hidden = !active;
  badge.textContent = active;
  $('#al-rows').innerHTML = items.map((a) => {
    const price = formatNumber(a.price, smartDecimals(a.price));
    const meta = a.active ? t('alert.active') : t('alert.triggered', {
      time: new Date(a.triggeredAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      price: formatNumber(a.triggerPrice, smartDecimals(a.triggerPrice)),
    });
    return `<div class="al-row${a.active ? '' : ' done'}" data-al-sym="${esc(a.symbol)}">
      <div class="al-main"><b>${esc(displayTicker(a.symbol))}</b> ${esc(CONDITIONS[a.condition])} <b>${price}</b>
        ${a.message ? `<small>${esc(a.message)}</small>` : ''}<small class="${a.active ? 'up' : 'muted'}">${esc(meta)}</small></div>
      <div class="al-actions">
        ${a.active ? '' : `<button data-al="rearm" data-id="${a.id}" title="${esc(t('alert.restart'))}">↻</button>`}
        <button data-al="del" data-id="${a.id}" title="${esc(t('common.delete'))}" aria-label="${esc(t('common.delete'))}">×</button>
      </div></div>`;
  }).join('') || `<div class="wl-empty">${esc(t('alert.empty'))}</div>`;
}

$('#al-rows').addEventListener('click', (e) => {
  const b = e.target.closest('[data-al]');
  if (b) {
    if (b.dataset.al === 'del') alerts.remove(b.dataset.id);
    if (b.dataset.al === 'rearm') alerts.rearm(b.dataset.id);
    return;
  }
  const row = e.target.closest('[data-al-sym]');
  if (row) activeView?.setSymbol(row.dataset.alSym);
});
$('#al-add').addEventListener('click', () => openAlertDialog());
$('#al-clear').addEventListener('click', () => alerts.clearTriggered());
$('#alert-btn').addEventListener('click', () => openAlertDialog());

function openAlertDialog(symbol = activeView?.state.symbol, price = null) {
  if (!symbol) return;
  alertSymbol = symbol;
  $('#al-symbol').textContent = displayTicker(symbol);
  let p = price;
  if (p == null) {
    const v = views.find((x) => x.state.symbol === symbol && x.lastBar);
    p = v?.lastBar.close ?? watchlistList.lastPrice(symbol) ?? null;
  }
  const v = views.find((x) => x.state.symbol === symbol);
  const decimals = v?.meta.precision ?? (p != null ? smartDecimals(p) : 2);
  $('#al-price').value = p != null ? Number(p).toFixed(decimals) : '';
  $('#al-msg').value = '';
  alertModal.hidden = false;
  $('#al-price').focus();
  $('#al-price').select();
}

$('#al-symbol').addEventListener('click', () => { alertModal.hidden = true; search.open('alert'); });
alertModal.addEventListener('mousedown', (e) => { if (e.target === alertModal) alertModal.hidden = true; });
alertModal.querySelectorAll('.close').forEach((b) => b.addEventListener('click', () => { alertModal.hidden = true; }));
$('#alert-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const price = Number($('#al-price').value);
  if (!alertSymbol || !Number.isFinite(price)) return;
  alerts.add({ symbol: alertSymbol, condition: $('#al-cond').value, price, message: $('#al-msg').value.trim() });
  alertModal.hidden = true;
  toast(t('alert.set', { what: alertText($('#al-cond').value, displayTicker(alertSymbol), price) }));
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

const search = new SymbolSearch({
  onSelect: (full, mode) => {
    if (mode === 'add') { setWatchlist([...watchSymbols, full]); toast(t('app.wl.added', { ticker: displayTicker(full) })); }
    else if (mode === 'compare') {
      if (activeView?.addCompare(full)) toast(t('app.cmp.on', { ticker: displayTicker(full) }));
      else toast(t('app.cmp.dup'));
    } else if (mode === 'alert') openAlertDialog(full);
    else activeView?.setSymbol(full);
  },
});
$('#symbol-btn').addEventListener('click', () => search.open('open'));

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

const isTyping = (e) => e.target instanceof Element && !!e.target.closest('input, textarea, select, [contenteditable]');
const anyModal = () => !$('#search-modal').hidden || !indModal.hidden || !alertModal.hidden || !appearModal.hidden;
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (search.isOpen) { search.close(); return; }
    if (!indModal.hidden) { indModal.hidden = true; return; }
    if (!alertModal.hidden) { alertModal.hidden = true; return; }
    if (!appearModal.hidden) { appearModal.hidden = true; return; }
    if (!layoutMenu.hidden || !toolMenu.hidden || !moreMenu.hidden) { layoutMenu.hidden = true; toolMenu.hidden = true; moreMenu.hidden = true; return; }
    if (tfBar.closeMenu()) return;
    if (settingsOpen()) { closeSettings(); return; }
    if (activeView?.cancelReplayPick()) { syncHeader(); return; }
    if (activeView?.cancelDrawing()) return;
    selectTool('cursor');
    return;
  }
  if (isTyping(e) || anyModal() || !activeView) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && activeView.deleteSelectedDrawing()) { e.preventDefault(); return; }
  if (activeView.replay && !activeView.replayPick && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (e.key === 'ArrowRight') { activeView.pauseReplay(); activeView.replayStep(); e.preventDefault(); return; }
    if (e.key === 'ArrowDown') { activeView.toggleReplayPlay(); e.preventDefault(); return; }
  }
  if (e.altKey && e.key === 'Enter') {
    if (views.length > 1) setMaximized(maximized === activeView ? null : activeView);
    e.preventDefault();
    return;
  }
  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    const k = e.key.toLowerCase();
    if (k === 'a') { openAlertDialog(); e.preventDefault(); return; }
    const tool = { t: 'trend', h: 'hline', v: 'vline', r: 'rect', f: 'fib', c: 'channel', m: 'measure', x: 'text' }[k];
    if (tool) { selectTool(tool); e.preventDefault(); }
    return;
  }
  if (e.key === '/' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); openIndicators(); return; }
  // A digit opens "Change interval" (45 → 45 minutes, then Enter); tickers
  // starting with a digit (7203.T) go on to symbol search from there. A letter opens the search.
  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && /^[0-9]$/.test(e.key)) {
    e.preventDefault();
    intervalBox.open(e.key);
    return;
  }
  if (!e.ctrlKey && !e.metaKey && /^[a-z0-9^]$/i.test(e.key)) {
    e.preventDefault();
    search.open('open', e.key);
  }
});

// Clock (charts show exchange time for stocks and your local time for crypto)
function tickClock() {
  $('#clock').textContent = new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(tickClock, 1000);
tickClock();

window.addEventListener('hashchange', () => {
  if (POPOUT || !activeView) return;
  const h = new URLSearchParams(location.hash.slice(1));
  if (tfIdOf(h.get('tf'))) activeView.setTimeframe(tfIdOf(h.get('tf')));
  if (h.get('s')) activeView.setSymbol(h.get('s'));
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

const ws = loadWorkspace();
renderToolbar();
setWatchlist(watchSymbols);
renderAlerts();
applyLayout(ws.layout);
dataMode().then((mode) => {
  modeNow = mode;
  document.body.dataset.mode = mode;
  buildMarketSelect(mode === 'server');
  syncDataMode();
  syncHeader();
  showTab(store.get('sideTab', 'markets'));
});
if (POPOUT) document.title = `${activeView.ticker} · Wickline`;

// Desktop app: tell the user when a newer version is on GitHub Releases (they can turn it off).
async function updateCheck() {
  const box = $('#update');
  if (!IS_DESKTOP || POPOUT || store.get('updateCheck', true) === false) { box.hidden = true; return; }
  let current;
  try { current = (await (await fetch(apiUrl('api/health'))).json()).version; } catch { return; }
  const rel = await checkForUpdate({ current, dismissed: store.get('updateDismissed', null) });
  if (!rel) { box.hidden = true; return; }
  $('#update-link').textContent = t('upd.available', { version: rel.version });
  $('#update-link').href = rel.url;
  box.hidden = false;
  $('#update-dismiss').onclick = () => { store.set('updateDismissed', rel.version); box.hidden = true; };
}
setTimeout(updateCheck, 5000);
setInterval(updateCheck, 12 * 3600 * 1000);
$('#set-updates').addEventListener('change', (e) => { store.set('updateCheck', e.target.checked); updateCheck(); });
