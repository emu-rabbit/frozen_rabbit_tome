# Shikhu 回饋收斂待辦

本文件整理與 Shikhu 討論後收斂出的後續方向。此文件是給未來 Agent 接手時使用的產品與技術脈絡，不代表所有項目都應立即實作。執行前仍需依任務類型讀取 `.agents/skills/` 內的核心、業務與專業規範；若任務牽涉求解器 WASM、memo capacity 或 debug/export 驗證，另讀 `.agents/skills/business/algorithm_verification.md`。

## 超簡要檢視區

### 主待辦

1. **匯出 JSON 的再次匯入功能**
   - 讓目前匯出的 JSON 可以在網頁中重新匯入，並依 `manifest.scenario` 進入對應畫面。
   - 匯入後應重建原本的輸入、手法 / 策略與分析或秘笈結果，讓使用者能直接查看、驗證或繼續調整。

2. **Frontier 實驗區**
   - 用於尚未完全確認資料的機制，例如 Brazen probability distribution 與 Collector's High Standard proc rate。
   - 允許使用者手動輸入未知參數，以便實驗接近 endgame rotation 的模型。

### 次要待辦

- **新增兩個報表比較功能**：讓使用者比較兩份分析報表，例如 spiritbond rotation vs normal rotation；優先考慮一般採集實驗區與收藏品實驗區的共用比較模型。

### 低優先備註

- **策略編輯器可用性**：未來可研究 rule group、fallback action、策略模板或類 nested logic 的輕量替代，但不要貿然引入複雜巢狀 UI。
- **版本差異管理**：Evercold 後繁中服與國際服可能出現技能版本差異，長期可能需要 action model / formula versioning。

## 詳細內容

## 1. 匯出 JSON 的再次匯入功能

### 背景

目前已建立一般採集秘笈、收藏品秘笈、一般採集實驗與收藏品實驗的 JSON 匯出格式。匯出資料已包含重建所需的輸入、策略 / 手法、結果摘要與分析資訊，但使用者仍需要能把檔案重新載回網頁，才算完成「分享後可直接查看」的閉環。

### User Story

作為收到 JSON 檔案的玩家、研究者或指南作者，我希望能把檔案匯入網頁，讓網站自動進入對應的秘笈或實驗畫面，並顯示原本匯出的輸入與結果。

### 初步範圍

- 支援辨識 `tome.regular`、`tome.collectable`、`experiment.regular`、`experiment.collectable`。
- 匯入後應導向對應頁面：一般秘笈、收藏品秘笈、一般實驗或收藏品實驗。
- 重建玩家數值、食物、採集點設定、物品、objective / scoring preference。
- 一般採集需重建 rotation；收藏品實驗需重建 strategy rules。
- 收藏品秘笈需能使用 `strategyCodec` 還原可讀策略，或在必要時重新求解並清楚標示來源。
- 匯入後應顯示既有分析 / 結果摘要；若資料版本不相容或缺欄位，需給出可理解的錯誤或降級提示。

### 已討論取捨

- 匯入功能第一版可以只支援目前 `schemaVersion: 1` 的官方匯出 JSON，不必支援手寫或舊版不完整 JSON。
- 不應直接信任匯入內容覆蓋使用者既有儲存資料；若要保存到藏書庫或實驗資料庫，應由使用者另外確認。
- 若匯入的 JSON 包含分析結果，畫面可先顯示原結果；若使用者修改輸入，則應要求重新求解或重新分析。
- 匯入流程應避免把收藏品秘笈誤呈現為固定 linear rotation；收藏品仍應維持 policy / strategy 心智模型。

## 2. Frontier 實驗區

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

## 次要待辦 A：新增兩個報表比較功能

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
- 報表比較可沿用目前已建立的 JSON / report schema，但仍需另外設計比較 UI 與差異摘要。

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

這是長期維護議題，不應優先於目前 Shikhu 回饋中仍屬主要待辦的 JSON 匯入閉環與 Frontier 實驗問題。
