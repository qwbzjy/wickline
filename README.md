# Wickline

English · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md)

A free, open-source charting platform.
- Live crypto, stocks, ETFs, indices, forex and futures, on any timeframe (2m, 45m, 3H…).
- Option chains with Greeks for US stocks, ETFs, Bitcoin and Ether.
- 100 built-in indicators, plus your own indicators and strategies written in JavaScript, with backtesting.
- Drawing tools, price alerts and multi-chart layouts.
- A community library: publish your scripts for everyone, and add other people's with one click.
- No account, no API keys, no subscription.

**[Download the desktop app](../../releases/latest)** for Windows, macOS or Linux. Everything works out of the box: stocks, crypto, the screener, the heatmap, options, news, the calendar, bar replay and paper trading. You don't need an API key or any setup, and data comes over your own internet connection.

![Wickline: 1 to 8 resizable charts, indicators, any timeframe, community scripts, news, bar replay with paper trading, option chains, and stock and crypto heatmaps](docs/demo.gif)

## Features

**Markets & data**
- Crypto from **Binance** (spot), **Binance Futures** (USDⓈ-M perpetuals) and **Coinbase**: every trade moves the chart in real time. No key needed.
- Stocks, ETFs, indices, forex and futures worldwide, from Yahoo with no key. Live trades come from Yahoo's public stream. See [Data sources](#data-sources).
- **Markets panel with complete markets:** filter by name, sector or quote coin, and sort by size, gainers, losers or A–Z. Only on-screen rows are drawn and live-updated, so thousands of rows stay fast.
  - All 7,233 US-listed stocks and 5,524 US ETFs.
  - Every pair on Binance (3,000+), Binance Futures (800+) and Coinbase (500+).
- **Curated lists:** 283 hand-picked instruments in 12 groups (world indices, European and Asian stocks, forex, commodities, futures, bond yields…).
- **Live screeners:** top gainers, losers, most active, trending, and more.
- **Symbol search:** one box searches every source at once (stocks, funds, indices, forex, futures and every crypto exchange). Each result shows its exchange and where its data comes from (Yahoo, Binance, Binance Futures, Coinbase).
- **Network proxy** for places where Yahoo, Binance or GitHub are blocked: the desktop app uses your system proxy, or an HTTP or SOCKS5 proxy you set (Clash, v2rayN…). Every data source, news and the update check go through it, and a change applies at once. See [Using a proxy](#using-a-proxy).

**Screener: find stocks to trade**
- Scans the ~3,000 largest US stocks, refreshed every minute, or the largest companies of any of the heatmap's 17 other stock markets (Europe, Japan, China, Hong Kong, Korea, Taiwan, India, Canada, Australia, Brazil). Abroad, stocks show the codes local traders use (7203, 601398, 00700) and market caps in their own currency.
- **Ready-made ideas, one click each:** top gainers and losers, unusual volume, 52-week highs and breakouts, lows and breakdowns, strong uptrends, downtrends, oversold and overbought (RSI), gaps, golden and death crosses, earnings this week.
- **Filters:** market cap (in dollars, in every market), average volume, sector, minimum price. Sort by any column.
- **Signals on every stock:** relative volume, gap, distance from the 50- and 200-day averages and the 52-week high, RSI, 1-month change, next earnings date.
- **Market insights:** how many stocks are up or down, the share above their 50- and 200-day averages, new highs and lows, and today's best and worst sectors.
- Click a row to open its chart, then flip through the list with the ↑ ↓ keys.

**Heatmap**
- A market's largest stocks as tiles grouped by sector, sized by market cap and coloured by how much they moved: today, this week, this month, 3 months or a year.
- **Pick a market:**
  - **United States:** the top 100 to 1,000 stocks from the screener's scan.
  - **17 other stock markets:** the United Kingdom, Germany, France, the Netherlands, Italy, Spain, Switzerland, Sweden, Japan, China, Hong Kong, South Korea, Taiwan, India, Canada, Australia and Brazil, up to 500 companies each. Each market shows its own companies only, not foreign companies' secondary lines (Apple in Frankfurt). They're sized by market cap in their own currency, and tooltips show prices and caps in that currency (London prices in pence).
  - **Crypto:** the top coins by market cap (from CoinGecko), grouped by category: payments, layer 1 and 2, DeFi, meme coins, AI, exchange tokens and more. Stablecoins, wrapped and staked copies (WBTC, stETH), tokenized stocks and funds, and gold tokens are left out. Changes are over rolling 24 hours, 7, 30 and 90 days and a year, and the colour scale is twice as wide. A coin opens on its Binance USDT pair, or on Yahoo when Binance doesn't list it.
- Tiles show the codes traders use in that market (601398 rather than 601398.SS, 00700 in Hong Kong, INVE B in Stockholm) and, on large tiles, the company's name.
- Hover a tile for its price and changes, click it to open its chart, or click a sector's name to zoom in on it. A period a market has no data for is greyed out.

**Options**
- The option chain of the chart's symbol: US stocks and ETFs from Yahoo (about 15 minutes delayed), Bitcoin and Ether from Deribit (real time). Other symbols say they have no options.
- Pick an expiry (with the days left). A strip shows the price, the at-the-money IV, the expected move (the at-the-money straddle, and ±1σ from IV), put/call ratios by volume and open interest, and max pain.
- The chain lists calls | strike | puts with last, bid, ask, volume, open interest, IV and delta, in-the-money contracts shaded, opening on the current price. Hover a contract for its gamma, theta and vega (Black-Scholes with a 4% risk-free rate; Deribit's on the expiry's forward price). Click a Yahoo contract to open its own chart.
- Beside it: open interest by strike (calls up, puts down, the price and max pain marked) and unusual activity, the contracts trading at least twice their open interest.
- Outside US market hours Yahoo has no bids or asks and no open interest, so IV and Greeks come from last trades and max pain waits for the open.

**News and calendar**
- **Live headlines** from about 45 sources, refreshed every 30 seconds. Pick a region:
  - **United States:** CNBC, MarketWatch, Nasdaq, Investing.com, Seeking Alpha, Benzinga, CoinDesk, Cointelegraph and the Federal Reserve.
  - **United Kingdom:** the FT, BBC, The Guardian, City A.M., Sky News, This is Money and the Bank of England.
  - **Europe:** the FT, CNBC, Euronews, DW, The Irish Times and the ECB.
  - **Asia:** CNBC, the South China Morning Post, The Straits Times, Japan Today and the Bank of Japan.
  - **India:** The Economic Times, Mint and Business Standard.
  - **Canada:** The Globe and Mail, CBC and the Bank of Canada.
  - **Australia:** ABC, The Sydney Morning Herald and the Reserve Bank of Australia.
  - **World:** all of the above, plus Bloomberg, CNBC World and FXStreet.
- **Top stories ranked by what's moving markets:**
  - The same story from several outlets is grouped, and wider coverage ranks higher.
  - Market-moving words (Fed, inflation, tariffs, guidance, downgrades…) count for more, and "stocks to buy" listicles count for less.
  - Stories about big companies, or stocks moving hard today, rank higher.
  - The clear leaders are marked **Hot**; fresh ones are marked **Breaking**.
- **Tickers on every headline** with today's move (or the pre-market move). Click one to open its chart.
  - A region's headlines link to its own listings, for example HSBC → HSBA.L in UK news and Tencent → 0700.HK in Asian news.
  - Also: trending tickers, topic filters (stocks, earnings, economy, crypto), a newest-first view, and news about the chart you're looking at.
- **Economic calendar for about 60 countries:**
  - US releases (CPI, jobs, retail sales, PCE, GDP…), Fed decisions, and the same kinds of releases and central-bank rate decisions everywhere else.
  - Rated by impact, with a countdown to the next one. Actual values appear moments after release.
  - Pick countries in the calendar (major economies by default).
- **Earnings calendar:** US companies and 17 other stock markets (London, Frankfurt, Paris, Amsterdam, Milan, Madrid, Zurich, Stockholm, Tokyo, Hong Kong, Shanghai/Shenzhen, Seoul, Taiwan, India, Toronto, Sydney and São Paulo).
  - Each market lists its own companies only, not foreign companies' secondary lines.
  - Companies are sorted by size in dollars and show before the open or after the close, with EPS forecast, result and surprise.

**Charts**
- **Layouts:** 1 to 8 charts at once, in 20 arrangements (side by side, stacked, grids, one big chart with smaller ones), each with its own symbol, timeframe and indicators.
  - **Resizable:** drag the dividers between charts to resize them; double-click a divider to make that split equal again. Sizes are remembered for each layout.
- **Working with several charts:**
  - **Sync across charts** (Layout menu): symbol, timeframe and crosshair, including pop-out windows. Change one chart and the rest follow.
  - Maximize any chart, or pop it out into its own window.
- **Chart types:** candles, hollow candles, Heikin Ashi, bars, line, line with markers, step line, area, baseline, columns.
- **Timeframes:** any number of minutes or hours: 1m, 2m, 3m, 10m, 45m, 90m, 1H, 3H, 6H, 12H… plus D, W and M, on every source (built from the exchange's own candles where it has no such interval, live too).
  - Star your favourites in the ▾ menu next to the timeframe buttons to keep them in the header.
  - Or type a number on the chart (45, 240, 4h, 1D) and press Enter.
- **Display:**
  - Log or percent scale.
  - **Compare** other symbols on the same chart.
  - A bar-close countdown.
  - Light and dark themes, with five presets (Crimson, Ember, Dusk, Signal, Ink).
  - **Every color is yours to pick:** accent, background, panels, text, chart background, grid, crosshair, up/down candles, wicks and line charts. Open the palette button in the header.
- **Extended hours:** on intraday stock charts, pre-market and after-hours trades build candles too, with full history (the **Ext** button turns it off). Overnight trades (20:00–04:00 New York time) have no free candle history, so they show as an "Overnight" price line, as do all extended-hours trades on daily and longer charts.

**Indicators**
- **100 built in, by category:**
  - **Moving averages:** SMA, EMA, WMA, HMA, DEMA, TEMA, SMMA, VWMA, ALMA, LSMA, MA Cross, KAMA, ZLEMA, T3, McGinley Dynamic, VIDYA, TRIMA, MA Ribbon, Guppy (GMMA).
  - **Bands & channels:** Bollinger, Keltner, Donchian, Envelopes, STARC, Standard Error Bands, VWAP with standard deviation bands.
  - **Trend:** Supertrend, Ichimoku Cloud, Parabolic SAR, VWAP, Pivot Points, Williams Alligator, Chandelier Exit, Chande Kroll Stop, SSL Channel.
  - **Oscillators:** RSI, Stochastic RSI, Stochastic, CCI, Williams %R, MFI, Ultimate, CMO, Fisher, TSI, TRIX, DPO, Coppock, %B, Schaff Trend Cycle, Relative Vigor, Stochastic Momentum Index, Connors RSI, Laguerre RSI, Gator, Intraday Momentum Index, Z-Score.
  - **Momentum:** MACD, Awesome Oscillator, Momentum, ROC, Balance of Power, Elder Force, PPO, Know Sure Thing, Elder Ray, Qstick, Accelerator Oscillator, Squeeze Momentum.
  - **Trend strength:** DMI/ADX, Aroon, Vortex, Choppiness, Linear Regression Slope, Random Walk Index, Vertical Horizontal Filter, Efficiency Ratio, Polarized Fractal Efficiency.
  - **Volume:** Volume, OBV, A/D, CMF, Chaikin Oscillator, PVT, Volume Oscillator, Klinger, Ease of Movement, Negative and Positive Volume Index, PVO, Volume-Weighted MACD.
  - **Volatility:** ATR, Historical Volatility, BB Width, Standard Deviation, ATR %, Chaikin Volatility, Ulcer Index, Mass Index, Relative Volatility Index.
- Shaded bands and clouds; every setting and color is editable.
- **Your own indicators in JavaScript**, with a built-in editor. See [below](#writing-your-own-indicators).
- **Community scripts:** browse indicators and strategies other traders published (Indicators → **Community**), sort by most liked or newest, and add one to your chart with a click. Publish your own from the script editor. See [Sharing scripts](#sharing-scripts-with-everyone).

**Backtesting**
- **Strategy API:** write trading strategies in the same script language. See [below](#backtesting-strategies).
- **Strategy Tester:**
  - Overview with net profit, win rate, profit factor and max drawdown.
  - Equity curve against buy & hold, with drawdown.
  - Performance table split into long and short.
  - List of trades: click a trade to see it on the chart, or export to CSV.
  - Editable properties: capital, order size, commission, slippage, pyramiding, fill timing.
- **On the chart:** entry and exit markers, plus a line from each entry to its exit.

**Bar replay and paper trading**
- **Bar replay:** go back to any point in history and replay the chart candle by candle.
  - Start from a candle you click, a date, or a random point.
  - Step one candle at a time, or play at 0.5× to 10× (candles per second).
  - Indicators and strategies update as the candles appear.
  - Switch symbol or timeframe and the replay continues at the same moment.
- **Paper trading:** practice with a simulated $100,000 account. No real money and no broker.
  - Market, limit and stop orders, with an optional stop loss and take profit.
  - Buy and Sell buttons on the chart. Positions, stops and orders show as lines; drag them to move your stop, target or order.
  - The panel lists positions with live P&L, working orders, trade history, win rate and profit factor.
  - Starting balance, commission, slippage and leverage are adjustable, and you can reset the account.
  - Live paper trades fill against live prices and are saved on your computer.
  - Trades during a replay use a separate practice account that fills on the replayed candles. It shows the result when the replay ends and leaves your paper account alone.

**Drawing & alerts**
- **Drawing tools:**
  - **Lines:** trend line, ray, extended line, arrow.
  - **Levels:** horizontal line, horizontal ray, vertical line.
  - **Shapes & text:** rectangle, parallel channel, text.
  - **Analysis:** Fibonacci retracement, trend-based Fib time, Fib channel, measure, long position, short position.
- **Editing:** drag drawings and their handles. Change colors from the drawing's toolbar.
- **Price alerts:** crossing, crossing up or crossing down. You get a sound, an on-screen message and an optional desktop notification. Create them from a horizontal line with one click.

**Everything else**
- Watchlist with live prices: drag symbols into any order, and group them into your own sections (add one with the button next to +, double-click its name to rename it, click it to collapse it).
- Saves your layout, charts, drawings, scripts and alerts on your computer.
- Shareable links, such as `/#s=YAHOO:AAPL&tf=1D`.
- Save the chart as a PNG.
- Keyboard shortcuts.
- **In seven languages:** English, Simplified and Traditional Chinese (简体中文, 繁體中文), Japanese (日本語), Korean (한국어), Spanish (Español) and Brazilian Portuguese (Português). The UI follows your system's language; change it under ⚙ (Data sources) → **Language**.
- Works on phones.

## Get it

**Desktop app (recommended).** Download the file for your system from [Releases](../../releases/latest):

| Your computer | File |
| --- | --- |
| **Windows** (almost every PC) | `Wickline-for-Windows-Portable-x.y.z.exe` (no install, just run it), or the installer `Wickline-for-Windows-Setup-x.y.z.exe` (adds a Start menu entry) |
| **Mac with Apple silicon** (M1, M2, M3, M4 and later) | `Wickline-for-Mac-Apple-Silicon-x.y.z.dmg`. First launch: macOS warns once. **Don't click Move to Trash**: click **Cancel** (or **Done**), then **System Settings → Privacy & Security → Open Anyway** |
| Mac with an Intel processor (older Macs) | `Wickline-Intel-Mac-x.y.z.dmg` |
| Linux | `Wickline-Linux-x.y.z.AppImage` (any distribution) or `Wickline-Linux-x.y.z.deb` (Debian, Ubuntu) |

Not sure which Mac you have? Apple menu → **About This Mac**: "Chip: Apple M…" is Apple silicon, "Processor: … Intel" is Intel.

The app isn't code-signed, because signing certificates cost money, so the first launch shows a warning:
- **Windows:** in the "Windows protected your PC" message, click **More info → Run anyway**.
- **macOS:** drag Wickline into Applications and open it. When macOS says it can't verify the app, don't click **Move to Trash**: click **Cancel** (or **Done**), then go to **System Settings → Privacy & Security**, scroll down and click **Open Anyway**. On macOS 14 and older, right-clicking the app and choosing **Open** also works.
- **macOS says the app "is damaged"** (versions before 0.1.6 did this on Apple silicon): run `xattr -cr /Applications/Wickline.app` in Terminal. That removes the "downloaded from the internet" flag.

The app runs a small data server inside itself. It listens only on your own computer (`127.0.0.1`), and stock data comes from Yahoo over your own connection.

### Using a proxy

Where Yahoo, Binance or GitHub are blocked (in China, for example), send the app's connections through a proxy: ⚙ (Data sources) → **Network proxy**.
- **Use system proxy** (the default): whatever your system's proxy settings say, e.g. a VPN or proxy app's "system proxy" switch.
- **Manual:** an HTTP proxy as `host:port`, e.g. `127.0.0.1:7890` for Clash's local port, or a SOCKS5 proxy as `socks5://127.0.0.1:1080`. Proxies that need a password aren't supported.
- **Off:** connect directly.

It covers everything the app fetches: Yahoo, Nasdaq, Binance, Coinbase, CoinGecko, Deribit, news, community scripts and the update check. The app's own server on `127.0.0.1` is never proxied.

With `npm start`, set the proxy for the server in `WICKLINE_PROXY` (or the usual `HTTPS_PROXY` / `ALL_PROXY`), e.g. `WICKLINE_PROXY=socks5://127.0.0.1:1080 npm start`. The page itself, like the website version, uses your browser's proxy settings.

**From source.** Requires [Node.js](https://nodejs.org/) 22+.

```bash
git clone https://github.com/keptaduona/wickline.git
cd wickline
npm install
npm run desktop     # the desktop app
npm start           # or: the same app in your browser at http://localhost:5173
```

**Build installers yourself:**
- `npm run dist` builds for the system you're on; the files appear in `dist/`.
- Releases build all three systems automatically, through `.github/workflows/release.yml`:
  1. Bump `version` in `package.json`.
  2. Push a tag such as `v0.2.0`.
  3. GitHub builds the Windows, macOS and Linux apps and attaches the six downloads to a draft release, with a "which file do I need" table from `.github/release-notes.md`.
  4. Review it and press **Publish**.

**As a website (optional, for people who want to host it).** The `public/` folder is also a complete static site. Put it on any static host for free.
- **Stocks there need a key.** A static site has no server to read Yahoo through, so each visitor adds their own free Twelve Data key. Crypto works without one. See [Website version: optional Twelve Data key](#website-version-optional-twelve-data-key).
- You don't need this to use Wickline. The desktop app and `npm start` include everything with no key.
- **GitHub Pages:**
  1. In **Settings → Pages**, set **Source** to **GitHub Actions**.
  2. Run the *Deploy to GitHub Pages* workflow.
- **Other hosts:** Netlify, Cloudflare Pages and the like serve the `public` folder with no build step.

To try that mode locally, serve `public/` with any static server:

```bash
npx serve public
```

## Data sources

**The desktop app and `npm start` need no API key.** They come with a small built-in server (`server.mjs`, Node.js 22+, no dependencies unless it goes through a [proxy](#using-a-proxy)). It reads Yahoo Finance and Nasdaq for stocks, and the exchanges' public feeds for crypto.
- **Yahoo** supplies stocks, ETFs, indices, forex and futures: history, live trades, screeners, news, the economic calendar and earnings.
- **Binance, Binance Futures and Coinbase** supply crypto, with every trade in real time.
- **CoinGecko** (its free API, no key) supplies the crypto heatmap's market caps and changes, fetched at most every 3 minutes.
- **Deribit** (its public API, no key) supplies Bitcoin and Ether option chains in real time. US stock and ETF option chains come from Yahoo, about 15 minutes delayed.

```bash
npm install
npm start          # http://localhost:5173 — PORT=8080 HOST=0.0.0.0 npm start to change
```

### Website version: optional Twelve Data key

This applies only if you host `public/` as a static website. A web page can't read Yahoo's history or Nasdaq directly, because they block it, so a static site has less:

| | Website (static) | Desktop app, or `npm start` |
| --- | --- | --- |
| Crypto: Binance, Binance Futures, Coinbase | ✅ live, no key | ✅ |
| Indicators, scripts, backtesting, drawings, alerts | ✅ | ✅ |
| Stocks, ETFs, indices, forex: history | ✅ with the visitor's free Twelve Data key | ✅ Yahoo, no key |
| Stocks, ETFs, indices, forex: live trades | ✅ Yahoo's public stream, no key | ✅ |
| All US stocks and ETFs in the Markets panel | ✅ prices fill in while markets trade | ✅ live |
| Symbol search | ✅ | ✅ |
| Live screeners (top gainers, losers, most active…) | — | ✅ |
| Stock screener with signals and market insights | — | ✅ |
| Heatmaps: stocks in 18 markets, crypto | — | ✅ |
| Options: chains, Greeks, expected move, max pain | — | ✅ |
| Community scripts | Browse only (they run in the desktop app) | ✅ |
| News, economic calendar and earnings | — | ✅ |
| Futures and most world indices | — | ✅ |

**Visitors who want stock history there** add a free key:
1. Click the ⚙ (Data sources) in the header, or the button on any stock chart.
2. Paste a free key from [twelvedata.com](https://twelvedata.com/pricing). It allows 800 requests a day and 8 a minute.
3. The key is saved only in that browser and sent only to Twelve Data.

Each chart load uses one request. Live prices come from Yahoo's stream and don't use any.

A static site can also skip the key by pointing at someone's running server under ⚙ → *Advanced*.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Any letter | Open symbol search |
| A number (`45`, `240`, `4h`, `1D`…), then `Enter` | Change the timeframe (`Tab` searches symbols instead, e.g. `7203.T`) |
| `/` | Indicators & scripts |
| `Alt+A` | Create a price alert |
| `Alt+T` · `Alt+H` · `Alt+V` | Trend line · horizontal line · vertical line |
| `Alt+R` · `Alt+C` · `Alt+X` | Rectangle · parallel channel · text |
| `Alt+F` · `Alt+M` | Fib retracement · measure |
| `Alt+Enter` | Maximize / restore the active chart |
| `Shift+→` · `Shift+↓` | In a replay: next candle · play / pause |
| `Esc` | Cancel drawing / choosing a replay start / close dialog |
| `Delete` / `Backspace` | Delete the selected drawing |
| `Ctrl+S` · `Ctrl+Enter` | In the script editor: save · add to chart |

**Using the toolbar:**
- Hover a toolbar button and click the small arrow to see more tools in that group.
- With the cursor tool, click a drawing to select it, then drag it or its handles.
- In a multi-chart layout, click a chart to make it active. The header, toolbar, watchlist and search act on it. Drag the lines between charts to resize them (double-click one for equal sizes).

## Symbols

Symbols are written as `SOURCE:TICKER`:

| Example | Market |
| --- | --- |
| `BINANCE:BTCUSDT` | Crypto spot (any Binance pair) |
| `BINANCEF:BTCUSDT` | Crypto perpetual (Binance USDⓈ-M futures, shown as `BTCUSDT.P`) |
| `COINBASE:BTC-USD` | Crypto spot on Coinbase |
| `YAHOO:AAPL` · `YAHOO:VOW3.DE` · `YAHOO:7203.T` | Stocks (Yahoo suffixes for other exchanges) |
| `YAHOO:SPY` | ETF |
| `YAHOO:^GSPC` · `YAHOO:^GDAXI` | Indices |
| `YAHOO:EURUSD=X` | Forex |
| `YAHOO:GC=F` · `YAHOO:ES=F` | Futures |
| `YAHOO:^TNX` | US 10-year yield |

## Writing your own indicators

Open **Script editor** in the header, pick a starter from **New ▾**, and press **Ctrl+Enter** to save it and put it on the chart. Scripts are plain JavaScript. Every data series is an array with one value per bar, oldest first.

```js
// Two EMAs with a shaded gap and buy/sell markers where they cross.
indicator('EMA Cross Signals', { overlay: true });

const fastLength = input('Fast EMA', 9, { min: 1 });
const slowLength = input('Slow EMA', 21, { min: 1 });

const fast = ta.ema(close, fastLength);
const slow = ta.ema(close, slowLength);

const a = plot(fast, { title: 'Fast', color: '#00BCD4' });
const b = plot(slow, { title: 'Slow', color: '#FF9800' });
fill(a, b, { color: 'rgba(0, 188, 212, 0.08)' });

marker(ta.crossover(fast, slow), { position: 'below', shape: 'up', color: '#089981', text: 'Buy' });
marker(ta.crossunder(fast, slow), { position: 'above', shape: 'down', color: '#F23645', text: 'Sell' });
```

### API

| | |
| --- | --- |
| `indicator(name, { overlay, precision, shortName })` | Name the script. `overlay: true` draws on the price chart, otherwise it gets its own pane. |
| `input(title, default, { min, max, step, options })` | A setting shown in the indicator's settings: number, `true`/`false`, or a list with `options`. Returns its current value. |
| `plot(values, { title, color, style, width })` | Draws a series. `style`: `line`, `histogram`, `dots`, `step`. `color` can be one color, an array with a color per bar, or `(i, value) => color`. Returns an id for `fill`. |
| `hline(price, { color })` | A dashed horizontal level. |
| `fill(a, b, { color })` | Shades between two plots (ids from `plot`) or two numbers. |
| `marker(conditions, { position, shape, color, text })` | A marker on every bar where the condition is true. `position`: `above`/`below`; `shape`: `up`, `down`, `circle`, `square`. |
| `log(...values)` | Prints to the editor's console. |
| Data | `open high low close volume time hl2 hlc3 ohlc4 bar_index`, `n` (bar count), `symbol`, `timeframe.seconds`, `timeframe.intraday`. |
| `ta.*` | `sma ema wma rma hma dema tema alma kama zlema t3 mcginley vidya trima vwma linreg linregSlope stdev sum cum highest lowest change mom roc shift rsi cci macd bb stoch ppo kst stc zscore percentrank streak laguerreRsi connorsRsi rvi er vhf pfe ulcer stderrBands crossover crossunder cross pivothigh pivotlow`, plus bar-based `atr tr mfi obv wpr vwap psar dmi supertrend atrp eom nvi pvi qstick imi massIndex chaikinVolatility alligator chandelier chandeKroll ssl rwi elderRay smi rvgi squeeze klinger vwmacd starc vwapBands`. |
| Helpers | `na`, `nz(x, 0)`, `add sub mul div max min` (arrays or numbers), `iff(cond, a, b)`, `rgba(hex, alpha)`, and all of `Math`. |

**How scripts run:**
- **Isolated:**
  - Each script runs in a Web Worker of its own, with no access to the page, your data or the DOM. A script can only change things inside its own worker, so it can't touch another script's results.
  - Inside the worker, scripts have no network or storage: `fetch`, WebSockets, `importScripts`, IndexedDB and the like are removed before any script runs, and so is the worker's own messaging. In the desktop app, the worker can't reach the network at all.
  - Everything a script sends back (names, colors, settings, numbers, trades) is checked before the app uses it, and a result that is too large, or doesn't have one value per bar, is refused with an error.
- **Time limit:** a script is stopped after 3 seconds, so an endless loop can't freeze the app.
- **Errors:** shown in the editor's console and on the chart, with the line number.
- **Live updates:** saving a script updates every chart that uses it.
- **Your own judgment:** a script can't harm your computer, but its signals can be wrong. Read a strategy before you trade on it.

### Sharing scripts with everyone

**Add someone's script:** open **Indicators → Community** and click it.
- It's copied into **My scripts** and added to the chart.
- **Code** opens it in the editor.
- **♥ Like** opens its page on GitHub, where a 👍 counts as a like.
- When the author publishes a new version, an **Update** button appears.
- **Official example** scripts come with Wickline; the rest are marked **Community** with the author's GitHub name.
- The website version only lists them: community scripts run in the desktop app, where they're cut off from the internet.

**Publish yours:**
1. Click **Publish** in the script editor and add a short description.
2. GitHub opens with the script filled in. Press **Submit new issue** (a free GitHub account is needed).
3. A check runs the script on test data. If it passes, the script shows up in every Wickline app's Community tab a few minutes later.

To update a published script, edit its GitHub issue.

The library lives in this repository's [`community/`](community/) folder; the [community README](community/README.md) explains how it works and how it's moderated.

## Backtesting strategies

Write `strategy()` instead of `indicator()` and place orders. Press **Ctrl+Enter** and the **Strategy Tester** opens with the results:

```js
strategy('EMA Cross Strategy', { capital: 10000, size: { percent: 100 }, commission: 0.1 });

const fast = ta.ema(close, input('Fast EMA', 12));
const slow = ta.ema(close, input('Slow EMA', 26));
plot(fast, { color: '#00BCD4' });
plot(slow, { color: '#FF9800' });

strategy.entry('Long', 'long', ta.crossover(fast, slow));    // an opposite entry reverses the position
strategy.entry('Short', 'short', ta.crossunder(fast, slow));
strategy.exit({ stopLoss: 3, takeProfit: 6 });               // percent from the entry price
```

| | |
| --- | --- |
| `strategy(name, options)` | `capital` (default 10,000), `size`: `{ percent }` of equity (default 100), `{ cash }` or `{ qty }`. Also `commission` and `slippage` (% per fill), `pyramiding` (max entries in one direction, default 1), and `fillOn`: `'open'` (next bar's open, default) or `'close'`. |
| `strategy.entry(id, 'long'\|'short', when, { qty, comment })` | Enter on every bar where `when` is true. `when` is an array, `true`, or `(i) => boolean`. |
| `strategy.close(id, when)` | Close the entries with that id; `null` closes everything. `strategy.closeAll(when)` is the same as `close(null, when)`. |
| `strategy.exit({ stopLoss, takeProfit, trailing, stopPrice, limitPrice, from })` | Protective exits. The first three are percentages; `stopPrice` and `limitPrice` are price arrays or numbers (for example an ATR stop); `from` limits it to one entry id. |
| `strategy.onBar((i, s) => { … })` | Runs once per bar for logic that depends on the open position. `s.position` → `{ side, qty, avgPrice, openProfit, barsInTrade }`; also `s.equity`, `s.long(id)`, `s.short(id)`, `s.close(id)`. |

**How fills work:**
- Signals are read at a bar's close and fill at the **next bar's open** (or the same bar's close with `fillOn: 'close'`), so a strategy can't see the future.
- Stops, targets and trailing stops are checked against each bar's high and low. A gap past a level fills at the open.
- If one bar touches both the stop and the target, the stop is counted first, the conservative choice.
- Commission and slippage apply to every fill.

**What the backtest covers:**
- Backtests run over the bars loaded on the chart. On crypto charts, scroll left to load more history; daily stock charts load the full history.
- Results update live as new bars arrive.
- The Properties tab overrides the script's settings for that chart.

The engine is plain JavaScript in `public/js/backtest.js`, covered by unit tests (`npm test`).

Past performance doesn't predict future results, and a backtest is only as good as its data and assumptions.

### Adding a built-in indicator

Built-ins live in `public/js/indicators.js`. Add an entry and it appears in the Indicators dialog with settings, legend values and live updates:

```js
momentum: {
  name: 'Momentum', short: 'MOM', description: 'Close minus the close N bars ago',
  category: 'Momentum', overlay: false,
  params: [P('length', 'Length', 10)],
  plots: [{ key: 'mom', title: 'MOM', color: '#00BCD4' }],
  calc: (bars, p) => ({ mom: change(bars.map((b) => b.close), p.length) }),
},
```

## How it works

```
Desktop app (desktop/main.mjs, Electron):
  └── a window on http://127.0.0.1:41573 ─▶ the web app below + the server, on your machine only

Web app (public/, plain static files), in the window or any browser:
  ├── Binance · Binance Futures · Coinbase ......... crypto history + every trade (WebSocket)
  ├── Yahoo live price stream (WebSocket) .......... live stock/forex trades
  ├── Server, if present (detected via /api/health)
  │     └── /api/yahoo/*, /api/universe/* ─▶ Yahoo Finance, Nasdaq   (keyless stocks, screeners, live lists)
  └── Without a server (website):
        ├── Twelve Data (visitor's free key) ....... stock/ETF/forex/index history, quotes, search
        └── data/us-stocks.json, us-etfs.json ...... US tickers, names and sectors (no prices)
```

| File | What it does |
| --- | --- |
| `desktop/main.mjs` | The desktop app: starts the server on `127.0.0.1`, opens the window, remembers its size, opens pop-out charts as app windows. |
| `desktop/proxy.mjs`, `lib/proxy.mjs` | The network proxy setting: saved by the app, applied to the window (Electron's session) and to the server's requests and Yahoo stream (undici), without a restart. `desktop/preload.cjs` lets the settings dialog read and change it. |
| `build/icon.png`, `.github/workflows/release.yml` | App icon, and the workflow that builds Windows/macOS/Linux installers for each tagged release. |
| `public/` | **The web app.** Static files only, no build step. |
| `public/js/env.js` | Detects the server and holds the website version's data settings (Twelve Data key, rate, server URL). |
| `public/js/twelvedata.js`, `yahoo-direct.js` | Website-version data (no server): the optional Twelve Data client with a built-in rate limiter, and Yahoo's live stream decoded in the browser. |
| `public/js/datafeed.js` | History and live data for each exchange and source, symbol search, and live quote lists. |
| `server.mjs`, `lib/` | The optional server: relays Yahoo and Nasdaq (which block browsers), caches responses, and shares one Yahoo stream connection with every open window. `lib/screener.mjs` scores stocks for the screener; `lib/news.mjs` and `lib/calendar.mjs` rank headlines and build the calendar; `lib/markets.mjs` handles stock markets outside the US; `lib/heatmap-markets.mjs` builds the heatmap's crypto and non-US maps. |
| `scripts/update-data.mjs` | Refreshes `public/data/` (all US stocks and ETFs): `npm run update-data`. |
| `public/vendor/` | The chart library, bundled so the site needs no build step (`npm run update-vendor` refreshes it). |
| `public/js/chart-view.js` | One chart: series, indicator panes, scripts, compare, legend, drawings, alerts. Each trade updates the current bar at once; official bars are merged in to keep it exact. |
| `public/js/app.js` | The shell: layouts, header, toolbar, side panel, dialogs, shortcuts. |
| `public/js/layouts.js` | Multi-chart layouts: which exist, where each chart goes, and dragging the dividers between them (pure, unit-tested). |
| `public/js/indicators.js` | All indicator math, also exposed to scripts as `ta`. |
| `public/js/scripts.js`, `script-worker.js`, `script-editor.js` | Script storage, starter templates, the sandboxed runner, and the editor. |
| `public/js/script-sanitize.js` | Checks everything a script run sends back (colors, names, settings, numbers) before the page uses it. |
| `public/js/community.js`, `community/` | The community library: the Community tab and the Publish dialog in the app; the published scripts and their `index.json`. |
| `lib/community.mjs`, `scripts/community.mjs`, `.github/workflows/community.yml` | Publishing: reads the GitHub issue form, checks and test-runs a script in a container with no network, adds it to `community/`, removes it, and counts likes. |
| `public/js/backtest.js`, `strategy-tester.js` | The bar-by-bar backtest engine and the Strategy Tester panel. |
| `test/` | `npm test`: offline unit tests (backtest engine, strategy API and templates, all 100 indicators, bad-print filter, data decoding, screener, news ranking, calendar and markets outside the US, paper trading, heatmap layout and markets, option chains and Greeks, chart layouts, the script sandbox and result checks, community publishing, server). `npm run test:e2e`: drives the real desktop app with live data (needs internet). |
| `public/js/drawings.js`, `primitives.js` | Drawing tools, shaded bands and the countdown, drawn through the chart library's plugin API. |
| `public/js/markets.js`, `market-browser.js`, `quote-list.js`, `watchlist.js`, `alerts.js`, `search.js` | Markets catalog, the fast-scrolling markets list, the watchlist (its order and sections), alerts, symbol search. |
| `public/js/screener.js`, `heatmap.js`, `news.js` | The Screener, Heatmap (a squarified treemap) and News panels. |
| `public/js/options.js`, `lib/options.mjs` | The Options panel, and its option chains: Yahoo's and Deribit's in one shape, with Black-Scholes Greeks, implied volatility, expected move, put/call ratios, max pain and unusual activity (pure, unit-tested). |
| `public/js/paper.js`, `trading.js` | Paper trading: the simulated account (orders, fills, stops, P&L) and the Paper trading panel. Bar replay lives in `chart-view.js`. |

Charts are rendered with [TradingView Lightweight Charts™](https://www.tradingview.com/lightweight-charts/), an open-source (Apache-2.0) charting library.

## Data notes and limits

- **Crypto exchanges** need no keys.
  - Binance and Binance Futures aren't available in some countries (for example the US). There, use Coinbase symbols or Yahoo's, such as `YAHOO:BTC-USD`.
  - Coinbase history is fetched in pages, so it's shorter than Binance's.
- **Twelve Data** (only on a self-hosted static website) is an official API with a free plan: 800 requests a day, 8 per minute.
  - Wickline queues requests to stay within the limit. Raise the limit in ⚙ if you have a paid plan.
  - Some exchanges and instruments need a paid Twelve Data plan; their message is shown on the chart.
  - It has no futures. Gold and silver map to spot XAU/USD and XAG/USD.
- **Yahoo** is an unofficial, undocumented source. Both its live stream (used directly by the static site) and its history API (used by the optional server) can change or rate-limit without notice.
  - Some exchanges are delayed (often 15 minutes).
  - With the server, intraday history is limited: 1m (and timeframes built from it, like 3m) covers about 7 days, 2m–90m about 60 days, hourly timeframes about 2 years.
- **Full US stock and ETF lists** come from Nasdaq's public (unofficial) screener.
  - In the desktop app (and with `npm start`) they're refreshed every 10 minutes.
  - On a static website, `public/data/` holds only tickers, names and sectors, which are facts and not anyone's market data. Prices fill in from the live stream while markets trade, or from the visitor's Twelve Data key. Refresh the lists with `npm run update-data`; the Pages workflow does this on each deploy.
  - Prices on screen update live. % change can lag by a session; for real-time movers, use the screeners (server).
- **When charts move:** only while their market trades.
  - Crypto trades 24/7; forex around the clock on weekdays.
  - Stocks: intraday candles include pre-market and after-hours trades (turn off with **Ext**). Overnight trades, and extended-hours trades on daily and longer charts, show as a separate price line.
- **News** comes from the outlets' public RSS feeds. Wickline shows each headline and links to the article on the outlet's site. The economic and earnings calendars come from Yahoo (unofficial, like its prices), and Fed meeting dates from the Federal Reserve's website. Yahoo's free data has no forecasts for most releases (none outside the US), so that column usually stays empty. Earnings outside the US show EPS in the company's own currency and market caps converted to dollars. A few countries' releases have no fixed day yet; those show as "TBC".
- **Alerts** are checked while Wickline is open (the app or a browser tab). Nothing runs in the cloud.
- **Paper trading** fills orders while Wickline is open, at the prices it receives. When the price moves past a level between two live trades, a limit order (or take profit) fills at its own price and a stop (or stop loss) fills at the next trade, like a real stop would with slippage. In a replay it walks each candle open → low → high → close for a rising candle (open → high → low → close for a falling one), and fills a gap at the open. P&L is in each market's own currency and isn't converted.
- **Storage:** settings, watchlist, drawings, scripts and alerts stay on your computer. They're kept in the desktop app's profile, or in the browser's `localStorage` for the website.

**This is not financial advice.** Data can be delayed or wrong; don't rely on it for trading decisions.

## Roadmap ideas

- Volume profile and anchored VWAP
- Order flow for crypto (footprint charts, order book depth)
- Alerts on indicator values and script conditions
- More drawing tools (Fibonacci extensions, pitchfork, brush)
- Sharing scripts with other people
- More data sources (e.g. Kraken, OKX, or keyed providers like Alpaca/Polygon)

Contributions are welcome. Open an issue or a pull request.

## License

[MIT](LICENSE).

Charts are powered by [TradingView Lightweight Charts™](https://github.com/tradingview/lightweight-charts) (Apache-2.0), © TradingView, Inc. Its license requires attribution, which the TradingView logo on the chart and the link in the status bar provide. Keep them, or add equivalent attribution, if you modify Wickline.

Wickline is an independent project and is not affiliated with or endorsed by TradingView, Binance, Coinbase or Yahoo.
