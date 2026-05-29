# 一般採集機制層

本文描述一般採集目前在 code 中的實際模型。主要來源是 `gatheringMath.ts`、`regularGatheringMechanics.ts`、`rotationSolver.ts`、`rotationSimulator.ts`、`regularGatheringWasmSolver.ts` 與 `assembly/regularGatheringSolverCore.ts`。

## 執行路徑

一般採集秘笈是 WASM-first：

- 正式求解優先走 `solveGatheringRotationWithWasm()`，核心為 `assembly/regularGatheringSolverCore.ts` 編出的 `src/wasm/regular-gathering-solver-core.wasm`。
- `src/utils/regularGatheringMechanics.ts` 仍是 TypeScript 版狀態轉移來源，用於 WASM 結果物化、實驗台、TS fallback 與 parity/oracle。
- `src/utils/rotationSimulator.ts` 的實驗台不是重新寫公式，而是用同一組 `applyRegularGatheringAction()` 逐步展開使用者指定 rotation。

這代表：若只改 TS mechanics 或只改 AssemblyScript core，都可能造成秘笈、實驗、debug 或 fallback 行為不一致。

## 輸入與初始狀態

Engine request 主要輸入：

- 玩家：`level`、`gathering`、`perception`、最大 `gp`。在求解台 / 實驗台送進 engine 前，這組 `stats` 已是套用食物後的有效數值，不是裸裝備值。
- 物品 / 節點公式值：`baseValues.Gathering`、`baseValues.Perception`、`itemLevel`。
- 節點 bonus：`baseIntegrity`、`gatheringCount`、`yieldCount`、`extraRate`。
- 當前資源：`temporaryGp`。
- 其他：`jobType`、`isTimedNode`、`objectiveMode`、debug / memo capacity 設定。

初始狀態：

- `gp = min(stats.gp, temporaryGp)`。
- `integrity = baseIntegrity + gatheringCount`。
- 尚未採集：`hasGathered = false`。
- 所有成功率、額外採集率、獲得數、下一次採集、福音、理智同興旗標都從 0 或 false 開始。

`inputLimits.ts` 目前把玩家 GP 正規化在 `0..4095`，節點總耐久也會受 WASM packed state 上限影響，`baseIntegrity + gatheringCount` 目標不超過 15。

食物處理在 engine 外層完成：`useSolver.ts` 與 `useSimulatorStats.ts` 先用 `calculateFoodBonus()` / `applyFoodBonus()` 產生 `effectiveStats`，再把 `effectiveStats` 塞進 request。`temporaryGp` 也會用 `effectiveStats.gp` 當上限修正。因此 mechanics 裡的 `gp = min(stats.gp, temporaryGp)` 是「目前 GP 不超過食物後最大 GP」，不是把食物 GP bonus 丟掉。

## 基礎公式

### 採集成功率

先算：

```text
score = floor(100 * gathering / baseGathering)
```

若 `baseGathering` 為 0，成功率為 0。否則分段：

| score | raw rate |
| --- | --- |
| `>= 80` | `100` |
| `76..79` | `94 + (score - 75)` |
| `64..75` | `72 + (score - 64) * 2` |
| `46..63` | `60 + floor((score - 45) * 5 / 9)` |
| `45` | `60` |
| `44` | `58` |
| `41..43` | `52 + (score - 40) * 2` |
| `21..40` | `floor(20 + (score - 20) * 1.6)` |
| `11..20` | `2 + (score - 11) * 2` |
| `1..10` | `1` |
| `<= 0` | `0` |

等級修正只在 `itemLevel > 0` 且 raw rate 介於 1..99 時套用：

- 玩家等級高於 item level：最多 +5。
- 玩家等級低於 item level：每差 1 級 -5，最多 -25。
- 最後 clamp 到 `0..100`。

### 額外採集率

先算：

```text
boonScore = min(150, floor(100 * perception / basePerception))
```

若 `basePerception` 為 0，額外採集率為 0。否則分段後向下取整，最後 clamp 到 `0..60`：

| boonScore | boon rate |
| --- | --- |
| `>= 100` | `(boonScore - 100) / 50 * 25 + 35` |
| `80..99` | `(boonScore - 80) / 20 * 20 + 15` |
| `70..79` | `(boonScore - 70) / 10 * 5 + 10` |
| `60..69` | `(boonScore - 60) / 10 * 10` |
| `< 60` | `0` |

採集時實際額外採集率為：

```text
clamp(baseBoonChance + nodeBonuses.extraRate + boonBonus, 0, 100)
```

注意：公式本身的 base boon 上限是 60，但節點 bonus 與技能 bonus 之後的採集分支上限是 100。

### 高產 / 豐收 II 加成量

`calculateBountifulYield()` 目前只看獲得力與 `baseGathering`：

- `baseGathering <= 0`：回傳 1。
- `gathering >= floor(baseGathering * 1.1)`：回傳 3。
- `gathering >= floor(baseGathering * 0.9)`：回傳 2。
- 其他：回傳 1。

## 狀態欄位

一般採集 DP / simulator 追蹤：

- `gp`
- `integrity`
- `hasGathered`
- `successBonus`
- `successIActive`
- `successIIActive`
- `successIIIActive`
- `boonBonus`
- `giftIActive`
- `giftIIActive`
- `allYieldBonus`
- `tidings`
- `nextSuccessBonus`
- `nextYieldBonus`
- `wiseReady`

WASM core 會把這些狀態壓進 packed key；TS fallback 使用字串 key。語意上它們代表同一套模型狀態。

## 行動模型

| action kind | 等級 | GP | 使用條件 | 效果 |
| --- | ---: | ---: | --- | --- |
| `gather` | 1 | 0 | `integrity > 0` | 執行一次採集分支 |
| `successI` | 4 | 50 | 未使用過 I，成功率可提高，且尚未採集 | 整點成功率 +5 |
| `successII` | 5 | 100 | 未使用過 II，成功率可提高，且尚未採集 | 整點成功率 +15 |
| `successIII` | 10 | 250 | 未使用過 III，成功率可提高，且尚未採集 | 整點成功率 +50 |
| `giftI` | 15 | 50 | 未使用過 I，額外採集率可提高，且尚未採集 | 整點額外採集率 +10 |
| `giftII` | 50 | 100 | 未使用過 II，額外採集率可提高，且尚未採集 | 整點額外採集率 +30 |
| `clearVision` | 23 | 50 | 下一次成功率 bonus 為 0，成功率可提高 | 下一次採集成功率 +15 |
| `bountifulI` | 24 | 100 | 下一次獲得數 bonus 為 0，且目前成功率大於 0 | 下一次採集獲得數 +1 |
| `bountifulII` | 68 | 100 | 同 `bountifulI` | 下一次採集獲得數 +1/+2/+3 |
| `restore` | 25 | 300 | 耐久低於上限 | GP -300，耐久 +1；90 級以上有 50% 設定 `wiseReady` |
| `wise` | 90 | 0 | `wiseReady` 且耐久低於上限 | 耐久 +1，清掉 `wiseReady` |
| `kingI` | 30 | 400 | `allYieldBonus == 0` 且尚未採集 | 整點獲得數 +1 |
| `kingII` | 40 | 500 | `allYieldBonus == 0` 且尚未採集 | 整點獲得數 +2 |
| `tidings` | 81 | 200 | 尚未啟用，額外採集率大於 0，且尚未採集 | 額外採集成功時再多 +1 |

`successI/II/III`、`giftI/II`、`kingI/II`、`tidings` 是整個採集點 buff，code 目前在第一次 `gather` 後禁止使用。`clearVision` 與 `bountifulI/II` 是下一次採集型 buff，不受 `hasGathered` 限制。

## 採集分支

一次 `gather` 會：

- `integrity - 1`
- `hasGathered = true`
- 清掉 `nextSuccessBonus` 與 `nextYieldBonus`

成功率：

```text
successRate = clamp(baseSuccessRate + successBonus + nextSuccessBonus, 0, 100) / 100
```

額外採集率：

```text
boonChance = clamp(baseBoonChance + nodeBoonBonus + boonBonus, 0, 100) / 100
```

獲得數：

```text
baseYield = 1 + nodeYieldBonus + allYieldBonus + nextYieldBonus
boonYield = 1 + (tidings ? 1 : 0)
```

分支：

- 失敗：機率 `1 - successRate`，獲得數 +0，GP 不回復。
- 成功但無額外採集：機率 `successRate * (1 - boonChance)`，獲得數 +`baseYield`，GP 回復。
- 成功且額外採集：機率 `successRate * boonChance`，獲得數 +`baseYield + boonYield`，GP 回復。

成功時 GP 回復：

- `level >= 70`：+6 GP。
- `level < 70`：+5 GP。
- 回復後不超過玩家最大 GP。

## 耐久恢復與理智同興

`restore`：

- 花費 300 GP。
- 耐久恢復 1，但不超過 `maxIntegrity`。
- 90 級以前是 deterministic 分支。
- 90 級以上分成兩條 50% 分支：一條 `wiseReady = true`，另一條 `wiseReady = false`。

`wise`：

- 只有 `wiseReady = true` 且耐久低於上限時可用。
- 不花 GP。
- 耐久恢復 1，並清掉 `wiseReady`。
- 求解器遇到可用 `wise` 時會優先只評估這個 action。

## 再起

一般採集秘笈與實驗都使用同一組再起機率常數：

- 玩家等級 `< 91`：再起不啟用，機率 0。
- 一般採集點：5%。
- `isTimedNode`：8%。

求解結果的 combined outcome 是：

```text
no revisit: primary
revisit: primary + full-GP plan
combined = primary * (1 - chance) + (primary + full-GP plan) * chance
```

若起始 GP 已經等於最大 GP，使用者可見的 `rotationPlans` 只列 primary；但 combined outcome 仍按「再跑一次同樣 full-GP plan」計入再起期望。

## 求解排序與 tie-break

`objectiveMode`：

- `expected`：以期望獲得數排序。
- `min`：以 outcome distribution 的最小獲得數排序。
- `max`：以 outcome distribution 的最大獲得數排序。

同分時的主要 tie-break：

- `min` / `max` 模式下，較短 rotation 優先。
- `restore` 在 90 級以上偏好缺 2 點耐久才使用；90 級以下偏好缺 1 點耐久才使用。
- 整點 buff 放在下一次採集型 buff 前會加分。
- `clearVision`、`bountifulI/II` 越靠近採集越加分。
- `gift` 接近並早於 `tidings` 會加分。

這些 tie-break 只決定等價分數下的推薦手法形狀，不改採集分支公式。

## 實驗台行為

實驗台依使用者指定的 action name 逐步套用 mechanics：

- 無法解析 action name 時，該步不改變目前狀態。
- 某步在某條分支不可用時，該分支保持原狀。
- 每步後會把相同狀態合併，機率小於 `1e-9` 的狀態被濾掉。
- 若有再起 rotation 且再起啟用，總結果用 primary 分支與 revisit 分支做機率組合。

## 目前模型未涵蓋或需留意

- 一般採集 action set 只包含上述 action；其他遊戲技能若未在 action kind 內，就不在模型中。
- 成功率與額外採集率公式完全依 `gatheringMath.ts` 的分段函式；若遊戲改版公式不同，這裡會產生系統性誤差。
- WASM packed state 使用有限 bit width；高 GP、高耐久或大量 bonus 的壓力案例要特別用 bench / debug 驗證。
