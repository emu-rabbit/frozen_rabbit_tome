# WASM 求解器遷移研究報告

日期：2026-05-23
範圍：收藏品求解器 WASM 遷移實驗，以及一般採集求解器是否適合採用同類架構的評估

## 摘要

收藏品求解器搬進 WASM 是值得繼續推進的方向。這次重現並整合 stash 中的 AssemblyScript POC 後，確認 WASM core 可以把特殊慢案例從 TS 路徑的數十秒等級壓到一秒內，且 JS heap 壓力大幅下降。

不過目前最重要的結論不是「WASM 已經完全安全」，而是：

- 數值輸出可以 match：期望值、極值、機率分布、reward、tier counts 都可以透過 TS oracle 測試對齊。
- 完整決策樹不一定會 match：等價分數下的 tie-break / skill habit 會因剪枝或 WASM action 選擇細節而改變。
- 本輪收藏品求解決策已接受「score-safe 但不 tree-safe」的直接剪枝：若剪枝前後分數與分布一致，policy tree 形狀可以不同。
- skill habit 只能作為最後 tie-break，不能保護剪枝前的策略形狀，也不能排在 objective score、GP、action count、node count 之前。

下一步若要討論一般採集求解器搬 WASM，應該先明確定義該 solver 的 pruning contract：是只要求數值不變，還是要求完整匯出樹也不變。若選擇 score-safe pruning，就不要再用完整樹相同作為硬性驗收；若普通採集 UI 需要保留樹形習慣，則必須先建立完整匯出樹 golden diff。

## 本次實作概況

新增的 WASM 核心位於：

- `assembly/collectableSolverCore.ts`
- `src/wasm/collectable-solver-core.wasm`

TS wrapper 與 policy materialization 位於：

- `src/utils/collectableWasmSolver.ts`
- `src/utils/collectableWasmPolicy.ts`

worker 接線位於：

- `src/workers/collectableSolver.worker.ts`

建置與 benchmark 指令：

- `npm run wasm:collectable:build`
- `npm run bench:collectable-wasm`

目前 worker 會優先走 WASM；一般 WASM 載入或執行失敗時 fallback 到原 TS solver。若失敗原因是 WASM memo table 容量不足，worker 不再 fallback 到 JS solver，因為 JS 路徑在高壓案例會用更多 heap，對手機與低記憶體裝置更危險。

## 效能觀察

### 實際黑鐵礦案例 memo 使用量

使用截圖案例重跑 WASM core：

- 物品：收藏用黑鐵礦，Glv 700
- 玩家：Lv 100，獲得力 2000，鑑別力 5173
- GP：開始 930，最大 930
- 節點耐久：6
- 遺物工具效果：關閉
- reward score：低 107，中 124，高 140

目前採用直接成功率剪枝後的結果：

- `2^20` memo table 不足，會觸發容量 guard。
- `2^21` memo table 可完成。
- memo capacity：`2,097,152`
- 85% guard 前可用約 `1,782,578` entries。
- 實際 `statesSolved`：`1,067,620`
- `memoHits`：`8,125,572`
- `branchCount`：`10,391,966`
- WASM memory：約 `274MB`
- root action：`successIII`

同樣耐久 6 但獲得力 5345、成功率 100%、Scour 200 的案例只需要 `112,585` states，`2^20` memo table 即可完成，WASM memory 約 `138MB`。因此耐久不是唯一的容量指標，不能只用耐久決定初始 table。

曾經短暫測試過 dominance-safe 成功率剪枝。它比較能保留未補滿但省 GP 的候選，但同一個黑鐵礦案例會需要 `2^23` 才能完成，WASM memory 約 `1,090MB`，實際 `statesSolved` 約 `3,986,919`。使用者最後決定回到直接剪枝，以換取更低 memo 壓力，即使這會破壞習慣的強烈度或改變等價策略樹。

目前採動態容量策略：小案例從 `2^20` 或 `2^21` 開始；若容量 guard 觸發，改用 fresh WASM instance 重試下一級。手機或低記憶體裝置上限維持 `2^21`，桌面級裝置最多可重試到 `2^23`。這樣小案例不會先吃下大型 table，高強度桌面案例仍有擴張空間。

1000 萬組快取不適合做預設容量。因為 table capacity 必須採 power-of-two，至少要 `2^24 = 16,777,216` entries。依 `2^20` 約 138MB、`2^21` 約 274MB、`2^22` 約 546MB 推估，`2^24` 約會到 `2.1GB` 級別，對手機與一般瀏覽器 tab 風險過高。

### stash POC 重現

隔離 worktree 中重現 stash POC 時，慢案例約略結果：

- TS solver：約 32 秒，heap 約 3GB
- WASM core：約 0.65 秒
- 但舊 POC 的 WASM policy materialization 約 11 秒

這說明最初 POC 的主要價值在「WASM DP/memo core」；主要問題在於它之後用 TS 重新遞迴 reconstruct policy，幾乎把一部分速度吃回去了。

### 整合後 benchmark

正式收斂後的 benchmark 範例：

- 慢案例 TS：約 7.7 秒，JS heap 增量約 830MB
- 慢案例 WASM full solve：約 0.38 秒，JS heap 增量約 8.4MB
- benchmark 直接 core 使用 `2^22` memo table，因此該 run 的 WASM memory 約 `546MB`；正式 wrapper 仍會依案例從較小容量開始。
- `expectedScore` match：`51.64761`

這裡的 TS 已經包含本輪先前加入的等價剪枝與 key packing，所以 WASM 對「已優化 TS」仍有明顯改善。

## 等價剪枝現況

目前 TS solver 有成功率補正的等價剪枝：

- `src/utils/collectableSolver.ts`
- 函式：`addCollectSuccessActions`
- 邏輯：如果某些成功率補正技能都能把成功率補到上限，只保留能達上限的候選，不再枚舉所有較弱補正。

WASM core 也有對應邏輯：

- `assembly/collectableSolverCore.ts`
- 變數：`successNeeded`、`canCapWithIII`、`canCapWithII`、`canCapWithI`、`canCapWithNext`

重要注意：這種剪枝對 score 是等價的，但不一定對「決策樹外觀 / skill habit tie-break」等價。若舊 solver 會在同分情境中偏好某個較早或較自然的技能，剪枝可能讓那個候選從搜尋中消失，最後產生不同樹。

本輪決策：收藏品求解器接受這個差異。剪枝的目的優先於維持剪枝前的習慣形狀；habit preference 只在 objective score、GP 花費、action count、node count 都相同後才比較。一般採集 solver 若要導入類似剪枝，必須先取得同樣決策，不能預設使用者也接受樹形差異。

## 決策樹差異案例

使用者提供兩份匯出：

- `收藏用黑鐵礦 - 匯出決策樹 - 2026-05-23.json`
- `收藏用黑鐵礦 - 匯出決策樹 - 2026-05-23 (1).json`

兩份結果的數值完全一致：

- `expectedScore`: `124.17124`
- `minScore`: `114`
- `maxScore`: `380`
- 分布：
  - `114`: `97.46984725%`
  - `152`: `2.4988055%`
  - `190`: `0.03134725%`

但樹不同：

- 第一份：`calculationTime 64680ms`，`nodeCount 75`
- 第二份：`calculationTime 813ms`，`nodeCount 63`
- 第一份 states / branches：
  - `statesSolved 4316554`
  - `branchCount 40847425`
- 第二份 states / branches：
  - `statesSolved 1067620`
  - `branchCount 10391966`

具體差異點：

- 狀態：`730|6|0|1|0|0|0|0|0|0|0|0|0|0|0`
- 第一份推薦：`scour`
- 第二份推薦：`successIII`
- 兩者該節點 expectedScore 都是 `114.97337`

判斷：這不是 reward/math 錯誤，而是同分下的 action selection / tie-break / 剪枝造成的 policy tree 差異。本輪最後接受第二種較小樹與較低 memo 壓力的方向；root action 可因直接剪枝變成 `successIII`，只要 summary、分布與 reward/tier counts 維持一致即可。

## 三種 solver mode 現況

收藏品 solver 的三種模式：

- 一般人：`expected`
- 天選人：`max`
- 保守人：`min`

目前 WASM wrapper 接受三種模式，並映射到 WASM objective mode：

- `expected -> 0`
- `min -> 1`
- `max -> 2`

相關檔案：

- `src/utils/collectableWasmSolver.ts`
- `assembly/collectableSolverCore.ts`

已新增 unit test 檢查三種模式的 summary parity：

- `src/utils/collectableWasmSolver.test.ts`

但這裡的測試目前主要保證 summary parity，不等於完整匯出 policy tree parity。

## 權重檔與評分偏好

WASM core 不直接理解「權重檔」或 objective preset。正確資料流如下：

1. TS wrapper 使用現有 `scoreCollectability()` 將 reward table 的低 / 中 / 高門檻換成 scalar score。
2. WASM 只拿這三個分數做 DP/memo/action selection。
3. TS policy/evaluation 層沿著 WASM 選出的 policy 重新跑 branch。
4. 遇到成功採集時，TS 用原始 `state.collectability` 和 `rewardTable` 呼叫：
   - `getCollectableRewardForValue()`
   - `getCollectableTierCountForValue()`
5. 因此 reward 與 tier counts 不是從 score 反推，而是從原始 collectability 門檻重新計算。

這代表目前可支援既有 preset 與自定義權重，只要它能在現有 `CollectableObjective` 模型中被壓成每個 reward tier 的 scalar score。

限制：

- 若未來 objective 需要依「路徑形狀」或「第 N 次採集」給不同權重，只有三檔 scalar score 就不夠。
- 若 reward table 不再是低 / 中 / 高三檔，而是任意多檔，WASM 介面需要改成傳入 tier arrays，而不是固定三檔參數。

## 為什麼 WASM 適合收藏品 solver

收藏品 solver 的慢點主要在：

- 大量狀態搜尋
- memo lookup
- branch 展開
- state object 複製與 Map key 建立
- outcome 分布合併

WASM 的優勢剛好符合前幾項：

- 固定欄位 state 可 packed 成整數 key
- 使用 typed/static array 做 open-addressing memo
- 避免大量 JS object allocation
- 遞迴 DP 只處理數值與 action id

但 WASM 不適合承擔全部工作：

- i18n action name
- policy tree export format
- reward object / items map
- user-facing debug shape
- future UI-oriented metadata

目前比較合理的架構是：

- WASM：DP / memo / objective score / best action / search counters
- TS：request parsing / reward table / objective preset / policy materialization / export / debug / fallback

## 對一般採集 solver 的遷移建議

一般採集 solver 也可能適合 WASM，但建議不要直接照搬收藏品 core。先做以下檢查。

### 1. 找出一般採集 solver 的真實熱點

先跑 profiling / benchmark，確認慢點是不是：

- state object allocation
- Map key / memo lookup
- branch enumeration
- outcome distribution merge

如果一般採集 solver 的狀態空間比收藏品小很多，WASM 的維護成本可能不划算。

### 2. 先建立 golden scenario

至少要有：

- 一般人 / 天選人 / 保守人三模式
- 有 Revisit 與無 Revisit
- 高 GP / 低 GP
- 高成功率 / 低成功率
- 有 node bonus / 無 node bonus
- 極端長時間案例

驗收不應只看總值，還要看：

- `expectedYield`
- `minYield`
- `maxYield`
- `minYieldChance`
- `maxYieldChance`
- outcome distribution
- root action
- 完整匯出 policy tree
- debug counters 是否合理

### 3. 先抽出 shared oracle

不要讓 WASM 和 TS 各自維護一份難以對照的 tie-break。建議先把 TS solver 中以下語意抽成可以被測試描述的規則：

- action ordering
- equal-score tie-break
- GP spending preference
- skill habit preference
- policy tree materialization rule

然後 WASM 必須照這份規則輸出 action，不只是輸出 score。

### 4. 先定義「score 等價但樹不等價」是否可接受

收藏品案例已經證明：等價剪枝可以大幅加速，但會改變樹。

一般採集若要使用剪枝，需要分兩層：

- `score-safe pruning`：只保證總值不變
- `tree-safe pruning`：保證同分 tie-break 與匯出樹也不變

本輪收藏品求解器選擇讓 `score-safe pruning` 進正式 solver path，原因是它能把黑鐵礦慢案例的 memo 需求從約 `2^23` / `1.09GB` 降回 `2^21` / `274MB`。普通採集移植前要先確認使用者是否接受同樣取捨；若不接受，就必須改採 tree-safe pruning 或把 score-safe pruning 限制在實驗模式。

### 5. 先做 WASM core，不急著把全部輸出搬入 WASM

一般採集也建議維持 hybrid：

- WASM 回傳最佳 action 與必要 scalar 指標
- TS 用原本機制重建使用者可讀 policy、debug、匯出格式

這樣比較能保留既有網站行為，也降低後續 i18n / UI 變更成本。

## 下一步建議

收藏品 solver 繼續收斂：

1. 用使用者提供的黑鐵礦兩份匯出作為 regression fixture，重點驗證 summary、distribution、reward/tier counts 與 memo counters。
2. 若未來改變剪枝策略，重新跑黑鐵礦案例確認 `2^21` 是否仍可完成。
3. 保留 TS/WASM summary parity 測試；對等價 root action 差異採寬鬆驗收。
4. 在 debug/export 中標示 solver engine，例如 `wasm-core` / `ts-core`，方便未來追查。
5. 若要重新追求完整 policy tree parity，必須先接受 memo/時間成本可能大幅上升。

一般採集 solver 評估：

1. 先寫 benchmark，不直接搬。
2. 對比目前 TS 在長案例的時間與 heap。
3. 如果慢點同樣是 memo + object allocation，再建立 AssemblyScript core POC。
4. 第一版 POC 只允許用來產生 score/action，不改正式 UI。
5. 等完整 summary + policy tree parity 過關後再接 worker。

## 結論

收藏品 solver 的 WASM 遷移方向是成立的，且效能改善幅度足以抵消維護成本。但目前不能只用「期望值 / 分布 / 極值 match」宣告完全完成；完整決策樹 parity 還需要補強。

一般採集 solver 是否值得搬 WASM，應以同樣標準評估：先證明熱點相同，再明確決定 score-safe pruning 與 tree-safe pruning 的產品契約，最後才建立 oracle / golden 測試並接正式網站路徑。
