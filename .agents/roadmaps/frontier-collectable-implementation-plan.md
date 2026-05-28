# Frontier 收藏品研究模式實作計畫

本文件是後續 Agent 實作 Frontier 第一階段時的交接入口。Frontier 的目標是提供 theory crafter 一個更貼近遊戲內容、但仍明確隔離於正式秘笈與實驗模型之外的研究場地。

執行前仍需先依 `AGENTS.md` 讀取核心脈絡；若開始實作 UI，另讀 `.agents/skills/professional/ui_ux_standards.md`；若碰到採集公式、收藏品技能、分析輸出或 JSON 匯出，另讀 `.agents/skills/business/gathering_math_formulas.md`、`.agents/skills/business/ffxiv_gathering_skills.md` 與 `.agents/skills/business/algorithm_verification.md`。

## 目前已決策

- Frontier 會是新的入口，不是秘笈或現有實驗頁的一個模式。
- Frontier 入口必須由設定頁的新設定開關控制，預設關閉；一般使用者預設看不到。
- 第一階段只做收藏品。
- 第一階段是使用者輸入策略後模擬與分析，不做求解器，不自動產生推薦策略。
- Frontier 模型必須自成一套，不串接現有任何正式模型層，避免後續維護管理困難。
- 可以使用現有物品、物品搜尋、runtime game data、reward table hydration 與 gear / food 輸入流程；這些是資料來源與 UI 基礎，不是模型串接。
- `Brazen / 大膽提煉` 的未知機率資料採用使用者輸入的離散 bucket 形式，不用單一 uniform 假設。
- `Collector's High Standard / 強化洞察` 的公式與觸發資料尚待核對或遊戲實證；第一版應先預留研究假設輸入與 model slot，不可把未知內容寫成正式規則。
- 分析引擎採精確分布，不採 Monte Carlo 作為第一階段主路徑。

## 產品定位

Frontier 是研究沙盒。它可以幫玩家測試「如果這組機率與疊加規則為真，這套策略的分布會如何」，但不能對外宣稱結果等同正式遊戲模型。

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

Frontier 第一階段不得 import 或呼叫下列正式模型層作為引擎：

- `src/utils/collectableMechanics.ts`
- `src/utils/collectableMath.ts`
- `src/utils/collectableStrategyTree.ts`
- `src/utils/collectableStrategyAnalysis.ts`
- `src/utils/collectableSolver.ts`
- `src/utils/collectableWasmSolver.ts`
- `assembly/collectableSolverCore.ts`
- `src/types/collectable.ts` 中的正式 request / result 型別作為 Frontier engine schema

可以參考其概念、測試案例與 UI 經驗，但 Frontier engine 需要自己的 type、formula helper、action transition 與 analyzer。若複製已確認公式，請在 Frontier 檔案註明來源與 Frontier model version，並用 Frontier 專用測試守住行為。

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
src/components/frontier/FrontierProbabilityProfileEditor.vue
src/components/frontier/FrontierBrazenBucketEditor.vue
src/components/frontier/FrontierStrategyEditor.vue
src/components/frontier/FrontierAnalysisPanel.vue
```

若專案慣例後續偏好不在 `src/frontier` 建 domain，也可放在 `src/utils/frontierCollectable*.ts`，但必須維持命名隔離，不要混入正式 collectable 檔案。

## 路由與入口

建議新增：

- route：`/#/frontier/collectable`
- route name：`FrontierCollectable`
- 設定 key：例如 `settings.frontier.enabled` 或 `experimentalFeatures.frontierCollectable`

入口行為：

- 設定預設為 `false`。
- 設定關閉時，主導覽、首頁入口與其他自然流程不顯示 Frontier。
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
  standardActive: boolean;
  highStandardActive: boolean;
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

`revisitCheck` 第一階段建議先不做，除非使用者明確要求。原因是 Frontier 主要要處理 Brazen / High Standard 的研究假設；Revisit 會顯著增加分支與 UI 解釋成本。

## 機率 Profile 設計

Frontier 第一版的核心輸入是 `probabilityProfile`。建議形狀：

```ts
interface FrontierCollectableProbabilityProfile {
  brazenBuckets: FrontierBrazenBucket[];
  standardProcRatePercent: number;
  highStandardProcRatePercent: number | null;
  highStandardMode: FrontierHighStandardMode;
  meticulousSaveRateBonusPercent?: number;
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

High Standard 因公式待確認，建議第一版 UI 先提供兩層：

- `尚未使用 High Standard 假設`：預設。
- `手動輸入 High Standard 假設`：展開後可填觸發率與效果模式。

`FrontierHighStandardMode` 建議先設計但可先不全部啟用：

```ts
type FrontierHighStandardMode =
  | 'disabled'
  | 'manualMeticulousSaveBonus'
  | 'manualMeticulousSaveOverride'
  | 'manualBrazenMultiplierOverride';
```

若 High Standard 實證尚未完成，實作時可以只啟用 `disabled` 與 `manualMeticulousSaveBonus`，其餘作為型別保留或 TODO，但不要在 UI 顯示不可用選項造成雜音。

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

Frontier 不做 solver，只展開使用者策略。建議使用 state aggregation / DAG：

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

第一版可沿用現有收藏品策略台的心智模型：使用者用 rules 管理未覆蓋狀態。但不要共用正式 `CollectableStrategyRule` 型別。

建議 rule fields：

- `gp`
- `integrity`
- `collectability`
- `scrutinyActive`
- `collectorsFocusActive`
- `primingTouchActive`
- `standardActive`
- `highStandardActive`
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

Frontier localStorage 建議另用：

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
- `high-standard-model-pending-verification`
- `not-a-solver`

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
  - High Standard disabled 時不影響結果。
- Simulator invariant tests
  - outcome probability 約等於 100%。
  - `min <= expected <= max`。
  - GP / integrity 不超界。
  - collectability clamp 在 0 到 1000。
  - 無 rule match 會 uncovered，不會猜 action。
- Exact distribution tests
  - 兩條不同路徑抵達相同 state 時會合併機率。
  - Brazen bucket 分布會正確展開。
  - Meticulous / Standard / High Standard 分支會正確乘機率。
- UI tests 或 focused component tests
  - 設定關閉時入口隱藏。
  - 直接進 route 會顯示啟用提示。
  - 手機寬度下 Brazen bucket editor 不 overflow。

不要把高壓大型分布案例放進預設 unit suite。若需要保留，新增 Frontier bench / diagnostic script。

## 分階段建議

### Phase 0：文件與開關骨架

- 新增設定頁開關，預設關閉。
- 新增 route 與隱藏入口。
- 新增空 Frontier 頁與啟用提示。
- 補 i18n。

### Phase 1：Frontier domain skeleton

- 建立 Frontier 專用 types、model versions、probability profile validation。
- 建立 Brazen bucket editor。
- 建立最小 JSON export shape。

### Phase 2：精確分布模擬

- 實作 Frontier action transition。
- 實作 rule-based strategy expansion。
- 實作 state aggregation 與 limited guard。
- 實作 analyzer summary。

### Phase 3：研究體驗

- 補策略編輯器、未覆蓋狀態提示、結果圖表。
- 補 localStorage research studies。
- 補匯出 / 匯入或至少匯出。

### Phase 4：High Standard 實證後接入

- 根據實證結果固定 High Standard model。
- 補測試與 Frontier model version bump。
- 更新本文件與 `.agents/skills/business/gathering_math_formulas.md`，但仍不要自動把 High Standard 接入正式秘笈，除非使用者另行決策。

## 待使用者決策或實證

以下項目不得由 Agent 自行猜測成正式規則：

- `Collector's High Standard` 觸發率。
- `Collector's High Standard` 與 `Priming Touch`、節點特殊效果、`Meticulous` 不耗耐久率的疊加順序。
- `Collector's High Standard` 是否影響 Brazen、如何影響 Brazen。
- Brazen bucket 的官方或實測分布。
- Frontier 第一版是否要納入 Revisit。
- Frontier study 是否要進 Experiment Database，或長期維持獨立 Frontier Studies。

在這些資料確認前，Frontier 只能呈現為「使用者提供假設後的分析」。

## Commit 前注意

若只新增文件，不需 bump `src/config/modelVersions.ts`。

若新增 Frontier engine、分析模型、JSON schema 或 storage schema，需要新增或更新 Frontier 專用版本。若改到正式 solver / simulator / analyzer / collectable math / action model，才需要依 `AGENTS.md` 同步 bump 現有 scenario-aware model versions。
