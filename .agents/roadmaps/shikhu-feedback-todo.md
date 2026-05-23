# Shikhu 回饋收斂待辦

本文件整理與 Shikhu 討論後收斂出的後續方向。此文件是給未來 Agent 接手時使用的產品與技術脈絡，不代表所有項目都應立即實作。執行前仍需依任務類型讀取 `.agents/skills/` 內的核心、業務與專業規範。

## 超簡要檢視區

### 主待辦

1. **分享、匯出、復現資料**
   - 整理 JSON export/import，使其足以重現結果，但避免輸出過多噪音。
   - 保留未來 Discord 分享、指南引用、第三方復現的可能性。

2. **新增兩個報表比較功能**
   - 讓使用者比較兩份分析報表，例如 spiritbond rotation vs normal rotation。
   - 優先考慮一般採集實驗區與收藏品實驗區的共用比較模型。

3. **效能與 OOM 壓力測試**
   - 特別關注低 Gathering/Perception、高 GP 的版本初期情境。
   - 這是較偏後端 / 演算法品質的項目。

4. **Frontier 實驗區**
   - 用於尚未完全確認資料的機制，例如 Brazen probability distribution 與 Collector's High Standard proc rate。
   - 允許使用者手動輸入未知參數，以便實驗接近 endgame rotation 的模型。

### 低優先備註

- **策略編輯器可用性**：未來可研究 rule group、fallback action、策略模板或類 nested logic 的輕量替代，但不要貿然引入複雜巢狀 UI。
- **版本差異管理**：Evercold 後繁中服與國際服可能出現技能版本差異，長期可能需要 action model / formula versioning。

## 詳細內容

## 1. 分享、匯出、復現資料

### 背景

Shikhu 提到希望能在 Discord 分享設定，也可能將 JSON 用於 Icy Veins 指南上的視覺化工具。由於網站目前是 GitHub Pages 靜態網站，短網址若要包含收藏品決策樹會有實作與穩定性問題。

### User Story

作為研究者或指南作者，我希望能匯出一份足以重現輸入、公式版本、限制與結果的資料，這樣我可以和他人討論、驗證或嵌入其他指南工具。

### 已討論取捨

- 短 URL 適合簡單 rotation，但收藏品決策樹資料量可能過大。
- JSON 檔案較適合完整復現，但目前輸出仍太雜。
- Discord 直接貼 JSON 可能撞文字限制，但上傳文字檔應可行。

### 可能方向

- 保留 JSON export/import。
- 將 export schema 瘦身，只保留能重現決策樹與報表的必要資料。
- 匯出內容應包含：
  - app version / commit / algorithm version。
  - input stats / base values / item / node settings。
  - objective / scoring preference。
  - formula debug。
  - limitations。
  - report summary。
  - policy 或 strategy analysis 必要資料。
- 未來若做 share code，先以普通採集或簡短 rotation 為主，不要先挑收藏品決策樹。

## 2. 新增兩個報表比較功能

### 背景

Shikhu 提到一般採集模擬器 / 分析器可用於研究，例如比較 spiritbond rotation 與 normal rotation 的產出差異。這延伸成一個更通用的需求：比較兩份分析報表。

### User Story

作為想比較兩種手法的玩家，我希望能把兩份分析報表並排比較，快速看出期望值、最小值、最大值、分布與資源消耗差異。

### 可能比較內容

- expected yield / expected score。
- min / max outcome 與機率。
- outcome distribution 差異。
- GP 使用量。
- 耐久使用量。
- 採集成功或失敗風險。
- tier counts / reward vector。
- Revisit 影響前後差異。

### 取捨

- 一開始可以只支援「同類型報表」比較，例如 regular vs regular、collectable vs collectable。
- 跨系統比較容易語意混亂，應延後。
- 報表比較依賴穩定的 export/report schema，因此可與第 1 項一起規劃。

## 3. 效能與 OOM 壓力測試

### 背景

Shikhu 提醒版本拓荒期可能出現低 Gathering / Perception 但高 GP 的情境。這會讓更多補成功率、補價值、恢復耐久與 proc 分支變得有意義，搜尋空間可能膨脹。

2026-05-23 後收藏品求解器已改為 WASM-first，部分舊 JS heap OOM case 已大幅緩解；現況請以 `.agents/roadmaps/wasm-solver-migration-report.md` 為主。不過極端輸入仍可能遇到 memo capacity / memory allocation guard，因此這裡的產品風險已從「整頁 OOM crash」收斂為「需要穩定完成、可控失敗、清楚告知使用者限制」。

### User Story

作為工具使用者，我希望即使輸入極端但合理的拓荒期數值，網站也不會 crash；若計算很久，至少要能穩定完成或給出可理解的限制提示。

### 待辦方向

- 建立低屬性高 GP 的壓力測試案例。
- 觀察 `statesSolved`、`branchCount`、`memoHits`、`calculationTime`、`stateKeyEngine`、memo capacity 等 debug stats。
- 確認 memo capacity / allocation failure 會回傳可理解提示，不會 fallback 到更危險的高壓 JS 路徑。
- 檢查 Web Worker 與 WASM memory 使用。
- 對代表性極端輸入建立回歸測試或效能門檻。

### 取捨

- 使用者可以接受「算很久」。
- 不能接受 OOM crash、整頁崩潰，或沒有說明的 worker 失敗。
- 不可為了效能偷刪合法分支；後續若新增剪枝，必須證明 outcome distribution、reward/tier counts 與可達高分尾端不變。

## 4. Frontier 實驗區

### 背景

目前正式收藏品求解器排除 `Brazen` 與 `Collector's High Standard`，原因是機率、分布與疊加規則尚未完全確認。Shikhu 表示 endgame 現行 rotation 會用到這些機制，尤其 `Brazen under Collector's High Standard` 可能是 guaranteed amount。

### User Story

作為高階玩家或研究者，我希望能手動輸入尚未確認的 proc rate 或分布，並在隔離的實驗區測試接近 endgame 實際手法的模型，而不是等待所有資料完全確認。

### 初步範圍

- Brazen probability distribution。
- Collector's High Standard proc rate。
- Brazen under Collector's High Standard 的確定值或公式。
- 可能允許使用者選擇節點類型或手動覆蓋 proc rate。

### 已討論取捨

- Frontier 區不能把未確認資料包裝成正式求解器結果。
- UI 必須明確標示「研究 / 實驗 / 未確認」。
- 正式秘笈仍應保守，不納入缺乏機率的機制。
- 這對 Evercold 之後也可能有價值，因為新資料收集需要時間。

## 低優先備註 A：策略編輯器可用性

### 背景

Shikhu 提出一個想法：與其重複寫多條條件，例如收藏價值滿後先 Solid Reason、再 Wise、最後 Collect，也許一個 strategy 可以包含多個 action 或 if/else 邏輯。

### 目前判斷

此方向在演算法或策略描述上合理，但 UI/UX 風險高。巢狀邏輯在手機版尤其容易變難用，也容易增加一般使用者負擔。

### 未來可研究但低優先的替代方向

- rule group。
- fallback action。
- strategy template。
- 「滿收藏價值後收尾」這類預設策略片段。
- 類 logic gate 的扁平化 UI。

### 重要取捨

不要直接實作完整巢狀條件編輯器，除非已有清楚的互動設計與手機版驗證。

## 低優先備註 B：版本差異管理

### 背景

目前繁中服與國際服都在 7.x，採集技能相容性高。但 Evercold 後可能產生版本差距，使技能效果、公式或資料來源需要版本化。

### 未來可能方向

- action model versioning。
- formula versioning。
- data source version / server region 標記。
- UI 讓使用者知道目前採用哪個遊戲版本模型。

### 目前取捨

這是長期維護議題，不應優先於目前 Shikhu 回饋中已明確阻礙使用的資料分享、報表比較、效能與 Frontier 實驗問題。
