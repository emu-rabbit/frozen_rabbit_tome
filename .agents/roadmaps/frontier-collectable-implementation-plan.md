# Frontier 收藏品研究模式實作計畫

本文件是後續 Agent 實作 Frontier 第一階段時的交接入口。Frontier 的目標是提供 theory crafter 一個更貼近遊戲內容、但仍明確隔離於正式秘笈與實驗模型之外的研究場地。

執行前仍需先依 `AGENTS.md` 讀取核心脈絡；若開始實作 UI，另讀 `.agents/skills/professional/ui_ux_standards.md`；若碰到採集公式、收藏品技能、分析輸出或 JSON 匯出，另讀 `.agents/skills/business/gathering_math_formulas.md`、`.agents/skills/business/ffxiv_gathering_skills.md` 與 `.agents/skills/business/algorithm_verification.md`。

## 2026-05-30 Phase 0 交接報告

Phase 0 的入口與開關骨架已完成，但本段紀錄的是目前工作區進度；若尚未 commit，後續 Agent 需先檢查 `git status --short` 與實際 diff。

已完成：

- 新增設定狀態 `frozen-rabbit-tome-frontier-settings`，目前 shape 為 `{ enabled: boolean }`，預設 `false`。
- `useSettings.ts` 保留舊欄位 `{ collectableEnabled: boolean }` 到 `{ enabled: boolean }` 的一次性遷移，避免已開過開關的本機設定失效。
- 新增開拓主入口 route：`/#/frontier`。
- 保留舊 route `/#/frontier/collectable`，目前 redirect 到 `/#/frontier`，避免早期測試連結斷掉。
- 新增研究庫 route：`/#/frontier/studies`。
- 新增空頁：
  - `src/views/FrontierCollectable.vue`：目前仍沿用內部檔名，但對外顯示為「開拓研究」。
  - `src/views/FrontierStudies.vue`：對外顯示為「開拓研究庫 / 研究案例」。
- `Sidebar.vue` 只有在 `frontierSettings.enabled` 為 `true` 時才顯示「建立開拓研究」入口。
- `Settings.vue` 新增使用者可見開關。
- `App.vue` 的 `KeepAlive` 已加入 `FrontierCollectable` 與 `FrontierStudies`。
- `tw`、`cn`、`ja`、`en` 四語系已補開拓入口與設定文案。

使用者在本輪明確修正的產品規範：

- 使用者可見文字英文使用 `Frontier`；繁中 / 日文用「開拓」，簡中用「开拓」。`Pioneering` 不是官方用語，不可再用於對外文案。
- 對外入口名稱不可綁「收藏品」，因為未來可能支援多個開拓模型；側邊欄建立入口目前對外稱「建立開拓研究」，頁面 title 稱「開拓研究」。
- 對外畫面不可暴露內部邏輯、開發狀態或 debug 語氣。避免出現「第一版」、「尚未接入」、「後續再接入」、「正式模型」等施工或內部治理文字。
- 開拓頁面 title 要對齊其他既有頁面：單層主標題加描述，不要再加一層 kicker / eyebrow 造成視覺雜音。

目前驗證：

- `npm run build` 已通過。
- 已用 Playwright 檢查繁中畫面：
  - 設定頁顯示「開拓研究模式」與「顯示開拓研究」。
  - 側邊欄顯示「建立開拓研究」與「開拓研究庫」。
  - `/#/frontier` 頁面顯示單層「開拓研究」標題。
  - `/#/frontier/collectable` 會 redirect 到 `/#/frontier`。
  - 開拓頁 body 不含 `Frontier`、`開拓收藏品` 或 `收藏品研究` 等被使用者要求移除的對外字樣。

尚未完成 / 下一步建議：

- 目前只有 Phase 0 空入口與啟用提示，尚未建立 Frontier domain skeleton、probability profile、Brazen bucket editor、storage、JSON schema 或 engine。
- 下一步若進入 Phase 1，仍應保持「對外泛用開拓入口、內部可先做 collectable model」的分層；不要把使用者可見入口重新命名成收藏品專用。
- 若開始新增 engine、分析模型、JSON schema 或 storage schema，需要新增或更新 Frontier / 開拓專用 model version；純 UI 入口與文案調整不需要 bump `src/config/modelVersions.ts`。

### 開拓入口心智模型補充

使用者在 2026-05-30 補充了未來入口設計方向。後續 Agent 不應把「建立開拓研究」做成直接進單一收藏品表單；它應更接近現有「創建秘笈 / 創建實驗」的搜尋選物流程：

- 使用者先在開拓入口搜尋並選擇採集物品。
- 選中物品後，系統搜尋目前支援的開拓模型。
- 目前預期只支援一個模型：`黃金遺產收藏品模型`。
- 因此，只有點選收藏品時會顯示小型模型選擇框或提示卡，內容表示找到相符的 `黃金遺產收藏品模型`。
- 若使用者選擇一般採集品或其他沒有支援模型的物品，畫面應顯示「沒有找到相符模型」之類的清楚提示，而不是直接進入研究台。
- 使用者選中 `黃金遺產收藏品模型` 後，才進入使用該模型的開拓研究台。
- 對外入口仍保持泛用「開拓研究」心智模型；內部第一個 model 可以是 collectable / Dawntrail collectable，但不可讓主入口文案退回收藏品專用。

## 2026-05-30 Phase 1 / Phase 2 交接報告

Phase 1 與 Phase 2 的第一版 domain / engine 骨架已完成，尚未等於完整研究台 UI。下一步仍應走 Phase 3，把策略編輯、分析按鈕、儲存、再次開啟、JSON 匯入整合成完整產品流程。

已完成：

- 新增獨立 Frontier model version catalog：`src/frontier/frontierModelVersions.ts`。
- 新增開拓收藏品 domain 型別：`src/frontier/collectable/frontierCollectableTypes.ts`。
- 新增 `probabilityProfile` helper 與驗證：`frontierCollectableProbabilityProfile.ts`。
- 新增開拓專用 action definition：`frontierCollectableActions.ts`，包含 `brazen`，但不污染正式 `CollectableActionKind`。
- 新增精確分布 analyzer / simulator：`frontierCollectableSimulator.ts`。
- 新增 Frontier JSON export skeleton：`frontierCollectableExport.ts`。
- 新增 Frontier Studies storage skeleton：`frontierCollectableStorage.ts`。
- 開拓的 Brazen bucket profile 應嵌入既有收藏品實驗台風格，不再使用獨立自製的 `FrontierBrazenBucketEditor.vue` UI。
- 補四語系 bucket editor 文案。

Phase 2 engine 現況：

- 採用精確分布與 decision-state memo，不採 Monte Carlo。
- `Brazen` 由使用者提供的離散 bucket 展開。
- `standardMode` 使用互斥槽位：`none | standard | highStandard`。
- `Collect`、`Scour`、`Brazen`、`Meticulous` 都會消耗洞察 / 強化洞察。
- `High Standard + Brazen` 固定為 `Scour * 150%`，`High Standard + Meticulous` 使用 Scour 基準且不耗耐久率額外 +40 percentage points。
- `Priming Touch + High Standard` 只讓基礎慎重不耗率翻倍，再加 High Standard 的 +40，不把 +40 一起翻倍。
- `Brazen`、`Scrutiny` 與價值提升加成完成後最後再 `floor`。
- 無 rule match 或沒有可施放 action 時進入 uncovered terminal，不猜 fallback。
- 有 `maxStates` / `maxTransitions` guard，觸發時回傳 limited result。

測試 / 驗證：

- `npm run test:unit -- src/frontier/frontierModelVersions.test.ts src/frontier/collectable/frontierCollectableProbabilityProfile.test.ts src/frontier/collectable/frontierCollectableSimulator.test.ts` 通過。
- `npm run test:unit` 通過。
- `npm run build` 通過。
- 使用 Playwright 檢查本機 `/#/frontier`：設定開啟後可看到開拓頁與 bucket editor，5 個預設 bucket 產生 10 個數字輸入，總機率顯示 100%，頁面 body 未出現使用者要求避免的 `Frontier` 對外字樣。

後續 Phase 3 注意：

- 目前開拓頁只接了 Brazen bucket editor，尚未接物品搜尋、模型選擇、策略編輯器、分析按鈕、結果圖表、保存 / 再開啟或完整匯入流程。
- 若要把 `frontierCollectableSimulator.ts` 接進 UI，應先建立研究台 request 組裝層，從 item runtime data hydrate base values / reward table，而不是要求使用者手填 runtime 欄位。
- 若新增或破壞 Frontier JSON / storage schema，必須更新 `frontierModelVersions.ts` 對應版本與測試。
- 若修改正式 collectable math / mechanics / solver 路徑，仍需依 `AGENTS.md` 同步檢查正式 scenario-aware model versions 與 TS/WASM 邊界。

## 目前已決策

- Frontier 會是新的入口，不是秘笈或現有實驗頁的一個模式。
- Frontier 入口必須由設定頁的新設定開關控制，預設關閉；一般使用者預設看不到。
- 第一階段只做收藏品。
- 第一階段是使用者輸入策略後模擬與分析，不做求解器，不自動產生推薦策略。
- Frontier 是既有收藏品實驗模型的研究延伸：沿用目前已確認的收藏品採集邏輯，但額外納入 `Brazen / 大膽提煉` 與 `Collector's High Standard / 強化洞察`。
- Frontier 的入口、schema、model version、localStorage 與研究假設輸入必須獨立；但既有收藏品公式、採集成功、GP、耐久、reward / tier、`Scrutiny`、`Collector's Focus`、`Priming Touch`、成功率補強、恢復耐久、`Wise to the World` 等已知行為應與現有收藏品模型保持一致，不可另寫一份會漂移的平行邏輯。
- 可以使用現有物品、物品搜尋、runtime game data、reward table hydration 與 gear / food 輸入流程；這些是資料來源與 UI 基礎。
- `Brazen / 大膽提煉` 的未知機率資料採用使用者輸入的離散 bucket 形式，不用單一 uniform 假設。
- `Brazen / 大膽提煉` 的取整順序已由使用者確認為最後再 `floor`。
- `Collector's High Standard / 強化洞察` 的效果模型已由 2026-05-29 使用者提供遊戲畫面確認；觸發率仍未知，第一版應保留使用者輸入觸發率或手動狀態，不可把未知觸發率寫成正式規則。
- `Collect / 收藏品採集` 已由使用者確認會消耗洞察 / 強化洞察。
- 第一版不納入 `Revisit`；範圍比照現有實驗台，只考慮單點採集。
- Frontier study 不進 Experiment Database，長期作為新的 Frontier Studies 區域；側邊欄上區放 Frontier 建立 / 進入入口，下區放 Frontier Studies 儲存入口。
- UI 完整度比照現有實驗台處理：建立、分析、儲存、再次開啟、JSON 匯出 / 匯入都應納入第一版產品路徑；比較功能不在第一版額外擴張。
- 分析引擎採精確分布，不採 Monte Carlo 作為第一階段主路徑。

## 產品定位

Frontier 是研究沙盒。它延續已確認的收藏品採集邏輯，並讓玩家替尚未確認的 `Brazen` 分布與 `High Standard` 觸發率提供假設後，測試接近 endgame 實際手法的策略分布；但不能對外宣稱這兩個未知機率已等同正式遊戲模型。

使用者可見文案要避免：

- 最佳
- 唯一正解
- 已完整支援 Brazen / High Standard
- 真實遊戲期望值

建議使用：

- 研究假設
- 依你提供的機率資料分析
- Frontier 研究結果
- 尚待實證的模型
- 此結果僅代表目前 Frontier 假設

## 硬邊界

Frontier 第一階段的硬邊界不是「重寫一份完全不同的收藏品模型」，而是「不要把研究假設污染正式秘笈 / 實驗模型」。後續實作必須遵守：

- Frontier 的 route、UI 入口、localStorage key、JSON scenario、schema 與 model version 應獨立於 `tome.collectable` 與 `experiment.collectable`。
- Frontier engine request / result 型別應有自己的命名與 schema，不直接把正式 `CollectableSolverRequest`、`CollectableSolverResult`、`CollectableStrategyBuildRequest` 或現有儲存型別當成 Frontier 對外資料格式。
- 已確認的收藏品公式與狀態轉移應盡量共用或抽出可共用 helper，確保 Frontier 與既有收藏品實驗在 `Brazen` / `High Standard` 以外的行為一致。
- 若暫時需要複製既有公式或狀態邏輯，必須在 Frontier 檔案註明來源，並用 Frontier 專用測試與現有收藏品測試守住 parity；後續若正式模型修正同一段已知邏輯，也要同步檢查 Frontier。
- `Brazen` 分布與 `High Standard` 觸發率只能從 `probabilityProfile` 或手動狀態輸入而來，不可寫成未經確認的固定正式規則。
- Frontier 不應呼叫正式收藏品 solver / WASM core 來產生推薦；第一版只展開使用者策略並分析分布。

可重用現有資料與經驗：

- `src/utils/collectableMath.ts` 的已確認公式可以直接共用，或先抽成更清楚的 shared helper。
- `src/utils/collectableMechanics.ts`、`src/utils/collectableStrategyTree.ts`、`src/utils/collectableStrategyAnalysis.ts` 的行為可作為單點採集實驗 parity 來源；若直接共用內部 helper，必須先確認不會把 Frontier-only action / state 寫回正式模型路徑。
- 現有收藏品 UI、策略台、JSON export / import、storage 與測試案例可作為實作參考，但 Frontier 的研究假設、版本與保存區域要獨立。

## 建議檔案架構

建議建立獨立目錄：

```txt
src/frontier/collectable/
  frontierCollectableTypes.ts
  frontierCollectableFormulas.ts
  frontierCollectableActions.ts
  frontierCollectableSimulator.ts
  frontierCollectableAnalyzer.ts
  frontierCollectableExport.ts
  frontierCollectableStorage.ts
  frontierCollectable*.test.ts
```

建議 UI 目錄：

```txt
src/views/FrontierCollectable.vue
src/views/FrontierStudies.vue
src/components/frontier/FrontierProbabilityProfileEditor.vue
src/components/frontier/FrontierStrategyEditor.vue
src/components/frontier/FrontierAnalysisPanel.vue
```

若專案慣例後續偏好不在 `src/frontier` 建 domain，也可放在 `src/utils/frontierCollectable*.ts`，但必須維持命名隔離，不要混入正式 collectable 檔案。

## 路由與入口

建議新增：

- route：`/#/frontier/collectable`
- studies route：例如 `/#/frontier/studies`
- route name：`FrontierCollectable`
- studies route name：`FrontierStudies`
- 設定 key：例如 `settings.frontier.enabled` 或 `experimentalFeatures.frontierCollectable`

入口行為：

- 設定預設為 `false`。
- 設定關閉時，主導覽、首頁入口、Frontier Studies 入口與其他自然流程不顯示 Frontier。
- 設定開啟後，側邊欄上區顯示「建立開拓研究」入口；側邊欄下區顯示「開拓研究庫」儲存入口，心智模型比照「創建新實驗」與「實驗資料庫」的分工。
- 「建立開拓研究」不應直接等於收藏品模型頁；未來應先進入搜尋採集物品的建立流程，再依物品尋找目前支援的開拓模型。
- 目前模型選擇預期只有 `黃金遺產收藏品模型`：選中收藏品時顯示找到此模型；選中一般採集品或其他未支援物品時顯示沒有找到相符模型。
- 若使用者直接開 `/#/frontier/collectable`，頁面應顯示簡短的啟用提示與前往設定的操作，不要完全空白或 redirect 到首頁。
- 設定開啟後，才顯示 Frontier 入口。

此設定是使用者可見偏好，不應靠 build-time flag 完成。若需要開發期保護，可額外加 build-time guard，但不能取代設定頁開關。

## Model version 與 schema

Frontier 應新增獨立 model version catalog，不要讓 Frontier 直接塞進目前四個正式 scenario：

目前正式 scenario 是：

- `tome.regular`
- `tome.collectable`
- `experiment.regular`
- `experiment.collectable`

Frontier 建議新增：

- `frontier.collectable`
- `frontierCollectableSchema`
- `frontierCollectableSimulator`
- `frontierCollectableAnalyzer`
- `frontierCollectableProbabilityProfile`

實作方式可選：

1. 擴充 `src/config/modelVersions.ts`，讓 `TomeModelScenario` 包含 `frontier.collectable`，但 Frontier keys 與正式 keys 清楚分離。
2. 另建 `src/frontier/frontierModelVersions.ts`，由 Frontier export/storage 使用。

若採第 1 種，要同步檢查 stale-card 比較邏輯，避免正式 Tome Library / Experiment Database 因 Frontier 版本變動被誤判 stale。若採第 2 種，JSON export 仍應包含 app version、Frontier schema 與 Frontier model versions。

## Frontier 專用資料模型

建議最小 state：

```ts
interface FrontierCollectableState {
  gp: number;
  integrity: number;
  collectability: number;
  scrutinyActive: boolean;
  collectorsFocusActive: boolean;
  primingTouchActive: boolean;
  standardMode: 'none' | 'standard' | 'highStandard';
  hasUsedCollectableAction: boolean;
  hasCollected: boolean;
  successBonus: number;
  nextCollectSuccessBonus: number;
  wiseToTheWorldActive: boolean;
}
```

建議 action：

- `collect`
- `scour`
- `brazen`
- `meticulous`
- `scrutiny`
- `collectorsFocus`
- `primingTouch`
- `successI`
- `successII`
- `successIII`
- `nextCollectSuccess`
- `restoreIntegrity`
- `wiseToTheWorld`

`revisitCheck` 第一階段不做。Frontier 第一版比照現有實驗台，只分析單點採集範圍，不展開 `Revisit` 的第二輪採集。

## 機率 Profile 設計

Frontier 第一版的核心輸入是 `probabilityProfile`。建議形狀：

```ts
interface FrontierCollectableProbabilityProfile {
  brazenBuckets: FrontierBrazenBucket[];
  standardProcRatePercent: number;
  highStandardProcRatePercent: number | null;
  notes?: string;
}

interface FrontierBrazenBucket {
  id: string;
  multiplierPercent: number;
  probabilityPercent: number;
}
```

`brazenBuckets` 使用離散 bucket：

- multiplier 代表 Scour 基準的百分比，例如 `50` 到 `150`。
- probability 全部加總必須等於 `100%`。UI 可提供 normalize 或補差值輔助，但不要偷偷改使用者資料而不顯示。
- 第一版可提供快速模板：`50-150 每 10% 等機率`、`50/75/100/125/150 等機率`、`空白自填`。模板必須標示為便利起點，不是官方模型。

High Standard 觸發率仍待確認，建議第一版 UI 先提供兩層：

- `尚未使用 High Standard 假設`：預設。
- `手動輸入 High Standard 假設`：展開後可填觸發率，或在策略狀態中手動指定目前是否為 `highStandard`。

不再需要把 High Standard 效果做成多個未確認模式。2026-05-29 使用者提供遊戲畫面已確認效果模型如下：

- 洞察與強化洞察是同一個互斥狀態槽：`none | standard | highStandard`。
- `Scour`、`Brazen`、`Meticulous` 與 `Collect` 都會消耗洞察 / 強化洞察狀態。
- `standard`：
  - `Meticulous` 收藏值提升到 `Scour` 基準。
  - `Brazen` 下限提升到 `Scour` 基準，上限仍為 `Scour * 150%`。
- `highStandard`：
  - `Meticulous` 收藏值提升到 `Scour` 基準。
  - `Meticulous` 不耗耐久率額外 +40 percentage points；此 +40 不受 `Priming Touch` 翻倍。
  - `Brazen` 固定為 `Scour * 150%`。
  - 不提高價值提升機率；`Collector's Focus` 仍只將價值提升機率乘 1.75 後 floor 並套上限。
- `Scrutiny` 的額外加成在上述 action gain 之後加算。
- `Brazen` 的倍率、`Scrutiny`、價值提升等加成計算完成後，最後再 `floor` 成收藏價值提升量。

最大值裝備實測例：

```txt
Scour = 200
ScrutinyBonus = 250
Meticulous base = 150
Meticulous + standard = 200
Meticulous + highStandard = 200
Meticulous no-integrity + highStandard = 65%
Meticulous no-integrity + Priming Touch + highStandard = 90%
Brazen + standard = 200 ~ 300
Brazen + highStandard = 300
Brazen + Scrutiny + highStandard = 550
value increase rate = 40%
value increase rate + Collector's Focus = 70%
```

## Brazen bucket UI 要求

使用者已決策採用離散 bucket，但 UI 必須友善，包含手機版。

建議互動：

- 預設顯示一張「大膽提煉分布」設定卡。
- 卡片摘要只顯示 bucket 數、總機率、平均倍率、是否有效。
- 詳細 bucket 編輯放在可展開區或 dialog，不要把所有 row 永遠攤在主畫面。
- 桌面版可用 compact table。
- 手機版使用 stacked row，每列包含倍率 input、機率 input、刪除 icon button。
- 每列高度穩定，避免 input error 導致 layout 跳動。
- 提供「新增 bucket」、「套用模板」、「正規化機率」、「清空」等明確操作。
- 若總機率不是 100%，主按鈕 disabled 並用短訊息提示差多少。
- 顯示平均倍率與 bucket 數即可，不要在主畫面塞滿 debug 說明。

手機版最低要求：

- 不橫向 overflow。
- 數字 input 寬度能容納 `150.00` 與 `100.00`。
- 刪除按鈕使用 icon，需有 aria-label。
- 長文案不要擠在 bucket row 裡，移到卡片說明或 tooltip。

## 精確分布 engine

Frontier 不做 solver，只展開使用者策略。第一版為單點採集，不納入 `Revisit`。建議使用 state aggregation / DAG：

- key 只包含會影響後續決策與結果的 state 欄位。
- key 不包含 path、depth 或純 UI label。
- 若策略有 pending action chain，pending actions 必須納入 decision key。
- 每個 decision state 保存抵達機率，用 aggregate map 合併。
- 不可用低機率剪枝默默丟尾端。
- 需要 max state / max transition guard，觸發時回報受控 limited result。

精確分布輸出至少包含：

- `expectedScore`
- `minScore`
- `maxScore`
- `minScoreChance`
- `maxScoreChance`
- `expectedTierCounts`
- `outcomeDistribution`
- `collectabilityDistribution`
- `terminalStateSummary`
- `limited`
- `stateCount`
- `transitionCount`
- `assumptionsUsed`

若 outcome distribution 因 score 加 tier counts 過胖，第一版可只對一般 UI 顯示 score distribution 與 tier count expectation，完整細節放 JSON export。

## 策略 UI 與策略模型

第一版可沿用現有收藏品策略台的心智模型：使用者用 rules 管理未覆蓋狀態。Frontier 對外 schema 應使用自己的 rule 型別，但欄位與行為要盡量貼近現有實驗台，方便玩家遷移，也方便未來維護 parity。

建議 rule fields：

- `gp`
- `integrity`
- `collectability`
- `scrutinyActive`
- `collectorsFocusActive`
- `primingTouchActive`
- `standardMode`
- `wiseToTheWorldActive`
- `successBonus`
- `nextCollectSuccessBonus`
- `hasUsedCollectableAction`
- `hasCollected`

建議第一版 action chain：

- 每條 rule 可包含多個 action。
- 若 action 因 GP、等級、收藏價值 cap 或狀態限制不能施放，engine 應跳到下一個可施放 action，或把該 state 標成 uncovered。這個行為必須在 UI 與測試中固定，不要隨手改。
- 若沒有 rule match 或沒有可施放 action，state 進入 `uncovered`，不要硬猜 fallback。

## 使用現有物品資料的方式

Frontier 可以使用現有：

- `searchGatherables` / item search
- `getGatherableItemById`
- `getItemBaseIntegrity`
- base values hydration
- food / gear profile UI
- `getCollectableRewardTable`

但 Frontier engine request 應自己組裝，例如：

```ts
interface FrontierCollectableSimulationRequest {
  itemId: number;
  stats: PlayerStats;
  baseValues: { Gathering: number; Perception: number };
  itemLevel: number;
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  jobType: 'miner' | 'botanist';
  isTimedNode: boolean;
  rewardTable: FrontierCollectableRewardTableSnapshot;
  probabilityProfile: FrontierCollectableProbabilityProfile;
  strategy: FrontierCollectableStrategy;
}
```

`FrontierCollectableRewardTableSnapshot` 可從現有 reward table 投影，但不要直接把正式 `CollectableRewardTable` 當成 Frontier engine 的核心型別。

## 儲存與 JSON 匯出

Frontier Studies 是獨立於 Experiment Database 的儲存區。localStorage 建議另用：

```txt
frozen-rabbit-tome-frontier-studies
```

保存內容是研究案例：

- `schemaVersion`
- `kind: 'frontier.collectable'`
- `itemId`
- player / food / node input
- `probabilityProfile`
- `strategy`
- `lastAnalysisSnapshot`
- `createdAt`
- `updatedAt`

完整 JSON export 必須包含：

- manifest：`scenario: 'frontier.collectable'`
- Frontier model versions
- subject item metadata
- runtime snapshot：base values、reward table、itemLevel、isTimedNode
- user input：stats、food、node bonuses、temporaryGp
- `probabilityProfile`
- strategy rules
- analyzer output
- limitations
- notes

manifest limitations 建議至少包含：

- `frontier-user-supplied-probabilities`
- `brazen-distribution-user-supplied`
- `high-standard-proc-rate-user-supplied`
- `not-a-solver`

匯入 / 儲存體驗應比照現有實驗台：JSON 匯入後可重建 Frontier study 草稿或保存到 Frontier Studies，不應投影成 Experiment Database 卡片。

## 設定與 i18n

新增文案需維持 `tw`、`cn`、`ja`、`en` 四語系。不要只補繁中。

建議設定文案方向：

- 標題：`Frontier 研究模式`
- 說明：`啟用後顯示研究用入口。此模式會使用你提供的機率假設分析策略，不代表正式模型。`

入口文案方向：

- `Frontier`
- `收藏品研究`
- `用自訂機率假設分析收藏品策略`

## 測試計畫

第一階段至少需要：

- Probability profile validation
  - bucket 機率總和為 100 才有效。
  - multiplier / probability clamp 與錯誤訊息。
  - 空 bucket、負值、超過 100、浮點加總誤差。
- Formula tests
  - 已複製進 Frontier 的 Scour / Scrutiny / Meticulous 基準公式。
  - Brazen bucket gain 的取整順序。
  - 一般洞察與強化洞察對 `Meticulous` / `Brazen` 的差異。
  - `Priming Touch + High Standard` 不耗耐久率為基礎率翻倍後再加 40 percentage points。
  - `Collector's Focus` 不改 action gain，只改價值提升機率。
- Simulator invariant tests
  - outcome probability 約等於 100%。
  - `min <= expected <= max`。
  - GP / integrity 不超界。
  - collectability clamp 在 0 到 1000。
  - 無 rule match 會 uncovered，不會猜 action。
- Exact distribution tests
  - 兩條不同路徑抵達相同 state 時會合併機率。
  - Brazen bucket 分布會正確展開。
  - Meticulous / Standard / High Standard 分支會正確乘機率，且 `standardMode` 不會出現一般洞察與強化洞察共存狀態。
- UI tests 或 focused component tests
  - 設定關閉時入口隱藏。
  - 直接進 route 會顯示啟用提示。
  - 手機寬度下 Brazen bucket editor 不 overflow。

不要把高壓大型分布案例放進預設 unit suite。若需要保留，新增 Frontier bench / diagnostic script。

## 分階段建議

### Phase 0：文件與開關骨架

- 新增設定頁開關，預設關閉。
- 新增 Frontier collectable route、Frontier Studies route 與隱藏入口。
- 側邊欄上區新增 Frontier 收藏品研究入口；側邊欄下區新增 Frontier Studies 儲存入口，兩者都受設定開關控制。
- 新增空 Frontier 頁、Frontier Studies 空頁與啟用提示。
- 補 i18n。

### Phase 1：Frontier domain skeleton

- 建立 Frontier 專用 types、model versions、probability profile validation。
- 建立 Brazen bucket editor。
- 建立最小 JSON export / import shape。
- 建立 Frontier Studies storage skeleton，行為比照現有實驗台的保存與再次開啟。
- 對既有收藏品單點採集邏輯建立 parity 測試，確認 `Brazen` / `High Standard` 以外的行為不漂移。

### Phase 2：精確分布模擬

- 實作 Frontier action transition，沿用既有收藏品邏輯並新增 `Brazen` / `High Standard` 差異層。
- 實作 rule-based strategy expansion。
- 實作 state aggregation 與 limited guard。
- 實作 analyzer summary。

### Phase 3：研究體驗

- 補策略編輯器、未覆蓋狀態提示、結果圖表。
- 補 localStorage research studies。
- 補匯出 / 匯入、保存、再次開啟與刪除 / 管理流程，比照現有實驗台。

### Phase 4：High Standard 觸發率實證後接入

- 根據實證結果固定 High Standard 觸發率；High Standard 效果模型已先依 2026-05-29 遊戲畫面收斂。
- 補測試與 Frontier model version bump。
- 更新本文件與 `.agents/skills/business/gathering_math_formulas.md`，但仍不要自動把 High Standard 接入正式秘笈，除非使用者另行決策。

## 待使用者決策或實證

以下項目不得由 Agent 自行猜測成正式規則：

- `Collector's High Standard` 觸發率。
- Brazen bucket 的官方或實測分布。

已確認並應納入第一版：

- Brazen 取整順序為最後再 `floor`。
- `Collect / 收藏品採集` 會消耗洞察 / 強化洞察狀態。
- 第一版不納入 `Revisit`，只做單點採集分析。
- Frontier study 使用獨立 Frontier Studies，不進 Experiment Database。
- UI 完整度比照現有實驗台處理。

在 `Brazen` 分布與 `High Standard` 觸發率確認前，Frontier 只能呈現為「使用者提供假設後的分析」。若實作過程發現其他缺乏資料的收藏品機制，必須先詢問使用者，不可自行填補。

## Commit 前注意

若只新增文件，不需 bump `src/config/modelVersions.ts`。

若新增 Frontier engine、分析模型、JSON schema 或 storage schema，需要新增或更新 Frontier 專用版本。若改到正式 solver / simulator / analyzer / collectable math / action model，才需要依 `AGENTS.md` 同步 bump 現有 scenario-aware model versions。
