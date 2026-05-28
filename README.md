# 台股每日分析看板

這是一個手機與電腦都能看的台股分析看板。第一版使用靜態 JSON 資料，之後可以接上自動行情來源或 Codex 產出的每日分析資料。

## 內容

- 台股大盤狀態
- 持股追蹤：0056、0050、00991A、00403A、2330
- 推薦觀察買入標的
- 每日 08:30 完整分析與盤中短版更新時間軸
- 風險提醒

## 本機預覽

在專案資料夾執行：

```powershell
C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m http.server 4173
```

然後打開：

```text
http://localhost:4173/
```

## 更新資料

目前資料在：

```text
data/dashboard.json
```

更新這個檔案後，重新整理網頁即可看到新內容。

## 公開部署

這是純靜態網站，可部署到：

- Vercel
- Netlify
- GitHub Pages

部署時選擇專案根目錄，不需要 build command。發布目錄使用根目錄即可。

### Vercel 手動部署

1. 打開 `https://vercel.com/new`
2. 選擇匯入 GitHub repo，或使用 Vercel Dashboard 的上傳方式。
3. Framework Preset 選 `Other`。
4. Build Command 留空。
5. Output Directory 留空或填 `.`。
6. Deploy。

## 後續可接資料

後續可以把 `data/dashboard.json` 替換成：

- 自動產生的每日分析 JSON
- 台股行情 API
- GitHub Actions 定時更新的 JSON
- Vercel/Netlify serverless function

## 風險提醒

本網站內容僅供分析與決策輔助，不構成投資建議或獲利保證。
