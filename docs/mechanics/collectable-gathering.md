# 收藏品採集機制層

本文描述收藏品採集目前在 code 中的實際模型。主要來源是 `collectableMath.ts`、`collectableMechanics.ts`、`collectableSolver.ts`、`collectableWasmSolver.ts`、`collectableWasmPolicy.ts`、`collectableStrategyTree.ts`、`collectableStrategyAnalysis.ts`、`collectableActions.ts` 與 `assembly/collectableSolverCore.ts`。

## 執行路徑

收藏品秘笈是 WASM-first：

- `solveCollectableRotationWithWasm()` 優先呼叫 `assembly/collectableSolverCore.ts` 編出的 `src/wasm/collectable-solver-core.wasm`。
- WASM core 負責 DP / memo / action 選擇。
- `collectableWasmPolicy.ts` 會用 TypeScript mechanics 依 WASM 選出的 action 重建 policy tree、期望 reward、tier counts 與 outcome distribution。
- `collectableSolver.ts` 是 TS fallback / oracle / parity 參考。
- 收藏品實驗台使用 `collectableStrategyTree.ts` 與 `collectableStrategyAnalysis.ts`，同樣基於 `applyCollectableAction()` 展開使用者規則。

因此收藏品目前不是固定 rotation，而是 policy tree / 判斷表。

## 輸入與初始狀態

Engine request 主要輸入：

- 玩家：`level`、`gathering`、`perception`、最大 `gp`。在求解台 / 實驗台送進 engine 前，這組 `stats` 已是套用食物後的有效數值，不是裸裝備值。
- 物品 / 節點公式值：`baseValues.Gathering`、`baseValues.Perception`、`itemLevel`、`isTimedNode`。
- 節點 bonus：`baseIntegrity`、`gatheringCount`。
- 當前資源：`temporaryGp`。
- reward / objective：`rewardTable`、`objective`、`objectiveMode`。
- 其他：`jobType`、`hasRelicToolBonus`、debug / memo capacity 設定。

收藏品 mechanics 會要求玩家等級至少 50；低於 50 會丟出錯誤。

初始狀態：

- `gp = min(stats.gp, temporaryGp)`。
- `integrity = baseIntegrity + gatheringCount`。
- `collectability = 0`。
- 所有 buff / proc / action-used 旗標從 false 開始。
- 成功率 bonus 與下一次收藏成功率 bonus 從 0 開始。

目前收藏品核心不使用一般採集的 `yieldCount` 或 `extraRate`。

食物處理在 engine 外層完成：一般求解台會把 `effectiveStats` 傳給收藏品求解 composable，再組成 `CollectableSolverRequest`；實驗台也同樣先套用食物。`temporaryGp` 會以食物後最大 GP 為上限，因此 mechanics 裡的 `gp = min(stats.gp, temporaryGp)` 是「目前 GP 不超過食物後最大 GP」，不是把食物 GP bonus 視為無效。

## 基礎成功率

收藏品的 `collect` 成功率直接共用 `calculateSuccessRate()`：

```text
score = floor(100 * gathering / baseGathering)
```

之後走與一般採集相同的分段、等級修正與 `0..100` clamp。`collect` 成功時會給 reward；失敗時不給 reward，但仍消耗耐久。

## 收藏價值公式

### 分數基礎

`collectableActionScore(stat, base)`：

```text
min(95, floor(100 * stat / base))
```

`collectableRateScore(stat, base)`：

```text
min(100, floor(100 * stat / base))
```

`base` 為 0 時 score 為 0。

### 提煉基礎值

`scourValue` 使用獲得力：

| action score | scourValue |
| --- | --- |
| `<= 66` | `150` |
| `67..85` | `floor((score - 66) * 40 / 19 + 150)` |
| `86..95` | `score - 85 + 190` |

收藏價值最後會 clamp 到 `0..1000`。

### 價值提升率

`valueIncreaseRate` 使用獲得力：

| rate score | rate |
| --- | --- |
| `<= 66` | `10` |
| `67..85` | `floor((score - 66) * 10 / 19 + 10)` |
| `86..100` | `floor((score - 85) * 20 / 15 + 20)` |

若 `hasRelicToolBonus` 為 true，先把這個 rate +20，最高 100。

`Collector's Focus` 作用時，實際 rate 改用：

```text
focusedValueIncreaseRate = min(100, floor(valueIncreaseRate * 175 / 100))
```

價值提升觸發時，該次提煉額外加：

```text
floor(scourValue * 50 / 100)
```

### 慎重提煉耐久不減率

`meticulousRate` 使用獲得力：

| rate score | rate |
| --- | --- |
| `<= 66` | `5` |
| `67..85` | `floor((score - 66) * 5 / 19 + 5)` |
| `86..100` | `score - 85 + 10` |

`Priming Touch` 作用時：

```text
primedMeticulousRate = min(100, meticulousRate * 2)
```

### Scrutiny 倍率與 bonus

`scrutinyMultiplier` 使用鑑別力：

| action score | multiplier |
| --- | --- |
| `<= 66` | `90` |
| `67..85` | `floor((score - 66) * 25 / 19 + 90)` |
| `86..95` | `score - 85 + 115` |

`Scrutiny` 啟用後，下一次提煉額外加：

```text
floor(scourValue * scrutinyMultiplier / 100)
```

## Collector's Standard proc

code 目前的 `standardProcRate`：

- `itemLevel === 55`：0%。
- `isTimedNode === true`：13%。
- 其他：25%。

`COLLECTORS_STANDARD_PROC_RATES` 裡雖然有 `timedBelowCap` 與 `ephemeral` 常數，但目前 `getCollectableStandardProcRate()` 沒有使用它們。

一次 `scour` 或 `meticulous` 後，若下一狀態同時符合：

- 耐久仍大於 0。
- 收藏價值仍小於 1000。
- `standardActive` 尚未存在。
- `standardProcRate > 0`。

就會分成 proc / no proc 兩條分支。proc 分支把 `standardActive = true`。

目前 `standardActive` 只會讓下一次 `meticulous` 的 base gain 從 `floor(scourValue * 75 / 100)` 變成 `scourValue`。`scour` 不消耗 `standardActive`；只有 `meticulous` 會清掉它。

## 狀態欄位

收藏品 DP / strategy tree 追蹤：

- `gp`
- `integrity`
- `collectability`
- `scrutinyActive`
- `collectorsFocusActive`
- `primingTouchActive`
- `standardActive`
- `hasUsedCollectableAction`
- `hasCollected`
- `successBonus`
- `successIActive`
- `successIIActive`
- `successIIIActive`
- `nextCollectSuccessBonus`
- `wiseToTheWorldActive`

WASM core 把這些狀態壓成 packed key；TS mechanics 使用字串 key。`inputLimits.ts` 目前列出的 WASM packed state 重要上限包含 GP `0..4095`、耐久 `0..15`、收藏價值 `0..1023`、成功率 bonus `0..127`、下一次成功率 bonus `0..31`。

## 行動模型

| action kind | 等級 | GP | 使用條件 | 效果 |
| --- | ---: | ---: | --- | --- |
| `collect` | 50 | 0 | `integrity > 0` | 嘗試收藏，成功才給 reward |
| `scour` | 50 | 0 | `integrity > 0` 且收藏價值 < 1000 | 提煉，耐久固定 -1 |
| `meticulous` | 50 | 0 | `integrity > 0` 且收藏價值 < 1000 | 慎重提煉，依機率耐久不減或 -1 |
| `scrutiny` | 50 | 200 | 收藏價值 < 1000 且未啟用 | 下一次提煉加入 Scrutiny bonus |
| `collectorsFocus` | 85 | 100 | 收藏價值 < 1000 且未啟用 | 下一次提煉使用 focused value increase rate |
| `primingTouch` | 95 | 100 | 收藏價值 < 1000 且未啟用 | 下一次 `meticulous` 使用 doubled save rate |
| `successI` | 4 | 50 | 未使用過 I，成功率可提高 | 收藏成功率 +5 |
| `successII` | 5 | 100 | 未使用過 II，成功率可提高 | 收藏成功率 +15 |
| `successIII` | 10 | 250 | 未使用過 III，成功率可提高 | 收藏成功率 +50 |
| `nextCollectSuccess` | 23 | 50 | 下一次 bonus 為 0，成功率可提高 | 下一次 `collect` 成功率 +15 |
| `restoreIntegrity` | 25 | 300 | 耐久低於上限 | GP -300，耐久 +1；90 級以上 50% 設定 `wiseToTheWorldActive` |
| `wiseToTheWorld` | 90 | 0 | `wiseToTheWorldActive` 且耐久低於上限 | 耐久 +1，清掉 `wiseToTheWorldActive` |
| `revisitCheck` | 91 | 0 | 不可直接使用 | 只作為 policy tree 顯示再起 gate |

注意：raw mechanics 的 `successI/II/III` 與 `nextCollectSuccess` 不檢查 `hasCollected`。收藏品秘笈求解器會額外用 `filterCollectSuccessActionCandidates()` 避免在已經 `collect` 過後再把這些成功率技能納入候選；實驗策略規則則直接依 mechanics 可用性展開。

## 提煉分支

`scour` 與 `meticulous` 都會先建立價值提升分支：

- 未觸發價值提升：機率 `1 - valueRate`。
- 觸發價值提升：機率 `valueRate`。

`meticulous` 另外建立耐久分支：

- 耐久不減：機率 `saveRate`，`integrityCost = 0`。
- 耐久消耗：機率 `1 - saveRate`，`integrityCost = 1`。

`scour` 沒有耐久不減分支，固定 `integrityCost = 1`。

加值計算：

```text
scourGain = scourValue
  + (scrutinyActive ? floor(scourValue * scrutinyMultiplier / 100) : 0)
  + (valueIncrease ? floor(scourValue * 50 / 100) : 0)

meticulousBase = standardActive ? scourValue : floor(scourValue * 75 / 100)
meticulousGain = meticulousBase
  + (scrutinyActive ? floor(scourValue * scrutinyMultiplier / 100) : 0)
  + (valueIncrease ? floor(scourValue * 50 / 100) : 0)
```

提煉後狀態：

- `collectability = min(1000, collectability + gain)`。
- `integrity -= integrityCost`。
- `hasUsedCollectableAction = true`。
- `scrutinyActive = false`。
- `collectorsFocusActive = false`。
- `primingTouchActive` 只有在 `meticulous` 後清掉；`scour` 後保留。
- `standardActive` 只有在 `meticulous` 後清掉；`scour` 後保留。

## 收藏分支

`collect` 的成功率：

```text
successRate = clamp(baseSuccessRate + successBonus + nextCollectSuccessBonus, 0, 100) / 100
```

成功分支：

- 機率 `successRate`。
- `gp = min(maxGp, gp + gpPerCollect(level))`。
- `integrity - 1`。
- `hasUsedCollectableAction = true`。
- `hasCollected = true`。
- `nextCollectSuccessBonus = 0`。
- 以執行 `collect` 前的 `collectability` 查 reward tier 與 objective score。

失敗分支：

- 機率 `1 - successRate`。
- GP 不回復。
- 仍 `integrity - 1`。
- 同樣標記 `hasUsedCollectableAction = true`、`hasCollected = true`、清掉 `nextCollectSuccessBonus`。
- 不給 reward、不計 tier。

成功時 GP 回復：

- `level >= 70`：+6 GP。
- `level < 70`：+5 GP。
- 回復後不超過玩家最大 GP。

## Reward tier 與 scoring

reward tier 判定：

- 若 high tier 存在且 `collectability >= high.collectability`：`high`。
- 否則若 `collectability >= mid.collectability`：`mid`。
- 否則若 `collectability >= low.collectability`：`low`。
- 否則：`none`。

`scoreCollectability()`：

- `objective.kind === 'scrip'`：使用 reward vector 的 `scrip`。
- `exp` / `gil`：使用對應 reward 欄位。
- `custom`：用 `weights.exp`、`weights.gil`、`weights.scrip` 與 `weights.items[itemId]` 加權。
- `tierScore`：不看 reward vector，直接用 `tierWeights[tier]`。

目前 preset：

- `highValue`：`none 0`、`low 0`、`mid 1`、`high 100`。
- `midValue`：`none 0`、`low 1`、`mid 100`、`high 20`。
- `lowValue`：`none 0`、`low 100`、`mid 20`、`high 10`。
- `customTier` 預設：`none 0`、`low 1`、`mid 3`、`high 8`。
- `scrip` 只有在 reward item metadata 可辨識時加入選項；一般 collectables 預設優先選 `scrip`，其他 reward source 預設 `highValue`。

## 耐久恢復與理智同興

`restoreIntegrity`：

- 花費 300 GP。
- 耐久恢復 1，但不超過 `maxIntegrity`。
- 90 級以前是 deterministic 分支。
- 90 級以上分成兩條 50% 分支：一條 `wiseToTheWorldActive = true`，另一條保持 false。

`wiseToTheWorld`：

- 只有 `wiseToTheWorldActive = true` 且耐久低於上限時可用。
- 不花 GP。
- 耐久恢復 1，並清掉 `wiseToTheWorldActive`。
- 求解器遇到可用 `wiseToTheWorld` 時會優先只評估這個 action。

## 再起

收藏品秘笈使用與一般採集相同的再起常數：

- 玩家等級 `< 91`：再起不啟用，機率 0。
- 一般採集點：5%。
- `isTimedNode`：8%。

combined outcome：

```text
no revisit: primary
revisit: primary + full-GP policy
combined = primary * (1 - chance) + (primary + full-GP policy) * chance
```

policy tree 會在 terminal leaf 後接上一個 `revisitCheck` 顯示 gate。這個 action 不是真正可手動施放的 mechanics action。

## 求解排序與 tie-break

`objectiveMode`：

- `expected`：以期望 score 排序。
- `min`：以 outcome distribution 的最小 score 排序。
- `max`：以 outcome distribution 的最大 score 排序。

同分時的主要 tie-break：

- GP 花費較少優先。
- action 數較少優先。
- node count 較少優先。
- success buff、`nextCollectSuccess`、`wiseToTheWorld` 越早出現越加分。
- `restoreIntegrity` 在 90 級以上偏好缺 2 點耐久才使用；90 級以下偏好缺 1 點耐久才使用。

## 實驗策略台行為

收藏品實驗不是自動求解，而是按使用者規則展開策略樹：

- 規則只取 `enabled = true`。
- 規則條件可用 numeric / boolean state field。
- `mode = all` 時條件全符合才命中；`mode = any` 時任一條件符合即可。
- 找到第一個符合規則後，使用該規則中第一個目前可用 action。
- 若規則有多個 actions，後續 actions 會成為 pending actions；pending action 可用時會優先執行。
- 沒有可執行規則時，節點狀態為 `uncovered`。
- 耐久歸零時是 `terminal`。
- 節點超過 `maxNodes` 時標為 `limited`；預設上限是 1200。

分析分數只在成功 `collect` 分支發生時加入，且用 `collect` 前的 `collectability` 算 score / tier。未決、未覆蓋、limited 或 terminal 節點本身都視為後續 score 0。

## 目前模型未涵蓋或需留意

debug limitation 目前明列：

- `brazen-excluded`
- `high-standard-excluded`
- `reduction-reward-model-excluded`

也就是：

- `Brazen / 大膽提煉` 不在 action set。
- `Collector's High Standard / 強化洞察` 不在目前正式 action model。
- `reduction` 類 reward table 型別存在，但精選 reward model 被視為未納入目前推薦模型。

此外，`COLLECTORS_STANDARD_PROC_RATES` 中未使用的 `timedBelowCap`、`ephemeral` 代表目前 code 沒有區分這些情境；若遊戲實際有差異，這是明確的校正入口。
