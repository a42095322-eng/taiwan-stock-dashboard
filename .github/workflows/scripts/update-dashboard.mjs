import { readFile, writeFile } from 'node:fs/promises';

const quoteSymbols = ['0056', '0050', '00991A', '00403A', '2330'];
const watchSymbols = ['2308', '2317', '2881'];
const dashboardPath = new URL('../data/dashboard.json', import.meta.url);

const holdingMeta = {
  '0056': {
    ticker: '0056',
    name: '元大高股息',
    note: '高股息 ETF 偏防禦配置，留意除息行情與成交量變化。',
    risk: '若金融與傳產權值轉弱，短線可能壓抑表現。'
  },
  '0050': {
    ticker: '0050',
    name: '元大台灣50',
    note: '大型權值股連動明顯，適合作為大盤方向核心觀察。',
    risk: '電子權值股回檔時，0050 會同步承壓。'
  },
  '00991A': {
    ticker: '00991A',
    name: '主動式台股 ETF',
    note: '主動式 ETF 需觀察持股調整、淨值追蹤與成交量。',
    risk: '成立時間較短，歷史績效與流動性仍需追蹤。'
  },
  '00403A': {
    ticker: '00403A',
    name: '主動式台股 ETF',
    note: '短線以淨值穩定度與成交量是否放大為主要觀察。',
    risk: '若流動性不足，買賣價差可能放大。'
  },
  '2330': {
    ticker: '2330',
    name: '台積電',
    note: 'AI 需求、外資動向與美國科技股表現仍是主要驅動。',
    risk: '若美國科技股回落或匯率急升，可能帶來獲利了結壓力。'
  }
};

const watchMeta = {
  '2308': {
    ticker: '2308',
    name: '台達電',
    reason: '電源、AI 伺服器與能源管理題材具市場關注度。'
  },
  '2317': {
    ticker: '2317',
    name: '鴻海',
    reason: 'AI 伺服器與電動車題材延續，適合觀察量價轉強。'
  },
  '2881': {
    ticker: '2881',
    name: '富邦金',
    reason: '金融股可作為科技股之外的分散配置觀察。'
  }
};

function taipeiNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
}

function toTaipeiIso(date) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date).replace(' ', 'T');

  return `${parts}+08:00`;
}

function numberOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'taiwan-stock-dashboard/1.0'
    }
  });

  if (!response.ok) throw new Error(`Request failed: ${response.status} ${url}`);
  return response.json();
}

async function fetchDailyRows() {
  const rows = await fetchJson('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL');
  return new Map(rows.map((row) => [row.Code, row]));
}

async function fetchMarketRows() {
  const rows = await fetchJson('https://openapi.twse.com.tw/v1/exchangeReport/FMTQIK');
  return rows.at(-1);
}

function quotePrice(row) {
  return numberOrNull(row?.ClosingPrice);
}

function quoteChange(row) {
  return numberOrNull(row?.Change);
}

function quoteChangePercent(row) {
  const price = quotePrice(row);
  const change = quoteChange(row);
  if (!Number.isFinite(price) || !Number.isFinite(change)) return null;
  const previous = price - change;
  if (!previous) return null;
  return Math.round((change / previous) * 10000) / 100;
}

function level(price, ratio) {
  if (!Number.isFinite(price)) return '';
  return String(Math.round(price * ratio * 100) / 100);
}

function volumeLabel(row) {
  const volume = numberOrNull(row?.TradeVolume);
  if (!volume) return '觀察中';
  if (volume >= 20000000) return '偏高';
  if (volume >= 5000000) return '中等';
  return '偏低';
}

function marketTone(changePercent) {
  if (!Number.isFinite(changePercent)) return '資料更新中，先以持股支撐壓力與風險控管為主。';
  if (changePercent > 0.6) return '大盤偏多，仍需留意追價風險與成交量是否同步放大。';
  if (changePercent < -0.6) return '大盤偏弱，先降低追價，觀察權值股是否止跌。';
  return '大盤區間整理，適合用條件式買入與分批方式管理部位。';
}

function buildHoldings(rows, updatedAt) {
  return quoteSymbols.map((symbol) => {
    const row = rows.get(symbol) ?? {};
    const meta = holdingMeta[symbol];
    const price = quotePrice(row);

    return {
      ticker: meta.ticker,
      name: row.Name || meta.name,
      price,
      change: quoteChange(row),
      changePercent: quoteChangePercent(row),
      volume: volumeLabel(row),
      note: meta.note,
      support: level(price, 0.985),
      resistance: level(price, 1.025),
      risk: meta.risk,
      updatedAt
    };
  });
}

function buildWatchlist(rows, updatedAt) {
  return watchSymbols.map((symbol) => {
    const row = rows.get(symbol) ?? {};
    const meta = watchMeta[symbol];
    const price = quotePrice(row);
    const changePercent = quoteChangePercent(row);
    const isStrong = Number.isFinite(changePercent) && changePercent > 0.8;

    return {
      ticker: meta.ticker,
      name: row.Name || meta.name,
      reason: meta.reason,
      trigger: isStrong ? '放量站穩當日高點或回測支撐不破再觀察。' : '等待回測支撐止跌，或突破整理區並放量。',
      support: level(price, 0.98) || '短期均線區',
      resistance: level(price, 1.035) || '近期高點區',
      risk: '若跌破支撐或量縮轉弱，暫不追價並降低部位。',
      updatedAt
    };
  });
}

function updateTimeline(existing, updateKind, market, updatedAt) {
  const type = updateKind === 'full' ? '完整分析' : '短版更新';
  const title = updateKind === 'full' ? '盤前完整分析' : '盤中短版更新';
  const summary = `${market.title}目前狀態：${market.status}，${market.tone}`;
  const details = updateKind === 'full'
    ? '今日以大盤方向、持股支撐壓力、推薦觀察標的買入條件與風險控管為主。'
    : '盤中更新著重價格、量能與買入條件是否改變；若資料延遲，以上次可取得資訊為準。';

  const next = [{ time: updatedAt, type, title, summary, details }, ...(existing ?? [])];
  const seen = new Set();
  return next.filter((entry) => {
    const key = `${entry.time}-${entry.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);
}

function inferUpdateKind(now) {
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour === 8 && minute < 45) return 'full';
  return 'short';
}

async function main() {
  const raw = JSON.parse(await readFile(dashboardPath, 'utf8'));
  const now = new Date();
  const taipeiDate = taipeiNow();
  const updatedAt = toTaipeiIso(now);
  const updateKind = process.env.UPDATE_KIND || inferUpdateKind(taipeiDate);

  let rows;
  let marketRow;
  try {
    rows = await fetchDailyRows();
    marketRow = await fetchMarketRows();
  } catch (error) {
    console.warn(error.message);
    rows = new Map();
    marketRow = null;
  }

  const index = numberOrNull(marketRow?.TAIEX) ?? raw.market?.index ?? null;
  const change = numberOrNull(marketRow?.Change) ?? raw.market?.change ?? null;
  const previousIndex = Number.isFinite(index) && Number.isFinite(change) ? index - change : null;
  const changePercent = previousIndex ? Math.round((change / previousIndex) * 10000) / 100 : raw.market?.changePercent ?? null;

  const market = {
    title: '台股大盤',
    status: updateKind === 'full' ? '盤前觀察' : '盤後資料更新',
    tone: marketTone(changePercent),
    index,
    change,
    changePercent,
    volume: marketRow?.TradeValue ? `成交值 ${Math.round(Number(marketRow.TradeValue) / 100000000)} 億元` : raw.market?.volume ?? '量能更新中',
    updatedAt
  };

  const dashboard = {
    market,
    holdings: buildHoldings(rows, updatedAt),
    watchlist: buildWatchlist(rows, updatedAt),
    timeline: updateTimeline(raw.timeline, updateKind, market, updatedAt),
    risk: '本網站內容僅供分析與決策輔助，不構成投資建議或獲利保證。買賣前請自行評估財務狀況、風險承受度與最新公開資訊。'
  };

  await writeFile(dashboardPath, `${JSON.stringify(dashboard, null, 2)}\n`, 'utf8');
  console.log(`dashboard updated: ${updatedAt} (${updateKind})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
