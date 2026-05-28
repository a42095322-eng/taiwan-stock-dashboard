import { formatSignedNumber, normalizeDashboard } from './data.js';

const currencyFormatter = new Intl.NumberFormat('zh-TW', {
  maximumFractionDigits: 2,
});

function formatDateTime(value) {
  if (!value) return '尚未取得時間';
  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderMarket(market) {
  const marketElement = document.querySelector('#market');
  const lastUpdated = document.querySelector('#last-updated');
  lastUpdated.textContent = `更新：${formatDateTime(market.updatedAt)} · ${market.freshness}`;

  marketElement.innerHTML = `
    <div class="market-panel__copy">
      <span class="status-pill">${escapeHtml(market.status)}</span>
      <h2>${escapeHtml(market.title)}</h2>
      <p>${escapeHtml(market.tone)}</p>
    </div>
    <div class="market-panel__numbers">
      <div class="index-value">${market.index ? currencyFormatter.format(market.index) : '—'}</div>
      <div class="change-line ${market.state}">
        <span>${escapeHtml(market.changeText)}</span>
        <span>${escapeHtml(market.changePercentText)}</span>
      </div>
      <div class="muted">${escapeHtml(market.volume)}</div>
    </div>
  `;
}

function renderHoldings(holdings) {
  const container = document.querySelector('#holdings');

  container.innerHTML = holdings.map((holding) => `
    <article class="card holding-card">
      <div class="card__top">
        <div>
          <h3>${escapeHtml(holding.ticker)}</h3>
          <p>${escapeHtml(holding.name)}</p>
        </div>
        <span class="quote-state ${holding.state}">${escapeHtml(holding.changePercentText)}</span>
      </div>
      <div class="price-row">
        <strong>${holding.price ? currencyFormatter.format(holding.price) : '—'}</strong>
        <span class="${holding.state}">${escapeHtml(holding.changeText)}</span>
      </div>
      <p class="note">${escapeHtml(holding.note)}</p>
      <dl class="levels">
        <div><dt>支撐</dt><dd>${escapeHtml(holding.support || '—')}</dd></div>
        <div><dt>壓力</dt><dd>${escapeHtml(holding.resistance || '—')}</dd></div>
        <div><dt>量能</dt><dd>${escapeHtml(holding.volume || '—')}</dd></div>
      </dl>
      <p class="risk-note">${escapeHtml(holding.risk)}</p>
      <small>${formatDateTime(holding.updatedAt)}</small>
    </article>
  `).join('');
}

function renderWatchlist(watchlist) {
  const container = document.querySelector('#watchlist');

  container.innerHTML = watchlist.map((item) => `
    <article class="card watch-card">
      <div class="card__top">
        <div>
          <h3>${escapeHtml(item.ticker)}</h3>
          <p>${escapeHtml(item.name)}</p>
        </div>
        <span class="watch-badge">候選</span>
      </div>
      <p class="note">${escapeHtml(item.reason)}</p>
      <div class="trigger-box">
        <span>買入條件</span>
        <strong>${escapeHtml(item.trigger)}</strong>
      </div>
      <dl class="levels">
        <div><dt>支撐</dt><dd>${escapeHtml(item.support)}</dd></div>
        <div><dt>壓力</dt><dd>${escapeHtml(item.resistance)}</dd></div>
      </dl>
      <p class="risk-note">${escapeHtml(item.risk)}</p>
      <small>${formatDateTime(item.updatedAt)}</small>
    </article>
  `).join('');
}

function renderTimeline(timeline) {
  const container = document.querySelector('#timeline');

  container.innerHTML = timeline.map((entry) => `
    <article class="timeline-item">
      <div class="timeline-item__time">
        <span>${escapeHtml(entry.type)}</span>
        <strong>${formatDateTime(entry.time)}</strong>
      </div>
      <div class="timeline-item__content">
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.summary)}</p>
        <details>
          <summary>查看細節</summary>
          <p>${escapeHtml(entry.details)}</p>
        </details>
      </div>
    </article>
  `).join('');
}

function renderRisk(risk) {
  document.querySelector('#risk').innerHTML = `
    <h2>風險提醒</h2>
    <p>${escapeHtml(risk)}</p>
  `;
}

function renderError(error) {
  document.querySelector('#market').innerHTML = `
    <div class="error-box">
      <h2>資料暫時無法讀取</h2>
      <p>請稍後再試。錯誤訊息：${escapeHtml(error.message)}</p>
    </div>
  `;
  document.querySelector('#last-updated').textContent = '資料讀取失敗';
}

async function init() {
  try {
    const response = await fetch('./data/dashboard.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const dashboard = normalizeDashboard(await response.json());
    renderMarket(dashboard.market);
    renderHoldings(dashboard.holdings);
    renderWatchlist(dashboard.watchlist);
    renderTimeline(dashboard.timeline);
    renderRisk(dashboard.risk);
  } catch (error) {
    renderError(error);
  }
}

init();

export { escapeHtml, formatDateTime, formatSignedNumber };
