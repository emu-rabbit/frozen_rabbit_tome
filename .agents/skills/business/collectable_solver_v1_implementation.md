# 收藏品第一版求解器實作規格

本文件整理 2026-05-10 與使用者在遊戲內實測、並對照 Teamcraft `Gathering Math` 後得到的第一版實作規格。目標是讓後續 Agent 可以直接在此基礎上實作收藏品求解器，不要重新混淆「價值提升」與「洞察」。

產品定位補充：收藏品求解器屬於 **秘笈** 系統，輸出應稱為「推薦手法」或「推薦 policy」，不可對外宣稱為最佳或唯一正解。未納入第一版求解器的技能與未知公式，未來可優先放到 **實驗** 系統，讓使用者手動指定狀態、機率或技能手法後進行模擬與分析。

## 第一版範圍

### 納入

- `Collect / 收藏品採集`
- `Scour / 提煉`
- `Meticulous / 慎重提煉`
- `Scrutiny / 集中檢查`
- `Collector's Focus / 價值矚目`
- `Priming Touch / 預備碰觸`
- `Collector's Intuition / 價值提升效果`
- `Collector's Standard / 洞察 Buff`

### 排除

- `Brazen / 大膽提煉`
  - 原因：50% 到 150% 的隨機分布、檔位與取整順序尚未確認。
- `Collector's High Standard / 強化洞察`
  - 原因：發生率未知，少量手測無法建立可靠期望值模型。
  - 可在未來實驗系統的模擬器中讓使用者手動指定狀態或機率，但不要放進第一版秘笈求解器推薦。
- 精選 reward model
  - 原因：精選獎勵不是票據三檔模型，後續獨立設計。

## 關鍵名詞

| 名詞 | 遊戲內現象 | 實作名稱建議 |
| :--- | :--- | :--- |
| Collector's Intuition / IntuitionRate | 價值提升效果、價值提升機率 | `valueIncreaseRate` / `valueIncreaseProc` |
| Collector's Standard | 繁中狀態「洞察」 | `standardActive` / `standardProcRate` |
| Collector's High Standard | 繁中狀態「強化洞察」 | 第一版排除 |

不要把 `IntuitionRate` 命名成 `standardRate` 或 `insightRate`。它不是洞察 Buff 發生率。

## 公式

### 通用分數

```txt
Score = floor(100 * currentStat / baseValue)
ActionScore = min(95, Score)
RateScore = min(100, Score)
```

### Scour

使用 `gathering / baseGathering` 算 `ActionScore`。

```txt
if ActionScore <= 66:
  Scour = 150
else if ActionScore <= 85:
  Scour = floor((ActionScore - 66) * 40 / 19 + 150)
else:
  Scour = ActionScore - 85 + 190
```

最大值 case：`Scour = 200`。

### Value Increase / Collector's Intuition

使用 `gathering / baseGathering` 算 `RateScore`。

```txt
if RateScore <= 66:
  valueIncreaseRate = 10
else if RateScore <= 85:
  valueIncreaseRate = floor((RateScore - 66) * 10 / 19 + 10)
else:
  valueIncreaseRate = floor((RateScore - 85) * 20 / 15 + 20)
```

最大值 case：40%。

`Collector's Focus`：

```txt
focusedValueIncreaseRate = floor(valueIncreaseRate * 175 / 100)
```

最大值 case：40% -> 70%。

### Meticulous No-Durability Rate

使用 `gathering / baseGathering` 算 `RateScore`。

```txt
if RateScore <= 66:
  meticulousRate = 5
else if RateScore <= 85:
  meticulousRate = floor((RateScore - 66) * 5 / 19 + 5)
else:
  meticulousRate = RateScore - 85 + 10
```

最大值 case：25%。

`Priming Touch`（含強化洞察疊加）：

**已由使用者遊戲內實測確認（2026-05-11）：**

實測數據：
- 一般慎重不耗率（最大值 case）：25%
- 觸發強化洞察（Collector's High Standard）後：65% → 意即強化洞察額外加 **+40 個百分點**
- 再施展預備碰觸後：90% → 驗算：`25 * 2 + 40 = 90` ✅

**確認公式：**

```txt
highStandardBonus = 40  （固定 +40%，Lv100 trait）

effectiveMeticulousRate = min(100, baseMeticulousRate * 2 + highStandardBonus + nodeBonus)
```

其中：
- `baseMeticulousRate`：由獲得力計算的公式基礎值（最大 25%）
- `highStandardBonus`：強化洞察觸發時固定 +40%，否則 0
- `nodeBonus`：採集點特殊加成（若有），目前尚無具體數值；第一版先設 0
- 預備碰觸只翻倍 `baseMeticulousRate`，不影響 `highStandardBonus` 或 `nodeBonus`

第一版（不含強化洞察）的簡化公式：

```txt
primedMeticulousRate = min(100, meticulousRate * 2)
```

最大值 case：25% → 50%（無強化洞察時）。

未來納入強化洞察時，應先判定 `highStandardActive`，再套用完整公式。強化洞察的觸發機率尚未確認，繼續排除於第一版求解器外。

### Scrutiny Multiplier

使用 `perception / basePerception` 算 `ActionScore`。

```txt
if ActionScore <= 66:
  scrutinyMultiplier = 90
else if ActionScore <= 85:
  scrutinyMultiplier = floor((ActionScore - 66) * 25 / 19 + 90)
else:
  scrutinyMultiplier = ActionScore - 85 + 115
```

最大值 case：125。

`Scrutiny` 依 Teamcraft 公式先由 `Scour` 算出額外加成，再加到本次提煉 action 的基礎提升量上：

```txt
scrutinyBonus = floor(Scour * scrutinyMultiplier / 100)

Scour + Scrutiny = Scour + scrutinyBonus
Meticulous + Scrutiny = floor(Scour * 75 / 100) + scrutinyBonus
Meticulous + Collector's Standard + Scrutiny = Scour + scrutinyBonus
```

價值提升效果另加 `floor(Scour * 50 / 100)`。最大值 case：`Scour = 200`、`scrutinyMultiplier = 125`、`scrutinyBonus = 250`，因此 `Scrutiny + Meticulous` 為 `400 / 500`。

## 最大值 Case 實測表

以下表格來自使用者在遊戲內最大值 case 實測，作為實作測試基準。

| 狀態 | Action | 未觸發價值提升 | 觸發價值提升 |
| :--- | :--- | ---: | ---: |
| 無 buff | Scour | +200 | +300 |
| 無 buff | Meticulous | +150 | +250 |
| Collector's Standard | Meticulous | +200 | +300 |
| Scrutiny | Scour | +450 | +550 |
| Scrutiny | Meticulous | +400 | +500 |
| Scrutiny + Collector's Standard | Meticulous | +450 | +550 |

`Meticulous` 另有不耗耐久 outcome；不耗耐久與價值提升是分開事件。

## Collector's Standard / 洞察 Buff

Teamcraft 稱 `Collector's Standard` 是 hidden proc，繁中遊戲 UI 顯示為「洞察」。

近似機率：

| 節點類型 | 機率 |
| :--- | ---: |
| Lv55 收藏品點 | 0% |
| 一般非限時收藏品點 | 25% |
| 未滿等級上限未知點 | 25% |
| 精選點 | 20% |
| 滿等未知 / 傳說點 | 13% |

限制：

- 不能在剛開節點時觸發，必須先使用收藏品技能。
- 收藏價值已達 1000 時不能觸發。
- 耐久歸 0 時不能觸發。
- 裝備與等級不影響此機率。

實作建議：

- State 用 `standardActive: boolean` 表示下一次 `Meticulous` 受洞察影響。
- 因第一版排除 `Brazen`，`standardActive` 只改變 `Meticulous` 的 outcome。
- 使用 `Meticulous` 後消耗 `standardActive`。
- `Scour` 不需要消耗或受益於 `standardActive`；Teamcraft 指出 Standard increases Brazen and Meticulous to be in line with Scour。

## Buff 狀態與消耗

### Scrutiny

- GP：200。
- 可與 `Collector's Focus`、`Priming Touch` 共存。
- 下一次提煉類技能後消耗。
- 影響 `Scour` 與 `Meticulous`。

### Collector's Focus

- GP：100。
- 將下一次提煉類技能的價值提升機率乘 1.75。
- 施放其他 GP Buff 不消耗。
- 下一次提煉類技能後消耗。

### Priming Touch

- GP：100。
- 將下一次 `Meticulous` 不耗耐久率翻倍。
- 不影響收藏價值提升量。
- 不影響價值提升機率。
- 施放其他 GP Buff 不消耗。
- 下一次提煉類技能後消耗。第一版沒有 `Brazen`，所以實際上會在下一次 `Scour` 或 `Meticulous` 後消耗；若是 `Scour` 後也會消耗，需實作時依遊戲描述與使用者確認，保守可只在 `Meticulous` 後消耗並於 debug 標示。

## Search State

建議新增 `src/types/collectable.ts`，不要混在一般採集 `SolverResponse` 裡。

```ts
interface CollectableSearchState {
  gp: number;
  integrity: number;
  collectability: number;
  scrutinyActive: boolean;
  collectorsFocusActive: boolean;
  primingTouchActive: boolean;
  standardActive: boolean;
  hasUsedCollectableAction: boolean;
}
```

Memo key：

```txt
gp|integrity|collectability|scrutiny|focus|priming|standard|hasUsedCollectableAction
```

若狀態數過大，先觀察 debug，不要過早壓縮收藏價值。

## Outcome 建模

每次提煉類技能至少拆以下隨機軸：

1. 價值提升是否觸發：`valueIncreaseRate` 或 focused rate。
2. 若為 `Meticulous`，是否不耗耐久：`meticulousRate` 或 primed rate。
3. Action 結束後是否取得 `Collector's Standard`：依節點類型機率，且需滿足觸發限制。

注意：價值提升不一定給洞察 Buff。這兩個事件不可合併。

### Scour outcome

- 無 Scrutiny：`+Scour` / value-up `+floor(Scour * 150 / 100)`，最大值 case為 `+200 / +300`。
- Scrutiny：最大值 case `+450 / +550`。公式實作時以 `scrutinyBonus = floor(Scour * scrutinyMultiplier / 100)`，`Scour + Scrutiny = Scour + scrutinyBonus`，價值提升再加 `floor(Scour * 50 / 100)`。

### Meticulous outcome

最大值 case請以實測表驗證：

- 無 buff：`+150 / +250`。
- Standard：`+200 / +300`。
- Scrutiny：`+400 / +500`。
- Scrutiny + Standard：`+450 / +550`。

非最大值 case 的精確公式若有疑慮，先在 debug 顯示公式來源與中間值。不要回退到簡單線性假設。

### Collect outcome

- `Collect` 消耗 1 耐久。
- 收藏價值不重置，可連續採集同一收藏價值。
- Reward 依目前收藏價值映射到 reward table。
- 收藏品採集仍需乘採集成功率；第一版可沿用一般採集成功率公式。

## 終止條件

- `integrity <= 0`：立即終止，不能再 `Collect`，也不能補任何技能。
- `collectability` 上限為 1000。
- 若已無可產生正期望的動作，應選擇 `Collect` 或終止，依 reward model 評估。

## Reward Model 第一版

第一版優先支援 Teamcraft `collectables.json` 的純收藏品繳納。

```ts
interface CollectableRewardVector {
  exp: number;
  gil: number;
  scrip: number;
  items: Record<number, number>;
}
```

預設 objective：

- 純收藏品繳納：`scrip`
- 未來薩雷安 / 珠串 / 老主顧：可切 `scrip` / `exp` / `gil`
- 精選：不在第一版

Reward tier：

```ts
function rewardTier(value, thresholds) {
  if (thresholds.high > 0 && value >= thresholds.high) return 'high';
  if (value >= thresholds.mid) return 'mid';
  if (value >= thresholds.low) return 'low';
  return 'none';
}
```

## Result 型別

收藏品求解器不輸出單一線性 rotation，應輸出 policy tree。

```ts
interface CollectableSolverResult {
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  policy: CollectablePolicyNode;
  debug?: CollectableSolverDebugInfo;
}

interface CollectablePolicyNode {
  id: string;
  state: CollectableStateSummary;
  recommendedAction: CollectableActionSummary;
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  branches: CollectablePolicyBranch[];
}
```

UI 主畫面應顯示扁平判斷表，完整樹放在詳情中。不要提供巨集，因為收藏品依賴即時分支判斷。

## 建議檔案

- `src/utils/collectableMath.ts`
- `src/utils/collectableSolver.ts`
- `src/workers/collectableSolver.worker.ts`
- `src/services/collectableRewards.ts`
- `src/types/collectable.ts`
- `src/components/CollectablePolicyView.vue`

## Debug 必須顯示

- `Scour` value。
- `Scrutiny` multiplier。
- `valueIncreaseRate` 與是否受 `Collector's Focus` 影響。
- `meticulousRate` 與是否受 `Priming Touch` 影響。
- `standardProcRate` 與節點類型判定。
- 未納入項：`Brazen`、`Collector's High Standard`、精選 reward model。
- 搜尋狀態數、memo hits、分支數。

## UI 提示文案方向

建議在結果區顯示：

```txt
此策略以穩定模型估算，已納入提煉、慎重提煉、集中檢查、價值矚目、預備碰觸、價值提升與一般洞察。
未納入大膽提煉與強化洞察；若遊戲內觸發強化洞察，請依畫面狀態手動調整。
```

Debug 或 tooltip 顯示：

```txt
洞察機率採 Teamcraft Collector's Standard 近似資料；價值提升機率採 Teamcraft IntuitionRate 公式。
```

## 測試清單

公式測試：

- `Scour` score 66 / 67 / 85 / 86 / 95。
- `valueIncreaseRate` score 66 / 67 / 85 / 86 / 100。
- `Collector's Focus` 最大值 case 40 -> 70。
- `meticulousRate` 最大值 case 25。
- `Priming Touch` 最大值 case 25 -> 50。
- `Scrutiny` 最大值 case multiplier 125。

最大值 case 行為測試：

- 無 buff + `Scour`：200 / 300。
- 無 buff + `Meticulous`：150 / 250。
- `Standard` + `Meticulous`：200 / 300。
- `Scrutiny` + `Scour`：450 / 550。
- `Scrutiny` + `Meticulous`：400 / 500。
- `Scrutiny` + `Standard` + `Meticulous`：450 / 550。

Solver 測試：

- 價值提升與 `Collector's Standard` 是獨立分支。
- `Meticulous` 不耗耐久與價值提升是獨立分支。
- `Collector's Focus` 不被其他 GP Buff 消耗，只被提煉類技能消耗。
- `Priming Touch` 不被其他 GP Buff 消耗。
- 耐久為 0 時立即終止。
- 收藏價值達 1000 時不再產生 Standard 分支。
- 同分時偏好較少 GP、較少操作、較簡單 policy。

## 參考來源

- Teamcraft Gathering Math：`https://guides.ffxivteamcraft.com/guide/gathering-math`
- 2026-05-10 使用者遊戲內最大值 case 實測。
