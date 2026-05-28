export function formatPercent(value) {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0.00%';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatSignedNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  const formatted = value.toFixed(digits);
  if (value === 0) return formatted;
  return `${value > 0 ? '+' : ''}${formatted}`;
}

export function getChangeState(value) {
  if (!Number.isFinite(value) || value === 0) return 'neutral';
  return value > 0 ? 'up' : 'down';
}

export function getFreshnessLabel(timestamp, now = new Date()) {
  if (!timestamp) return '尚未取得資料';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '尚未取得資料';

  const diffMinutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (diffMinutes >= 12 * 60) return '資料可能延遲';
  if (diffMinutes < 1) return '剛剛更新';
  if (diffMinutes < 60) return `${diffMinutes} 分鐘前更新`;

  const hours = Math.round(diffMinutes / 60);
  return `${hours} 小時前更新`;
}

function normalizeHolding(holding) {
  const changeValue = Number(holding.change);
  const changePercentValue = Number(holding.changePercent);

  return {
    ticker: holding.ticker ?? '',
    name: holding.name ?? '',
    price: holding.price ?? null,
    change: Number.isFinite(changeValue) ? changeValue : null,
    changePercent: Number.isFinite(changePercentValue) ? changePercentValue : null,
    volume: holding.volume ?? '',
    note: holding.note ?? '',
    support: holding.support ?? '',
    resistance: holding.resistance ?? '',
    risk: holding.risk ?? '',
    updatedAt: holding.updatedAt ?? '',
    changeText: formatSignedNumber(changeValue),
    changePercentText: formatPercent(changePercentValue),
    state: getChangeState(changePercentValue),
  };
}

export function normalizeDashboard(raw = {}) {
  const market = raw.market ?? {};

  return {
    market: {
      title: market.title ?? '台股大盤',
      status: market.status ?? '資料準備中',
      tone: market.tone ?? '等待最新分析',
      index: market.index ?? null,
      change: market.change ?? null,
      changePercent: market.changePercent ?? null,
      volume: market.volume ?? '',
      updatedAt: market.updatedAt ?? '',
      freshness: getFreshnessLabel(market.updatedAt),
      changeText: formatSignedNumber(Number(market.change)),
      changePercentText: formatPercent(Number(market.changePercent)),
      state: getChangeState(Number(market.changePercent)),
    },
    holdings: Array.isArray(raw.holdings) ? raw.holdings.map(normalizeHolding) : [],
    watchlist: Array.isArray(raw.watchlist) ? raw.watchlist : [],
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    risk: raw.risk ?? '本頁內容僅供分析與決策輔助，不保證投資結果。',
  };
}
