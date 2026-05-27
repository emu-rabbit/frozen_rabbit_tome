# 收藏品互動式 HTML 匯出交接筆記

建立日期：2026-05-27

## 現況

- 收藏品求解台已新增「匯出結果」按鈕，位置在收藏品結果區底部、`儲存秘笈` 左側；桌面寬度下兩顆按鈕平分空間，窄螢幕改為上下排列。
- 匯出的檔案是單一 `.html`，頁首只展示使用者當初輸入或選擇的資訊：物品、裝備數值、食物、採集點獎勵、遺物工具效果與收藏品求解器版本。它不展示 reward table、debug blob、結果摘要或其他研究用細節。
- 匯出時會把目前網站主題寫入 HTML class：明亮模式為 `export-theme-light`，暗黑模式為 `export-theme-dark`。下載檔應固定跟隨匯出當下的網站主題，而不是依開檔裝置的系統偏好切換。
- HTML 不要求全離線。它會透過 CDN 載入 PrimeIcons，物品與技能圖示沿用目前求解結果裡的外部 icon URL。
- 決策樹內容直接從 `CollectableSolverResult.policy` 序列化，不重新求解，也不重新壓縮策略，因此匯出內容會和畫面上的推薦策略一致。
- 網站 `CollectablePolicyView.vue` 與匯出 HTML 都使用 `src/utils/collectablePolicyInteraction.ts` 產生 guided questions、判斷選項完成度與選擇對應分支。後續若要調整「要問哪些問題」或「多個分支收斂時如何繼續」，請先改共用 helper，避免網站與匯出檔行為再次分歧。
- 網站與匯出檔的互動問題視覺節奏要維持一致；目前 `.guided-question` 的問題文字與選項按鈕間距為 `0.72rem`。如果後續調整這個間距，請同步改 `CollectablePolicyView.vue` 與 standalone HTML CSS。

## 主要實作入口

- `src/components/CollectableSolverPanel.vue`
  - 建立目前求解 request。
  - 組出 HTML 文件需要的 localized labels 與精簡輸入區塊。
  - 呼叫 HTML builder 並下載檔案。
- `src/utils/collectablePolicyInteraction.ts`
  - `buildCollectableGuidedQuestions()`：由 policy branches 產生網站與匯出共用的問題列表；收藏價值 / 耐久等數值題只有在有兩個以上可選值時才顯示。
  - `resolvedCollectableGuidedBranch()` 等 helper：維持網站與匯出對分支匹配、收斂分支的相同行為。
- `src/utils/collectableDecisionTreeHtmlExport.ts`
  - `buildCollectableDecisionTreeSnapshot()`：把 `CollectablePolicyNode` graph 轉成無循環、可序列化的 node map。
  - snapshot 會保存每個節點的 `guidedQuestions`、每個分支的 `criteria` 與收斂分支索引，standalone runtime 只讀這些資料，不自行重算問題。
  - `buildCollectableDecisionTreeHtml()`：產生 standalone HTML。
  - `downloadHtmlFile()` / `buildHtmlExportFileName()`：下載與檔名 helper。

## 後續擴展方向

- 模擬台如果要匯出收藏品決策樹，優先重用 `CollectableDecisionTreeHtmlDocument` 與 `buildCollectableDecisionTreeSnapshot()`，不要在模擬台另做一套 HTML runtime。
- 模擬台要先建立一層 adapter，將模擬 / 分析結果整理成與目前匯出器相容的 document：
  - `theme`：沿用 `useSettings().isDarkMode`，讓下載檔固定跟隨匯出當下主題。
  - `inputSections`：只放使用者在模擬台填入或選擇的條件；不要把分析 debug、完整分布或 reward table 塞進頁首摘要。
  - `policy`：若模擬台產出的互動樹已是 `CollectablePolicyNode`，直接走 `buildCollectableDecisionTreeSnapshot()`；若不是，先投影成 snapshot 形狀，再交給 HTML builder。
  - `texts`：不要硬寫中文，沿用 i18n label builder。新增文案時需補 `tw / en / cn / ja`。
- 模擬台若要匯出一般採集巨集，建議與收藏品 HTML 匯出保持同一個入口設計語意：使用者按「匯出結果」，一般採集下載 macro，收藏品下載 interactive HTML。底層可抽共用 `downloadHtmlFile()` / filename helper，但不要把 macro 與 decision tree 的資料模型混在一起。
- 一般採集匯出巨集可以維持在 macro builder；若未來也要把一般採集結果做成 HTML 報告，可新增平行的 document builder，但檔案下載 helper 可以共用。
- 若未來實驗台的策略樹不是 `CollectablePolicyNode` 形狀，建議先做一層 projection，把它投影成 `CollectableDecisionTreeSnapshot`，再交給 HTML builder。
- 這次沒有修改 solver、WASM、policy materialization、objective scoring 或 model version。若後續擴展會改變同一輸入的求解 / 分析結果，提交前仍需依 `AGENTS.md` bump `src/config/modelVersions.ts`。

## 模擬台擴展前檢查清單

- 先確認模擬台的「結果」是使用者指定手法的重放 / 分析，不是求解器推薦。文案應使用「模擬結果」、「分析結果」或「互動結果」，不要把它寫成「推薦策略」。
- 確認匯出檔頁首只展示使用者輸入值：物品、裝備數值、食物、採集點獎勵、遺物 / 工具設定、模擬器或分析器版本。不要顯示中間推導、完整 debug 或大型分布。
- 如果模擬台互動樹和求解台共用 guided question 行為，必須走 `collectablePolicyInteraction.ts`。如果模擬台有不同問題類型，請擴充 helper 的型別與測試，不要在匯出 runtime 裡臨時重算。
- 手機版要檢查互動區外層保留高度。現行 standalone CSS 在窄螢幕使用 `min-height: max(44rem, 100dvh)` 給背景承接高度，白色卡片本身不應被固定高度撐大。
- 如果修改 solver / simulator / analyzer 可觀察結果，提交前依 `AGENTS.md` 檢查是否需要 bump `src/config/modelVersions.ts`。

## 驗證建議

- 匯出 HTML 後在瀏覽器打開，檢查：
  - 頁首輸入條件是否只包含物品、裝備數值、食物、採集點獎勵、遺物工具效果與求解器版本。
  - 暗黑模式下匯出的 HTML 根節點是否有 `export-theme-dark`，背景與面板是否為暗色。
  - 起始建議動作、問題引導、分支選擇、上一層、回起點、終止分支是否和網站畫面一致。
  - 問題文字與下方選項按鈕間距是否和網站一致，避免匯出檔和網站元件視覺節奏分岐。
  - 收藏價值 / 耐久只有單一可選值時不應顯示成問題；耐久選項必須保留數字，例如 `3 耐久`、`4 耐久`。
  - 明亮 / 深色系統偏好下文字與按鈕不互相遮擋。
- 若調整互動 runtime，至少補一個 utility-level test 驗證 snapshot 保留 branch label keys、next id、node order、guided questions 與 branch criteria，避免導致 guided question 無法對應分支。
