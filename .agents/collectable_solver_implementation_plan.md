# 收藏品採集求解台實作計畫書

本文件是收藏品採集求解台的接手用實作計畫。目標是讓後續 Agent 即使在中斷後，也能依照目前決策、既有程式架構與 `.agents` skill 文件，分階段完成此 feature。

最後更新：2026-05-11

## 0. 必讀文件

開始實作前，請先以 UTF-8 讀取：

1. `.agents/skills/README.md`
2. `.agents/skills/core/language_policy.md`
3. `.agents/skills/core/global_standards.md`
4. `.agents/skills/mission/project_mission.md`
5. `.agents/skills/mission/product_architecture.md`
6. `.agents/skills/business/gathering_math_formulas.md`
7. `.agents/skills/business/collectable_solver_v1_implementation.md`
8. `.agents/skills/business/collectable_solver_design.md`
9. `.agents/skills/professional/development_standards.md`
10. `.agents/skills/professional/ui_ux_standards.md`

本功能涉及 UI、演算法、資料載入與儲存秘笈，所以上述文件都屬於必讀。

## 1. 使用者已確認決策

以下決策優先級高，後續實作不要再反覆詢問，除非新資料明確推翻。

1. 第一版排除 `Brazen / 大膽提煉` 與 `Collector's High Standard / 強化洞察`。
   - 原因是資料缺失或觸發機率未知。
   - 這些項目可以在 debug 視窗標示「未納入第一版推薦模型」。
   - 不要為它們建立暫定期望模型。

2. `Priming Touch / 預備碰觸` 若下一次使用的是 `Scour / 提煉`，預備碰觸效果不會消失。
   - 效果會保留，直到玩家使用 `Meticulous / 慎重提煉` 才消失。
   - Solver state 中 `primingTouchActive` 只應在 `Meticulous` 後清除。
   - 使用 `Scour` 後不可清除 `primingTouchActive`。

3. 幾個狀態名稱多語系翻譯先使用保守譯名。
   - 英文必須使用 `Collector's Standard`。
   - 繁中可使用 `洞察`。
   - `Collector's Intuition` 應表達成「價值提升效果 / 價值提升機率」，不要把它翻成洞察。
   - 日文與簡中若缺官方確認，使用保守 fallback，不宣稱官方譯名。

4. 薩雷安、珠串、老主顧 reward table 的 runtime fetch 最小檔案集合由實作者自行處理。
   - 原則：先剪枝成收藏品求解器需要的資料，再放進 RAM cache。
   - 不要為個人規模工具過度設計多來源驗證與備援。

5. 公式與遊戲現象以使用者實測與專案 skill 為準。
   - 不要因為外部 Wiki 或泛稱描述與實測不同，就改回簡單假設。
   - 特別是收藏品公式：`Scour`、價值提升率、慎重不耗耐久率使用獲得力；`Scrutiny` 使用鑑別力。

6. 當使用者裝備數值導致收藏品採集成功率不足 100% 時，一般採集系統的提高獲得率技能可以納入收藏品 solver。
   - 包含 `Sharp Vision / 敏銳視野` 系列、`Field Mastery / 環境探知` 系列。
   - 包含 `Clear Vision / 明晰視野`、`Flora Mastery / 植被專精`。
   - 這些技能影響 `Collect / 收藏品採集` 的成功率期望。
   - 第一版若時間不足，可先實作收藏品核心技能，再把成功率補強技能作為同一 PR 的後續 commit；但正式完成前必須納入。

## 2. 產品邊界

收藏品求解台屬於「秘笈」系統，用於產生推薦策略。使用者可見文案不可宣稱「最佳」、「最優」、「唯一正解」。

建議用語：

- 推薦策略
- 推薦手法
- 依目前模型推算
- 期望收益較高

避免用語：

- 最佳手法
- 最優解
- 唯一正解
- 完美 rotation

收藏品結果不是線性 rotation，不能做巨集輸出。UI 應呈現 policy tree 或判斷表。

## 3. 目前程式狀態

相關檔案：

- `src/views/Solver.vue`
  - 目前 `activeItem.isCollectable` 會顯示 `PendingFeature`。
  - 一般採集求解台 UI、數值輸入、食物、節點獎勵、debug 按鈕與儲存秘笈都在這裡。

- `src/composables/useSolver.ts`
  - 管理 `activeItem`、玩家數值、食物、節點獎勵、一般求解 worker。
  - 目前只處理一般採集 `SolverResponse`。

- `src/utils/gatheringMath.ts`
  - 已有一般採集成功率、boon、高產/豐收公式。
  - 尚未有收藏品公式。

- `src/utils/rotationSolver.ts`
  - 一般採集 DP + memo solver。
  - 輸出線性 `rotation`。
  - 不要把收藏品邏輯塞進這個檔案。

- `src/workers/solver.worker.ts`
  - 一般採集 solver worker。
  - 收藏品應新增獨立 worker。

- `src/services/gameData.ts`
  - 搜尋採集物，並用 XIVAPI `Item?ids=...&columns=ID,IsCollectable` 標記收藏品。
  - `SOLVER_ACTION_IDS` 目前只包含一般採集技能；收藏品與成功率補強技能 icon/name 可能需要擴充。

- `src/services/actionIcons.ts`
  - 一般採集 rotation action id mapping。
  - 收藏品應新增獨立 mapping，或抽成通用 action metadata。

- `src/composables/useTomeLibrary.ts`
  - 目前只儲存一般採集 rotation。
  - 收藏品需要新增 `kind: 'collectable'` 的儲存資料。

- `src/views/TomeLibrary.vue`
  - 目前藏書庫顯示一般採集 rotation preview 與巨集按鈕。
  - 收藏品卡片不得顯示巨集按鈕。

- `src/components/SolverDebugDialog.vue`
  - 一般採集 debug dialog。
  - 收藏品可用相同視覺語彙，但建議新增 `CollectableDebugDialog.vue`。

## 4. 第一版功能範圍

### 4.1 必須完成

第一版應支援：

- 純收藏品繳納 reward table。
- 使用者在「創建秘笈」搜尋收藏品後，點擊進入收藏品求解台。
- 使用者可輸入：
  - 等級
  - 獲得力
  - 鑑別力
  - 演算開始 GP
  - 裝備最大 GP
  - 食物
  - 採集點耐久度提升獎勵
- 系統可以求解並輸出推薦 policy tree。
- 主畫面呈現易懂判斷表。
- 詳細區可展開完整決策樹。
- 支援儲存秘笈。
- 秘笈藏書庫可顯示收藏品秘笈，並可載回求解台。
- 收藏品秘笈沒有巨集功能。
- Debug 視窗可供數學驗證。
- 所有 UI 支援明亮 / 黑暗模式。
- 所有使用者可見文字支援 `tw/en/ja/cn`。
- 手機版不能水平 overflow，策略樹在手機版使用垂直展開。
- 一般採集功能不得回歸。

### 4.2 第一版納入技能

收藏品核心技能：

- `Collect / 收藏品採集`
- `Scour / 提煉`
- `Meticulous / 慎重提煉`
- `Scrutiny / 集中檢查`
- `Collector's Focus / 價值矚目`
- `Priming Touch / 預備碰觸`
- `Collector's Intuition / 價值提升效果`
- `Collector's Standard / 洞察 Buff`

成功率補強技能：

- 採掘師：
  - `Sharp Vision / 敏銳視野`
  - `Sharp Vision II / 敏銳視野II`
  - `Sharp Vision III / 敏銳視野III`
  - `Clear Vision / 明晰視野`
- 園藝師：
  - `Field Mastery / 環境探知`
  - `Field Mastery II / 環境探知II`
  - `Field Mastery III / 環境探知III`
  - `Flora Mastery / 植被專精`

成功率補強技能的建模建議：

- 全節點成功率 buff 只能在第一次 `Collect` 前施放。
- `Clear Vision / Flora Mastery` 是下一次採集成功率提高 15%，只影響下一次 `Collect`。
- 這些技能不影響 `Scour` / `Meticulous` 的收藏價值提升量。
- 若基礎成功率已達 100%，通常不應施放成功率補強技能。
- 若成功率低於 100%，solver 應比較「花 GP 提高成功率」與「保留 GP 給收藏品 buff」的期望收益。

### 4.3 第一版排除

- `Brazen / 大膽提煉`
- `Collector's High Standard / 強化洞察`
- 精選 reward model
- 水晶採集
- 使用者手動自訂技能序列的收藏品實驗系統
- 老主顧、薩雷安、珠串可作 Phase 2，不要求第一版完成

## 5. 建議新增與修改檔案

### 5.1 新增型別

新增：`src/types/collectable.ts`

建議包含：

```ts
export type CollectableObjectiveKind = 'scrip' | 'exp' | 'gil' | 'custom';

export interface CollectableObjective {
  kind: CollectableObjectiveKind;
  weights?: CollectableRewardWeights;
}

export interface CollectableRewardVector {
  exp: number;
  gil: number;
  scrip: number;
  items: Record<number, number>;
}

export interface CollectableRewardTier {
  collectability: number;
  reward: CollectableRewardVector;
}

export interface CollectableRewardTable {
  itemId: number;
  source: 'collectables';
  rewardItemId?: number;
  tiers: {
    low: CollectableRewardTier;
    mid: CollectableRewardTier;
    high?: CollectableRewardTier;
  };
}

export interface CollectableSolverRequest {
  stats: PlayerStats;
  baseValues: {
    Gathering: number;
    Perception: number;
  };
  itemLevel: number;
  jobType: 'miner' | 'botanist';
  nodeBonuses: NodeBonuses;
  temporaryGp: number;
  rewardTable: CollectableRewardTable;
  objective: CollectableObjective;
  isTimedNode?: boolean;
  debugMode?: boolean;
}

export interface CollectableSearchState {
  gp: number;
  integrity: number;
  collectability: number;
  scrutinyActive: boolean;
  collectorsFocusActive: boolean;
  primingTouchActive: boolean;
  standardActive: boolean;
  hasUsedCollectableAction: boolean;
  hasCollected: boolean;
  successBonus: number;
  successIActive: boolean;
  successIIActive: boolean;
  successIIIActive: boolean;
  nextCollectSuccessBonus: number;
}

export interface CollectablePolicyNode {
  id: string;
  state: CollectableStateSummary;
  recommendedAction: CollectableActionSummary;
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  branches: CollectablePolicyBranch[];
}

export interface CollectablePolicyBranch {
  label: string;
  condition: string;
  probability: number;
  outcome: CollectableOutcomeSummary;
  next?: CollectablePolicyNode;
}

export interface CollectableSolverResult {
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  policy: CollectablePolicyNode;
  calculationTime: number;
  debug?: CollectableSolverDebugInfo;
}
```

實際欄位可依實作微調，但要保留「policy tree」與「reward vector」概念。

### 5.2 新增公式

新增：`src/utils/collectableMath.ts`

函式建議：

- `calculateCollectableScourValue(gathering, baseGathering)`
- `calculateValueIncreaseRate(gathering, baseGathering)`
- `calculateFocusedValueIncreaseRate(baseRate)`
- `calculateMeticulousProcRate(gathering, baseGathering)`
- `calculatePrimedMeticulousProcRate(baseRate)`
- `calculateScrutinyMultiplier(perception, basePerception)`
- `calculateScrutinyBonus(scourValue, scrutinyMultiplier)`
- `calculateStandardProcRate(context)`
- `applyCollectabilityCap(value)`

必須遵守 `.agents/skills/business/collectable_solver_v1_implementation.md` 公式。

### 5.3 新增 reward service

新增：`src/services/collectableRewards.ts`

第一版只支援 Teamcraft `collectables.json`：

```txt
https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/{branch}/libs/data/src/lib/json/collectables.json
```

需求：

- runtime fetch。
- module-level cache。
- fetch 後剪枝，不長期保存肥大的原始 JSON。
- 提供 `getCollectableRewardTable(itemId)`。
- 提供 `isCollectableRewardSupported(itemId)`。
- 失敗時回傳可辨識 error，UI 顯示「找不到此物品的收藏品獎勵表，暫無法求解」。

第一版 reward tier：

```ts
function rewardTier(value, thresholds) {
  if (thresholds.high > 0 && value >= thresholds.high) return 'high';
  if (value >= thresholds.mid) return 'mid';
  if (value >= thresholds.low) return 'low';
  return 'none';
}
```

### 5.4 新增收藏品 solver

新增：`src/utils/collectableSolver.ts`

核心策略：

- DP + memo。
- state key 至少包含：
  - `gp`
  - `integrity`
  - `collectability`
  - `scrutinyActive`
  - `collectorsFocusActive`
  - `primingTouchActive`
  - `standardActive`
  - `hasUsedCollectableAction`
  - `successBonus`
  - `successIActive`
  - `successIIActive`
  - `successIIIActive`
  - `nextCollectSuccessBonus`

終止條件：

- `integrity <= 0`：立即終止，不能再 collect，也不能補任何技能。
- `collectability` 上限 1000。

Action 建議：

- `Collect`
- `Scour`
- `Meticulous`
- `Scrutiny`
- `Collector's Focus`
- `Priming Touch`
- `Sharp Vision / Field Mastery`
- `Sharp Vision II / Field Mastery II`
- `Sharp Vision III / Field Mastery III`
- `Clear Vision / Flora Mastery`

重要建模：

- `Collect`：
  - 消耗 1 耐久。
  - 收藏價值不重置。
  - reward 乘上採集成功率。
  - 採集失敗時仍消耗耐久，但沒有 reward。
  - 使用後清除 `nextCollectSuccessBonus`。

- `Scour`：
  - 消耗 1 耐久。
  - 消耗 `scrutinyActive`。
  - 消耗 `collectorsFocusActive`。
  - 不消耗 `primingTouchActive`。
  - 需產生價值提升 proc / 未 proc 分支。
  - action 結束後若符合條件，另產生 `Collector's Standard` proc / 未 proc 分支。

- `Meticulous`：
  - 有價值提升 proc / 未 proc分支。
  - 有不耗耐久 proc / 未 proc分支。
  - 若 `standardActive`，提升量使用 Standard 版本。
  - 消耗 `standardActive`。
  - 消耗 `scrutinyActive`。
  - 消耗 `collectorsFocusActive`。
  - 消耗 `primingTouchActive`。
  - action 結束後若符合條件，另產生新的 `Collector's Standard` proc / 未 proc 分支。

- `Scrutiny`：
  - GP 200。
  - 下一次 `Scour` 或 `Meticulous` 消耗。
  - 不應重複施放。

- `Collector's Focus`：
  - GP 100。
  - 下一次 `Scour` 或 `Meticulous` 消耗。
  - 不被其他 buff 消耗。

- `Priming Touch`：
  - GP 100。
  - 下一次 `Meticulous` 消耗。
  - 不被 `Scour` 消耗。
  - 不被其他 buff 消耗。

- 全節點成功率 buff：
  - GP 成本依一般採集技能。
  - 只在第一次 `Collect` 前施放。
  - 同一階技能不可重複施放。
  - I / II / III 可累加。

- 下一次成功率 buff：
  - GP 50。
  - 只影響下一次 `Collect`。
  - 若已有 `nextCollectSuccessBonus`，不可重複施放。

Tie breaker 建議：

1. objective score 高者優先。
2. 同分時，期望 reward 較高者優先。
3. 同分時，GP 消耗較少者優先。
4. 同分時，操作步數較少者優先。
5. 同分時，policy tree 節點較少者優先。
6. 同分時，較早 collect 達標者優先。

### 5.5 新增 worker

新增：`src/workers/collectableSolver.worker.ts`

類似 `src/workers/solver.worker.ts`，但型別使用 `CollectableSolverRequest` / `CollectableSolverResult`。

`calculationTime` 在 worker 中計算。

### 5.6 擴充 composable

建議有兩種做法：

1. 在 `useSolver.ts` 裡加入收藏品狀態與 `solveCollectable`。
2. 新增 `useCollectableSolver.ts`，共用 `activeItem` 與輸入狀態。

建議選擇 2，避免 `useSolver.ts` 過大。若要共用 `activeItem`，可考慮抽出 `useSolverDraft.ts` 管理：

- active item
- stats
- food
- node bonuses
- temporary GP
- base values
- item real level
- success rate
- perception check

若時間有限，不要大重構，可先在 `useSolver.ts` 加入收藏品 branch，但要保持函式小型化。

### 5.7 新增 UI 元件

建議新增：

- `src/components/CollectableSolverPanel.vue`
  - 收藏品求解台主體。
  - 接收現有輸入狀態與 active item。

- `src/components/CollectablePolicyView.vue`
  - 主畫面的判斷表與摘要。

- `src/components/CollectablePolicyTreeDialog.vue`
  - 完整 policy tree 詳情。
  - 手機版垂直展開，不做橫向樹。

- `src/components/CollectableDebugDialog.vue`
  - 公式、reward table、搜尋統計、未納入模型。

`Solver.vue` 的入口邏輯應改為：

```vue
<CollectableSolverPanel
  v-if="activeItem.isCollectable"
  ...
/>
<PendingFeature
  v-else-if="activeItem.isCrystalGathering"
  ...
/>
<RegularSolverPanel
  v-else
  ...
/>
```

若時間不足，`RegularSolverPanel` 可先不拆，但收藏品區塊不要塞進一般採集結果區。

### 5.8 擴充儲存秘笈

修改：`src/types/game.ts` 或新型別檔

建議把 `StoredTome` 改成 union：

```ts
export type StoredTome = StoredRegularTome | StoredCollectableTome;

export interface StoredRegularTome {
  kind: 'regular';
  // 現有欄位
}

export interface StoredCollectableTome {
  kind: 'collectable';
  id: string;
  itemId: number;
  stats: PlayerStats;
  temporaryGp: number;
  food: FoodSelection;
  nodeBonuses: StoredTomeNodeBonuses;
  objective: CollectableObjective;
  rewardTableSummary: CollectableRewardTableSummary;
  policy: StoredCollectablePolicy;
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  createdAt: string;
}
```

相容性要求：

- 舊 localStorage 中沒有 `kind` 的秘笈視為 `regular`。
- `TomeLibrary.vue`、`useTomeLibrary.ts` 必須用 type guard 處理。

`useTomeLibrary.ts` 新增：

- `saveRegularTome` 或保留現有 `saveTome` 給一般採集。
- `saveCollectableTome` 給收藏品。

`TomeLibrary.vue`：

- 一般採集卡片維持 rotation preview + 巨集按鈕。
- 收藏品卡片顯示：
  - 收藏品系統 badge
  - objective
  - expected reward
  - 第一個推薦 action
  - 2 到 4 條判斷 preview
  - 編輯 / 刪除
  - 不顯示巨集按鈕。

## 6. UI 設計規格

### 6.1 求解台布局

要與一般採集求解台風格一致：

- 同樣使用物品標題卡。
- 同樣使用玩家數值卡。
- 同樣使用 soft green / slate 視覺語彙。
- 明亮與黑暗模式都要有對應。
- 不要建立 landing page。

收藏品求解台可以保留一般採集的成功率卡，但文案改成：

- `收藏品採集成功率`
- `Scour 提煉基礎值`
- `價值提升機率`
- `慎重不耗耐久率`

### 6.2 主結果摘要

建議顯示：

- 推薦策略
- 期望票據 / 經驗 / 金幣
- 最低可交機率
- 高標機率
- 目前模型限制簡短提示

範例：

```txt
推薦策略
期望票據 162.4
最低可交機率 98.3%
高標機率 72.1%
```

### 6.3 判斷表

主畫面不要展示大型完整樹。用 row 顯示：

```txt
現在建議：集中檢查

接下來看狀態：
收藏價值 >= 1000：收藏品採集
洞察觸發：慎重提煉
耐久只剩 1：依目前門檻收藏
成功率不足 100% 且 GP 足夠：明晰視野 -> 收藏品採集
```

每條 row：

- 左側：條件
- 右側：推薦 action
- 小字：機率 / 期望增益 / GP 與耐久變化

技能顯示使用 icon + 名稱。

### 6.4 完整決策樹

放在 dialog 或 accordion：

- 第一層顯示推薦 action。
- 子分支顯示 outcome 與 probability。
- 每個節點可展開。
- 手機版使用垂直 list，不做橫向樹圖。

### 6.5 Debug 視窗

必須包含：

- base Gathering / Perception。
- 採集成功率 score / raw / final。
- 成功率 buff 是否納入。
- Scour value。
- Scrutiny multiplier / bonus。
- valueIncreaseRate。
- Collector's Focus 後 valueIncreaseRate。
- Meticulous proc rate。
- Priming Touch 後 meticulous proc rate。
- standardProcRate 與節點類型判定。
- Reward table 門檻與每檔獎勵。
- 搜尋狀態數、memo hits、actions evaluated、branch count。
- 未納入項目：
  - Brazen
  - Collector's High Standard
  - 精選 reward model

## 7. i18n 規格

四個 locale 檔都要更新：

- `src/i18n/locales/tw.ts`
- `src/i18n/locales/en.ts`
- `src/i18n/locales/ja.ts`
- `src/i18n/locales/cn.ts`

建議新增 namespace：

```ts
collectableSolver: {
  title: '',
  badges: {},
  stats: {},
  actions: {},
  results: {},
  policy: {},
  tree: {},
  debug: {},
  unsupported: {},
  limitations: {}
}
```

英文狀態名：

- `Collector's Standard`
- `Collector's Intuition`
- `Collector's Focus`
- `Priming Touch`

注意：

- `Collector's Intuition` 是價值提升效果，不是 `Collector's Standard`。
- UI 不要固定顯示繁中技能名；應走 action dict 或 i18n fallback。
- 若 action dict 缺狀態名稱，使用本地 i18n key。

## 8. 測試計畫

### 8.1 公式測試

新增：`src/utils/collectableMath.test.ts`

至少覆蓋：

- `Scour` score 66 / 67 / 85 / 86 / 95。
- `valueIncreaseRate` score 66 / 67 / 85 / 86 / 100。
- `Collector's Focus` 最大值 case：40 -> 70。
- `meticulousRate` 最大值 case：25。
- `Priming Touch` 最大值 case：25 -> 50。
- `Scrutiny` 最大值 case multiplier：125。
- 最大值行為：
  - 無 buff + `Scour`：200 / 300。
  - 無 buff + `Meticulous`：150 / 250。
  - `Standard` + `Meticulous`：200 / 300。
  - `Scrutiny` + `Scour`：450 / 550。
  - `Scrutiny` + `Meticulous`：400 / 500。
  - `Scrutiny` + `Standard` + `Meticulous`：450 / 550。

### 8.2 Solver 測試

新增：`src/utils/collectableSolver.test.ts`

至少覆蓋：

- 沒有 GP 時仍可用 0 GP 提煉策略。
- GP 足夠時會考慮 `Scrutiny` / `Collector's Focus` / `Priming Touch`。
- `Priming Touch` 不會被 `Scour` 消耗。
- `Priming Touch` 會被 `Meticulous` 消耗。
- `Collector's Focus` 不被其他 buff 消耗，只被提煉類技能消耗。
- `Meticulous` 不耗耐久、價值提升、Collector's Standard 是獨立分支。
- 耐久為 0 立即終止。
- 收藏價值達 1000 後不再產生新的 Collector's Standard 分支。
- 成功率不足 100% 時，solver 會評估成功率補強技能。
- 成功率已 100% 時，不施放成功率補強技能。
- 同分 tie breaker 選較少 GP、較少操作、較簡單 policy。

### 8.3 Reward 測試

新增：`src/services/collectableRewards.test.ts`，可用 stub JSON。

至少覆蓋：

- low / mid / high 三檔。
- `high = 0` 時不誤判成 high。
- 找不到 itemId 時回傳 unsupported。
- reward vector scalar objective：scrip。

### 8.4 UI 測試

至少手動或 e2e 覆蓋：

- 收藏品不再顯示施工中。
- 水晶採集仍顯示施工中。
- 一般採集求解器不受影響。
- 收藏品結果不顯示巨集按鈕。
- 收藏品可儲存秘笈。
- 秘笈藏書庫可顯示收藏品秘笈且無巨集按鈕。
- 收藏品秘笈可載回求解台。
- Debug 模式開啟後可看到收藏品 debug 視窗。
- 明亮 / 黑暗模式可讀。
- 手機版沒有水平 overflow。
- 四語系 key 不缺漏。

## 9. 實作階段建議

### Phase A：基礎型別、公式、測試

目標：先把數學地基鋪穩。

工作：

1. 新增 `src/types/collectable.ts`。
2. 新增 `src/utils/collectableMath.ts`。
3. 新增 `src/utils/collectableMath.test.ts`。
4. 擴充 action id mapping，至少讓收藏品技能與成功率技能可顯示 icon/name。

完成標準：

- `npm run test:unit -- collectableMath` 或專案可用的 vitest 指令通過。
- 最大值 case 與 skill 文件相符。

### Phase B：reward table

目標：純收藏品繳納可查 reward。

工作：

1. 新增 `src/services/collectableRewards.ts`。
2. 新增 reward tests。
3. UI 層可辨識「支援 / 不支援」收藏品。

完成標準：

- 給定 Teamcraft `collectables.json` 中存在的 itemId，可回傳三檔門檻與票據。
- 找不到 reward table 時有穩定 error state。

### Phase C：核心 solver

目標：在無 UI 的情況下可產出 policy tree。

工作：

1. 新增 `src/utils/collectableSolver.ts`。
2. 新增 `src/workers/collectableSolver.worker.ts`。
3. 新增 `collectableSolver.test.ts`。

完成標準：

- 可用固定 request 求得 policy。
- Debug 有狀態數與公式摘要。
- `Priming Touch` 消耗規則正確。
- 成功率不足 100% 時會評估成功率補強技能。

### Phase D：求解台 UI

目標：使用者可從收藏品入口求解。

工作：

1. 修改 `Solver.vue` 的收藏品 branch。
2. 新增 `CollectableSolverPanel.vue`。
3. 新增 `CollectablePolicyView.vue`。
4. 新增 `CollectablePolicyTreeDialog.vue`。
5. 新增 `CollectableDebugDialog.vue`。
6. 新增 i18n keys。

完成標準：

- 收藏品 item 點入後顯示求解台。
- 求解後顯示推薦策略、判斷表、完整樹入口、debug 入口。
- 不顯示巨集按鈕。

### Phase E：儲存秘笈與藏書庫

目標：收藏品秘笈可保存與載回。

工作：

1. 擴充 `StoredTome` union。
2. 修改 `useTomeLibrary.ts`。
3. 修改 `TomeLibrary.vue`。
4. 修改 `useSolver.ts` 或新增收藏品載入 composable。

完成標準：

- 一般採集舊秘笈仍可顯示。
- 收藏品秘笈可保存。
- 收藏品秘笈可在藏書庫顯示 policy preview。
- 收藏品秘笈不顯示巨集按鈕。
- 點編輯可載回收藏品求解台。

### Phase F：驗證與修整

目標：確保整體品質。

工作：

1. 執行 `npm run test:unit`。
2. 執行 `npm run build`。
3. 啟動 dev server。
4. 使用瀏覽器驗證桌面與手機寬度。
5. 驗證明亮 / 黑暗模式。
6. 搜尋 CSS 是否產生錯誤 `.dark { ... }` scoped selector。

完成標準：

- 測試與 build 通過。
- UI 在手機不 overflow。
- 一般採集、收藏品、水晶三種入口行為正確。

## 10. 後續階段

### Phase 2：複合獎勵

加入：

- 薩雷安魔法大學
- 珠串萬貨大街
- 老主顧

此階段加入 objective 切換：

- 票據
- 經驗
- 金幣
- 自訂權重

老主顧好感度：

- 若三檔相同，只顯示參考，不提供作為求解目標。
- 若未來資料出現三檔不同，再動態提供目標選項。

### Phase 3：大膽提煉與強化洞察

只有在資料補齊後才做：

- `Brazen / 大膽提煉` 分布、檔位、取整順序。
- `Collector's High Standard / 強化洞察` 觸發機率。
- 強化洞察、預備碰觸、節點加成完整疊加順序。

### Phase 4：精選

精選 reward model 獨立設計：

- 研究 Teamcraft `reduction.json` / `reverse-reduction.json`。
- 或研究 datamining `GathererReductionReward.csv`。
- 評分目標不應預設為票據，而是靈砂 / 素材 / 自訂價值。

## 11. 常見踩雷提醒

1. 不要把 `Collector's Intuition` 當成 `Collector's Standard`。
   - 前者是價值提升效果。
   - 後者是洞察 Buff。

2. 不要把收藏品求解結果做成巨集。
   - 收藏品依賴隨機分支與即時判斷。

3. 不要在 `rotationSolver.ts` 內塞收藏品邏輯。
   - 收藏品是 policy tree，不是 linear rotation。

4. 不要在 UI 文案宣稱「最佳」。
   - 對外只能稱推薦。

5. 不要忽略採集成功率。
   - `Collect` reward 期望必須乘成功率。
   - 成功率不足 100% 時，成功率補強技能可以納入求解。

6. 不要讓 `Priming Touch` 被 `Scour` 消耗。
   - 使用者已確認：直到 `Meticulous` 才消失。

7. 不要破壞一般採集舊秘笈。
   - localStorage 舊資料沒有 `kind`，需視為 `regular`。

8. 不要讓手機版展示橫向巨型樹。
   - 主畫面用判斷表，完整樹用垂直展開。

9. 不要在 scoped CSS 寫錯 dark selector。
   - 正確：`:global(html.dark .foo)`。
   - 錯誤：`:global(html.dark) .foo`。

## 12. 建議最小可交付版本

若需要切一個最小可交付 PR，範圍如下：

1. 純收藏品 reward table。
2. 收藏品公式與測試。
3. 收藏品 solver 可輸出 policy tree。
4. 收藏品求解台可求解並顯示判斷表。
5. Debug 視窗。
6. 儲存收藏品秘笈與藏書庫顯示。
7. 不包含薩雷安、珠串、老主顧、精選。

這個版本已足以取代目前「收藏品系統仍在施工中」畫面，且保留後續擴充空間。
