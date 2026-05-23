# WASM 求解器遷移研究報告

日期：2026-05-23
範圍：收藏品求解器 WASM 遷移實驗，以及一般採集求解器是否適合採用同類架構的評估

## 摘要

收藏品求解器搬進 WASM 是值得繼續推進的方向。這次重現並整合 stash 中的 AssemblyScript POC 後，確認 WASM core 可以把特殊慢案例從 TS 路徑的數十秒等級壓到一秒內，且 JS heap 壓力大幅下降。

不過目前最重要的結論不是「WASM 已經完全安全」，而是：

- 數值輸出可以 match：期望值、極值、機率分布、reward、tier counts 都必須透過 TS oracle 測試對齊。
- 完整決策樹不一定會 match：等價分數下的 tie-break / skill habit 會因剪枝或 WASM action 選擇細節而改變。
- 2026-05-23 後續驗證撤回了「成功率補滿即剪掉較弱補強」的直接剪枝；高分尾端即使機率極低，也必須保留在分布中。
- skill habit 只能作為最後 tie-break，不能保護剪枝前的策略形狀，也不能排在 objective score、GP、action count、node count 之前。

下一步若要討論一般採集求解器搬 WASM，應該先明確定義該 solver 的 pruning contract：至少要保證完整 outcome distribution 與可達尾端不變；若 UI 也依賴完整匯出樹，還必須建立 policy tree golden diff。

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

曾採用直接成功率剪枝時的結果：

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

曾經短暫測試過 dominance-safe 成功率剪枝。它比較能保留未補滿但省 GP 的候選，但同一個黑鐵礦案例會需要 `2^23` 才能完成，WASM memory 約 `1,090MB`，實際 `statesSolved` 約 `3,986,919`。後續黑鐵礦匯出比對確認，直接補滿剪枝會移除 `304` / `342` 這類極低機率但可達的高分尾端，因此正式路徑不可使用這種剪枝。

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

這裡的 TS 當時仍包含本輪先前加入的成功率補強剪枝與 key packing；剪枝撤回後，效能數字需重新量測，WASM 對 object allocation 與 packed memo 的優勢仍是主要方向。

## 成功率補強剪枝現況

目前 TS solver 已撤回成功率補正的直接剪枝：

- `src/utils/collectableSolver.ts`
- 函式：`addCollectSuccessActions`
- 邏輯：只做合法性過濾；若仍可提高收藏品採集成功率，保留所有可用的成功率補強候選。

WASM core 也同步撤回對應剪枝：

- `assembly/collectableSolverCore.ts`
- 原先的 `successNeeded`、`canCapWithIII`、`canCapWithII`、`canCapWithI`、`canCapWithNext` 補滿判斷已移除。

重要注意：補滿成功率不是 dominance。較弱但便宜的補強技能可能省下 GP，讓後續多使用一次 `restoreIntegrity` / `wiseToTheWorld`，進而保留極低機率的更高分尾端。

本輪更新後的決策：收藏品求解器不接受會改變 outcome distribution 極值或高分尾端可達性的剪枝。未來若要重新加入效能剪枝，必須先證明 summary、完整分布與可達尾端不變，不能只看 expectedScore。

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

後續更完整的黑鐵礦案例證明：直接成功率補滿剪枝不只改變 policy tree，還會移除 `304` / `342` 這類極低機率但可達的 primary 高分尾端，combined max 也會從 `684` 降到 `532`。因此這類剪枝已撤回；不能只因 expectedScore 近似相同就隱藏可達路徑。

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

### 4. 先定義 distribution-safe pruning 契約

收藏品案例已經證明：只看 expected value 的剪枝可以大幅加速，但可能移除可達高分尾端。

一般採集若要使用剪枝，需要分兩層：

- `distribution-safe pruning`：保證 outcome distribution、min/max 與尾端可達性不變
- `tree-safe pruning`：保證同分 tie-break、匯出 policy tree 與 guided path 也不變

本輪收藏品求解器已撤回直接成功率補滿剪枝，因為它不是 distribution-safe。普通採集移植前也不能預設 expected value 近似相同就足夠；若剪枝會改變分布尾端，應限制在研究模式或不使用。

### 5. 先做 WASM core，不急著把全部輸出搬入 WASM

一般採集也建議維持 hybrid：

- WASM 回傳最佳 action 與必要 scalar 指標
- TS 用原本機制重建使用者可讀 policy、debug、匯出格式

這樣比較能保留既有網站行為，也降低後續 i18n / UI 變更成本。

## 下一步建議

收藏品 solver 繼續收斂：

1. 用使用者提供的黑鐵礦兩份匯出作為 regression fixture，重點驗證 summary、完整 distribution、reward/tier counts 與高分尾端可達性。
2. 若未來改變剪枝策略，重新跑黑鐵礦案例確認 `304` / `342` primary 尾端與 `684` combined max 沒有消失，再討論 memo 容量成本。
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

一般採集 solver 是否值得搬 WASM，應以同樣標準評估：先證明熱點相同，再明確決定 pruning 的正確性契約。若剪枝會移除可達尾端，即使 expected value 幾乎不變，也不應進正式網站路徑。
