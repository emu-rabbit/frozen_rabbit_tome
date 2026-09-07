# Tome 正式網域切換

目標正式網址為 `https://tome.frozenrabbit.com/`，測試站為 `https://tome.frozenrabbit.com/staging/`。

## 分支內設定

- Vite 預設 base 是 `/`；測試站建置指定 `VITE_BASE_PATH=/staging/`。
- 正式站 canonical、hreflang、OG、Twitter、結構化資料、robots、sitemap 指向新正式網址。
- 測試站 HTML 設定 `noindex, follow`，canonical 指向正式站，不另發佈 sitemap。
- Router 繼續使用 hash history。變更網域不需要改動既有 `#/settings` 等路由。
- 資料搬家仍使用 `https://emu-rabbit.github.io/gleaner/`，不可把 Gleaner 一起搬離舊 origin。
- 模型與資料交換識別字 `frozen_rabbit_tome`、localStorage key 不因網域變更而更名。

## 本機驗證

PowerShell，依序執行：

```powershell
npm run test:unit
$env:VITE_BASE_PATH = '/'
npm run build
node scripts/verify-deployment.mjs
npm run test:e2e -- --workers 2
$env:VITE_BASE_PATH = '/staging/'
npm run build
node scripts/verify-deployment.mjs
npm run test:e2e -- --workers 2
Remove-Item Env:VITE_BASE_PATH
```

Playwright 驗證的是本機 production build 與手機 viewport，不能取代正式網域 HTTPS、DNS、轉址及實體手機下載／選檔驗收。

## 發佈前與站外設定

目前 feature branch 的 push 不會部署。既有流程在 main/master 與 staging push 時，分別建置遠端正式分支及 staging，組合成一份 Pages artifact。因此本次遷移設定需要同時進入兩個來源分支；artifact 驗證會阻止仍帶舊網址或錯誤 base 的分支內容上線。不要只更新 staging 就切換正式網域。

GitHub Pages 的 Custom domain 與 DNS 不存在於 Git 分支內。2026-09-07 檢查時，此 repository 使用 Actions 發佈，Custom domain 尚未設定；不能宣稱推送此 feature branch 就完成網域切換。

1. 在 GitHub 驗證 `frozenrabbit.com` 網域所有權。準備 DNS，必要時提前降低 TTL。
2. 在協調好的切換時段，於本 repository 的 Settings → Pages 設定 `tome.frozenrabbit.com`，並設定 DNS CNAME `tome` → `emu-rabbit.github.io`。DNS 記錄不帶 repository 路徑。
3. 發佈已包含本次變更的正式／staging 分支。現有 Actions 部署不需要 `public/CNAME`。
4. 等待 DNS 與憑證就緒，確認 Enforce HTTPS、新站首頁及 `/staging/` 正常。檢查舊網址連同 hash/query 轉址後的結果。
5. 確認 Gleaner 最終網址仍位於 `https://emu-rabbit.github.io/gleaner/`，在原瀏覽器下載 Tome 備份，再於新網域完成匯入並重整檢查。
6. 更新外部姊妹站指向 Tome 的入口，於 Search Console 驗證新網址並提交新 sitemap；檢查 GA 實際收到的新網址。這些站外操作不由本 repository 的 push 完成。

正式站與 `/staging/` 共用 origin，目前也共用 localStorage key；沿用既有部署行為，測試匯入請使用獨立瀏覽器設定檔，避免更動正式使用資料。

若要回復舊網域，必須同時回復 Pages/DNS、舊 base 與 SEO 設定；只回復其中一項會留下不匹配的網站。保留搬家備份，新網域期間新增的資料不會自動回到舊 origin。

官方依據：[GitHub Pages 自訂網域設定](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。
