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

### 2026-05-24 使用者決策

後續評估與 POC 必須把下列決策視為正式限制，不是可選建議：

- **Rotation 樣貌完全不變是硬門檻**：一般採集 WASM 路徑不只要 match `expectedYield`、`minYield`、`maxYield`、端點機率與 outcome distribution，也必須讓 `bestRotation` 與 `rotationPlans` 的 action 順序、Revisit plan 與使用者看到的 rotation 樣貌完全維持現有 TS solver 行為。若 WASM 只達到數值 parity 但 tie-break 產生不同 rotation，不可接入正式 worker。
- **GP 4095 範圍必須被完整處理**：雖然 `GP 2000`、`GP 4000` 這類數值近年玩家幾乎不會在真實裝備中遇到，但目前網頁輸入限制允許到 `4095`，因此一般採集 WASM 架構必須能受控處理這個範圍。可以透過 memo capacity guard、受控錯誤、或使用者確認後升級記憶體重跑；不可讓頁面、worker 或瀏覽器直接 OOM。
- **分階段推進並留下交接文件**：若完整遷移會超出單一 session 的 context window，應拆成 benchmark/golden corpus、WASM POC、parity audit、worker/UX integration 等階段。每一階段都要在本報告或專門 roadmap 留下可追蹤的輸入、輸出、未完成風險與下一步，讓其他 agent session 可以接續。
- **記憶體行為沿用收藏品一致模式**：一般採集即使多數案例不需要收藏品那麼大的 memo table，也應採同一套可維護策略。手機與桌面使用相同的起始/支援容量判斷模式，並提供與收藏品一致的「使用者手動確認後升級記憶體重跑」功能。memo capacity exhaustion 應視為受控狀態，不應因容量不足自動 fallback 到更高壓的 JS 路徑硬算。

本輪臨時 benchmark 也支持遷移必要性：在不改 source code 的 Node 臨時載入測試中，`獲得力 2000 / GP 2000 / 耐久 6` 的 TS solver 約 4.3 秒、`statesSolved` 約 930k；`獲得力 2000 / GP 4000 / 耐久 4` 約 17.3 秒、`statesSolved` 約 2.98M；`GP 4000 / 耐久 5 或 6` 會在約 4GB heap 附近 OOM。這不是正式瀏覽器 benchmark，但足以證明長跑案例打到 JS object / string-key memo 的弱點。

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
- `bestRotation` 與 `rotationPlans` 完整 action 序列
- Revisit plan 的存在與順序
- debug counters 是否合理

因 2026-05-24 已決定 rotation 樣貌完全不變是硬門檻，golden scenario 必須保存完整 rotation 序列。若未來新增匯出 policy tree 或研究者 JSON，也應同步保存可 diff 的輸出。

長跑 golden scenario 至少要納入：

- 預設裝備附近的常規案例。
- `獲得力 2000 / GP 2000`。
- `獲得力 2000 / GP 4000`。
- GP 接近目前輸入上限 `4095`。
- 上述案例各自覆蓋耐久 4、5、6 或更高 node bonus 的差異。

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

但與收藏品不同，一般採集第一版正式接線前必須證明 TS materialization 後的完整 rotation 序列與既有 TS solver 一致。若 WASM core 只提供分數而無法可靠還原相同 tie-break，必須讓 WASM 回傳足夠的 best-action / tie-break metadata，或暫停接入正式 UI。

### 6. Memo capacity 與 UX 契約

一般採集 WASM memo capacity 應沿用收藏品路徑的維護模式：

- 依裝置能力與 heap 訊號選擇支援上限。
- 小案例從較小 table 起跑，容量不足時用 fresh WASM instance 嘗試下一級。
- 手機或低記憶體裝置不可無限制升級。
- memo capacity / allocation failure 回傳受控錯誤。
- 使用者可在明確警告與確認後手動升級記憶體重跑。
- 若失敗原因是 memo capacity，不應自動 fallback 到 JS solver，因為 JS 路徑在長跑案例可能用更多 heap。

### 2026-05-24 第一階段 POC 交接

文件門檻已先單獨提交：

- Commit：`010f1f1 Docs: 記錄一般採集 WASM 遷移門檻`

目前程式 POC 已開始，但截至本段交接文字寫入時仍是未提交狀態。相關檔案：

- `assembly/regularGatheringSolverCore.ts`：一般採集 AssemblyScript core POC。第一版只處理 primary plan 的 DP / memo / objective score / root action / search counters。
- `src/wasm/regular-gathering-solver-core.wasm`：由 `npm run wasm:regular:build` 產出的 WASM binary，若修改 `assembly/regularGatheringSolverCore.ts` 必須同步重建並提交。
- `src/utils/regularGatheringWasmSolver.test.ts`：Node/Vitest 載入 WASM binary，對照現有 `solveGatheringRotation()` 的 primary plan summary。
- `package.json`：新增 `wasm:regular:build` script。
- `.gitignore`：忽略 `scratch/regular-gathering-solver-core.wat`。

這一階段已完成的驗證：

- `npm run wasm:regular:build`
- `npm run test:unit -- src/utils/rotationSolver.test.ts src/utils/algorithmGoldenScenarios.test.ts src/utils/regularGatheringWasmSolver.test.ts`
- `npm run build`
- `npm run test:unit`，當時結果為 `29 passed / 198 passed`

目前 POC 驗收範圍：

- no-skill golden case 的 primary plan summary 與 root action。
- 下一次採集獲得量技能 case 的 primary plan summary 與 root action。
- `expected` / `min` / `max` 三種 objective mode 的 primary `expectedYield`、`minYield`、`maxYield` 與 objective scalar。
- GP 接近目前輸入上限 `4095` 的 packed-key 路徑，避免重走舊 10-bit GP 寬度問題。

目前明確未完成、不可誤判為正式遷移完成：

- 尚未新增正式 `src/utils/regularGatheringWasmSolver.ts` wrapper。
- 尚未接入 `src/workers/solver.worker.ts`，也尚未改 UI；玩家路徑仍走既有 TS solver。
- 尚未 materialize 完整 `bestRotation` / `rotationPlans`，測試目前只驗 primary summary 與 root action。
- 尚未保存完整 outcome distribution parity。WASM POC 目前沒有輸出 distribution map，因此不能用它替代正式 solver。
- 尚未把 TS solver 的 `rotationPreferenceScore()`、`wholeNodeBeforeNextOnlyScore()`、`comboPreferenceScore()`、`restoreIntegrityHabitScore()` 與 Revisit plan 規則抽成 shared contract。
- 尚未建立正式 benchmark suite；目前只有前述臨時 benchmark 與 POC parity 測試。
- 尚未實作一般採集 memo capacity error class、裝置容量選擇、手動高記憶體重跑 UX。

下一位 agent 建議接續順序：

1. 先檢查工作樹，確認上述 POC 檔案是否仍未提交；若要提交，請只提交程式 POC 範圍，不要混入無關變更。
2. 第一批 TS tie-break 契約已補在下方；後續若再擴充一般採集 WASM POC，必須持續把新發現的 rotation shape 案例寫成 contract，而不是只比 summary。
3. 讓 WASM core 暴露足夠的 per-state best-action metadata，或在 TS wrapper 中沿 WASM core selection 重建完整 `bestRotation` / `rotationPlans`。
4. 補完整 rotation parity corpus：低 GP / 高 GP、Revisit / no Revisit、node bonus、低成功率、高 boon、GP 2000 / GP 4000 / GP 4095 與耐久 4/5/6。
5. 只有在完整 rotation parity 通過後，才開始接 `solver.worker.ts`；接線時沿用收藏品 memo capacity / manual escalation UX，不要在 capacity exhaustion 時自動 fallback 到 JS 長跑。

### 2026-05-24 TS rotation 契約測試

已新增 `src/utils/regularGatheringRotationContract.test.ts`，把正式 worker 接線前不可改變的 TS rotation 樣貌先固定成 regression contract。這組測試刻意檢查完整可見手法，而不是只檢查 summary：

- next-only action 前移：同分時 `高產II` 必須排在採集前段。
- 全域 buff 優先與 combo habit：`沃土的饋贈II`、`沃土的饋贈I`、`諾菲卡福音` 必須在下一次採集技能前完成，且饋贈與福音相鄰。
- `restore` / `wise` habit：90 級以上觸發 `石工之理` 後，`理智同興(若觸發)` 必須跟在後面，並保留理智觸發採集標記。
- Revisit plan：GP 不滿時必須保留 primary 與 revisit 兩組 `rotationPlans` 的完整順序。
- `min` / `max` 模式：同分時仍應偏好短 rotation，不為相同極值多塞成功率技能。

驗證指令：

- `npm run test:unit -- src/utils/regularGatheringRotationContract.test.ts src/utils/regularGatheringWasmSolver.test.ts src/utils/rotationSolver.test.ts src/utils/algorithmGoldenScenarios.test.ts`

下一步應先讓一般採集 WASM POC 能輸出或重建足夠資訊來通過這組完整 rotation contract，再擴大 GP 2000 / GP 4000 / GP 4095 與耐久 4/5/6 的 parity corpus。若 WASM summary 仍 match 但上述 rotation contract 有任何差異，仍不可接入 `src/workers/solver.worker.ts`。

#### 交接快照

截至 2026-05-24 本段寫入時，這輪工作只新增 contract 與文件交接，沒有接正式 worker，也沒有修改玩家路徑。下一位 agent 可直接從下列狀態接續：

- 新增檔案：`src/utils/regularGatheringRotationContract.test.ts`。
- 延續上一階段未提交 POC 檔案：`assembly/regularGatheringSolverCore.ts`、`src/utils/regularGatheringWasmSolver.test.ts`、`src/wasm/regular-gathering-solver-core.wasm`。
- 延續上一階段設定變更：`package.json` 新增 `wasm:regular:build`、`.gitignore` 忽略 `scratch/regular-gathering-solver-core.wat`。
- 文件更新：本報告已記錄第一階段 POC 交接、TS rotation contract，以及下一步必須先補完整 rotation parity 的限制。

本輪已通過驗證：

- `npm run test:unit -- src/utils/regularGatheringRotationContract.test.ts src/utils/regularGatheringWasmSolver.test.ts src/utils/rotationSolver.test.ts src/utils/algorithmGoldenScenarios.test.ts`：`4 passed / 28 passed`。
- `npm run test:unit`：`30 passed / 203 passed`。
- `npm run build`：通過，僅保留既有 Vite chunk size warning。
- `npm run wasm:regular:build`：通過，會產生被 `.gitignore` 忽略的 `scratch/regular-gathering-solver-core.wat`。

建議下一步不要先接 `src/workers/solver.worker.ts`。應先做下列其一：

1. 讓 WASM POC 暴露或記錄每個 state 的 best action，並在 TS 側嘗試 materialize 完整 `bestRotation` / `rotationPlans`。
2. 把 `regularGatheringRotationContract.test.ts` 的案例加入 WASM parity 測試，先確認完整 rotation shape 能 match。
3. 擴充 parity corpus 到 GP 2000 / GP 4000 / GP 4095、耐久 4/5/6、低成功率、高 boon 與 Revisit / no Revisit 案例。

若遇到 summary match 但 rotation 不同，請先回到 TS tie-break 契約或 WASM best-action metadata，不要用寬鬆 root-action 驗收取代這裡的可見手法硬門檻。

### 2026-05-24 WASM POC rotation materialization

接續前段交接後，第一批一般採集 WASM POC 已往「完整可見手法 parity」推進一步，但仍未接正式 worker。

本輪新增 / 調整：

- `assembly/regularGatheringSolverCore.ts`：memo result 額外保存 `firstGatherIndex`，用來在同 objective score、同 habit score 時模擬 TS `rotationPreferenceScore()` 裡最重要的「延後第一個採集」偏好。這修正了 `石工之理` / `理智同興` contract 案例中 WASM summary match 但 rotation shape 不同的問題。
- `assembly/regularGatheringSolverCore.ts`：新增 POC metadata export：
  - `getExpectedYieldForState()`
  - `getMinYieldForState()`
  - `getMaxYieldForState()`
  - 既有 `getBestActionForState()` 現在被測試實際用於沿 WASM memo 重建手法。
- `src/utils/regularGatheringWasmSolver.test.ts`：新增測試側 materializer，沿 WASM `bestAction` 與共用 `regularGatheringMechanics` 重建 primary rotation，並把 `regularGatheringRotationContract.test.ts` 的案例納入 WASM parity。
- Revisit 檢查已納入：當 TS solver 產生 primary + revisit 兩組 `rotationPlans` 時，測試會分別用 temporary GP 與 full GP 跑 WASM POC，確認兩組可見手法順序都 match。

本輪已通過驗證：

- `npm run wasm:regular:build`
- `npm run test:unit -- src/utils/regularGatheringWasmSolver.test.ts`：`1 passed / 6 passed`
- `npm run test:unit -- src/utils/regularGatheringRotationContract.test.ts src/utils/regularGatheringWasmSolver.test.ts src/utils/rotationSolver.test.ts src/utils/algorithmGoldenScenarios.test.ts`：`4 passed / 30 passed`

仍然不可誤判為正式遷移完成：

- materializer 目前只存在於 Vitest POC，不是 production wrapper。
- 還沒有正式 `src/utils/regularGatheringWasmSolver.ts`。
- 還沒有接 `src/workers/solver.worker.ts` 或 UI。
- WASM core 仍未輸出完整 outcome distribution map；目前 rotation materialization parity 不等於 distribution parity。
- `firstGatherIndex` 只是第一批 TS rotation preference contract 的最小 metadata。若後續 GP 2000 / GP 4000 / GP 4095、耐久 4/5/6、低成功率、高 boon 或更複雜 combo 案例出現 rotation mismatch，必須繼續把 TS tie-break 規則補成可測試 contract，不可用現有 6 個 WASM POC 測試代表全覆蓋。

#### Tie-break / habit parity 硬約束

使用者已確認：一般採集 WASM 遷移中，**習慣規則解出一致手法是正式接線前的硬約束，必定要完成**。這不是 polish、建議或可延後的 UX 細節。

具體限制：

- 只讓 `expectedYield`、`minYield`、`maxYield`、root action 或 summary parity 通過不夠。
- WASM 必須在同分、同資源或多條等價路徑時，依既有 TS solver 的 action ordering、equal-score tie-break、GP spending preference、skill habit preference、combo preference、Revisit plan materialization 規則，解出同一組使用者可見 `bestRotation` 與 `rotationPlans`。
- 若 WASM 的 scalar score 與 TS 完全一致，但手法順序不同，仍視為未通過正式接線門檻。
- 若現有 metadata 不足以重現 TS 習慣規則，必須補 WASM best-action / tie-break metadata，或先抽出 shared contract；不可用「分數相同所以可接受」替代。
- 後續每新增一類 tie-break 修正，都必須補對應 contract / parity case；直到高 GP、低 GP、GP `2000 / 4000 / 4095`、耐久 `4 / 5 / 6`、低成功率、高 boon、node bonus、Revisit / no Revisit、`expected / min / max` 等代表性案例都能保持完整可見手法一致，才可討論 `src/workers/solver.worker.ts` 正式接線。

目前進度結論：

- 已完成：第一批 TS rotation contract 的 primary rotation parity。
- 已完成：一個 primary + Revisit 代表案例的兩組 `rotationPlans` parity。
- 尚未完成：所有 tie-break / habit 規則的完整覆蓋與正式 wrapper 化。
- 下一步優先順序：擴大 WASM parity corpus，並把 `rotationPreferenceScore()`、`wholeNodeBeforeNextOnlyScore()`、`comboPreferenceScore()`、`restoreIntegrityHabitScore()` 與 Revisit materialization 規則逐步固化成可測試契約。

### 2026-05-24 WASM parity corpus / distribution gate

本輪完成一般採集 WASM POC 的前三個門檻，仍未接 `src/workers/solver.worker.ts`，也未新增 production wrapper。

新增 / 調整：

- `assembly/regularGatheringSolverCore.ts`：memo result 從只保存 `firstGatherIndex`，擴充為可重現 TS `rotationPreferenceScore()` 的 metadata：`firstNextOnlyIndex`、whole-node-before-next-only score、next-only score、gift / tidings combo metadata 與完整 rotation preference score。這修正了 `GP 4095 / 耐久 6` 案例中 WASM 分數一致但過早插入 `石工之理` 的 rotation mismatch。
- `src/utils/regularGatheringWasmSolver.test.ts`：測試側 materializer 不只重建 rotation，現在會沿 WASM `bestAction` 與共用 `regularGatheringMechanics` 重建每個 plan 的 outcome distribution，並驗證：
  - `bestRotation` / `rotationPlans` 的 action 順序完全等於 TS solver。
  - plan-level `expectedYield`、`minYield`、`maxYield`、`minYieldChance`、`maxYieldChance` 等於 TS。
  - plan-level distribution 的每個 yield bucket 與 probability 等於 TS debug output。
  - distribution probability sum 約等於 1。
  - Revisit combined distribution 的 expected / min / max 與端點機率等於 TS top-level summary。
- `src/wasm/regular-gathering-solver-core.wasm`：已由 `npm run wasm:regular:build` 依新的 AssemblyScript core 重建。

本輪 parity corpus 已覆蓋：

- GP：`2000`、`4000`、`4095`。
- 耐久：`4`、`5`、`6`。
- 低成功率：`獲得力 520 / base 1000` 與 `獲得力 280 / base 1000` 案例。
- 高 boon：`perception 1500 / base 1000`，以及 node `extraRate` 推高 boon 的案例。
- node bonus：`gatheringCount`、`yieldCount`、`extraRate` 都有覆蓋。
- Revisit / no Revisit：包含 Lv 91+ temporary GP 未滿的 primary + revisit 兩 plan，以及 Lv 89 / Lv 81 / Lv 10 的 no Revisit 案例。
- objective mode：`expected`、`min`、`max` 都有覆蓋。

本輪已通過驗證：

- `npm run wasm:regular:build`
- `npm run test:unit -- src/utils/regularGatheringWasmSolver.test.ts`：`1 passed / 7 passed`
- `npm run test:unit -- src/utils/regularGatheringRotationContract.test.ts src/utils/regularGatheringWasmSolver.test.ts src/utils/rotationSolver.test.ts src/utils/algorithmGoldenScenarios.test.ts`：`4 passed / 31 passed`
- `npm run test:unit`：`30 passed / 206 passed`
- `npm run build`：通過，僅保留既有 Vite chunk size warning。

仍未覆蓋 / 仍有風險：

- outcome distribution parity 目前是在 Vitest materializer 內沿 WASM best-action metadata 重建，不是 WASM core 直接匯出 distribution map；正式 wrapper 若要提供 debug/export，仍要把這段 materialization 正式化並維持同樣測試。
- corpus 已覆蓋代表性門檻，但不是 GP / 耐久 / node bonus / objective 的完整笛卡兒積。特別是高 GP + 高耐久 + 低成功率 + Revisit 的極端長跑案例仍可能接近 TS heap 風險，應放 benchmark 或 capacity 測試，不宜全部塞進預設 unit test。
- memo capacity guard 仍是 POC 型態，尚未有一般採集專用 error class、fresh instance 升級策略、裝置上限判斷或手動高記憶體重跑 UX。
- `regularGatheringWasmSolver.test.ts` 中的 materializer 仍是測試 helper，不是 production `src/utils/regularGatheringWasmSolver.ts`。

下一步：

1. 把測試側 materializer 收斂成正式 `src/utils/regularGatheringWasmSolver.ts` wrapper，但仍先不要接 worker。
2. 在 wrapper 層建立 memo capacity error / retry contract，沿用收藏品 memo capacity 的分類方式。
3. 補正式 benchmark suite，把高 GP + 高耐久 + 低成功率 + Revisit 的長跑壓力案例移到 benchmark / diagnostic，而不是拖慢預設 unit test。
4. wrapper 通過同一批 rotation + distribution parity 後，才討論 `src/workers/solver.worker.ts` 接線。

### 2026-05-24 worker 接線前 audit 完成

本輪完成一般採集 WASM 遷移的「worker 接線前 audit」，仍未接 `src/workers/solver.worker.ts`，也未修改 UI 玩家路徑。

新增正式 wrapper：

- `src/utils/regularGatheringWasmSolver.ts`
  - 可由正式 app 路徑用 `fetch(...wasm?url)` 載入 `src/wasm/regular-gathering-solver-core.wasm`。
  - 測試與未來 worker 可直接注入 `RegularGatheringWasmCore` instance，避免在 Vitest / worker / browser 間綁死載入方式。
  - 呼叫 WASM `solvePlanObjective()` 後，沿 `getBestActionForState()` 與共用 `regularGatheringMechanics.ts` materialize `bestRotation` 與 primary / revisit `rotationPlans`。
  - materialization 會重建每個 plan 的完整 outcome distribution，再由 distribution 算出 `expectedYield`、`minYield`、`maxYield`、`minYieldChance`、`maxYieldChance`。
  - Revisit combined summary 使用與 TS solver 相同的公式：不觸發 Revisit 時使用 primary distribution；觸發時串接 primary + full GP revisit distribution，再依 Revisit 機率加權。
  - `debug.plans[].outcomeDistribution` 由 wrapper 正式輸出，不再只存在於測試 helper。
  - `debug.plans[].search` 會記錄 `memoCapacityPower`、`memoCapacity`、`memoCapacityUsable` 與 WASM counters。
  - `debug.optimality.stateKeyEngine` 標示為 `wasm-packed`，方便後續匯出 / debug 分辨 TS string key 與 WASM packed key。

Memo capacity / retry contract：

- 新增一般採集專用錯誤：
  - `RegularGatheringWasmMemoCapacityError`
  - `RegularGatheringWasmMemoryAllocationError`
- 若 WASM core 回報 `FAILURE_MEMO_CAPACITY`，wrapper 會丟出 `RegularGatheringWasmMemoCapacityError`。這是受控容量錯誤，不會自動 fallback 到 TS solver 長跑。
- 若 WASM startup / allocation / `unreachable` / `out of bounds` 等失敗發生在非 memo-capacity 路徑，wrapper 會歸類為 `RegularGatheringWasmMemoryAllocationError`。
- 本輪只建立 wrapper 層的容量分類與手動指定 `memoCapacityPower` / `supportedMemoCapacityPower` contract；尚未接 UI 的手動提高記憶體重跑，也尚未在 worker 裡做互動式 retry。
- 下一步接 worker 時，必須沿用收藏品路徑的原則：capacity exhaustion 回傳 typed error / typed worker response；若要提高 memo capacity，需由明確警告後的使用者動作觸發，不可暗中改走 TS solver 或無限制重試。

Benchmark / diagnostic 安排：

- 新增 `scripts/regular-gathering-wasm.bench.ts` 與 `npm run bench:regular-wasm`。
- 預設 unit parity corpus 保留代表性但可快速完成的案例：GP `2000 / 4000 / 4095`、耐久 `4 / 5 / 6`、低成功率、高 boon、node bonus、Revisit / no Revisit、`expected / min / max`。
- 長跑壓力案例不放入預設 unit test，而放在 benchmark / diagnostic：
  - `GP 4095 / 耐久 6 / 低成功率 / 高 boon / Revisit`
  - 使用 `2^22` memo table。
  - 本輪實測：primary `663,993` states / `1,951,070` branches，revisit `1,319,721` states / `3,883,278` branches，wrapper full diagnostic 約 `701ms`，WASM memory 約 `548MB`。
- 這類壓力案例適合用來驗證容量 guard、search counters、wrapper materialization 成本與未來 worker retry UX；不適合塞進一般 `npm run test:unit`，避免日常測試被高記憶體案例綁住。

Audit 結果：

- `src/utils/regularGatheringWasmSolver.test.ts` 已改成使用正式 `solveGatheringRotationWithWasm()` 執行完整 parity，不再只依賴測試側 materializer。
- audit 硬門檻已驗證：
  - `bestRotation`
  - `rotationPlans` action 順序
  - plan-level `expectedYield` / `minYield` / `maxYield`
  - `minYieldChance` / `maxYieldChance`
  - 每個 plan 的 outcome distribution bucket 與 probability
  - Revisit combined summary
  - `debug.combined`
- 若 WASM 分數一致但手法順序不同，測試仍會失敗；本輪沒有放寬 rotation shape 驗收。

本輪已通過驗證：

- `npm run wasm:regular:build`
- `npm run test:unit -- src/utils/regularGatheringWasmSolver.test.ts`
- `npm run test:unit -- src/utils/regularGatheringWasmSolver.test.ts src/utils/regularGatheringRotationContract.test.ts src/utils/rotationSolver.test.ts src/utils/algorithmGoldenScenarios.test.ts`
- `npm run bench:regular-wasm`

尚未完成、因此仍不可接 worker 的條件：

- `src/workers/solver.worker.ts` 尚未接線，下一步才可評估 worker message / typed error / manual memo escalation UX。
- UI 玩家路徑尚未改走 WASM，一般採集秘笈仍維持既有 TS solver。
- wrapper 已具備 capacity contract，但 worker / UI 尚未實作一般採集專用 typed error 顯示與使用者確認後提高記憶體重跑。
- 接 worker 前仍需再跑完整 `npm run test:unit` 與 `npm run build`，並確認 worker 接線不改變現有玩家路徑顯示與錯誤處理。

### 2026-05-24 第 2 階段：玩家路徑與錯誤 UX

本輪完成一般採集 WASM 遷移的「玩家路徑與錯誤 UX」接線。`src/workers/solver.worker.ts` 現在預設優先呼叫正式 `solveGatheringRotationWithWasm()` wrapper；只有非 memo / allocation 類的 WASM 載入或執行失敗才 fallback 到原本 `solveGatheringRotation()` TS solver。這保留一般採集玩家路徑可用性，但明確禁止把 memo capacity exhaustion 轉回 TS 長跑。

Worker typed error contract：

- `RegularGatheringWasmMemoCapacityError` 會被 worker 轉成 `{ errorType: 'memoCapacity', memoCapacityPower, nextMemoCapacityPower }`。
- `RegularGatheringWasmMemoryAllocationError` 會被 worker 轉成 `{ errorType: 'memoAllocationFailed', memoCapacityPower }`。
- 若使用者已經透過 warning gate 指定 `manualMemoCapacityPower`，但高記憶體路徑在完成前失敗，worker 會回 `memoAllocationFailed`，不再 fallback。
- `src/types/game.ts` 已新增 `SolverWorkerErrorType`、`SolverWorkerErrorResponse`、`SolverWorkerResponse`，並讓 `SolverRequest` 可攜帶 `manualMemoCapacityPower`。

UI / i18n error UX：

- `src/composables/useSolver.ts` 現在保留 `solverErrorDetail`，可區分 `memoCapacity`、`memoAllocationFailed`、`workerStale`、`workerFailed`。
- `src/views/Solver.vue` 的一般採集錯誤提示已沿用收藏品 memo capacity UX 的資訊架構：高層提示、縮小條件建議、明確風險提示、使用者點擊後才提高記憶體重跑。
- `tw / cn / en / ja` 四語系已同步新增一般採集專用 memory / capacity 文案，語氣與 `CollectableSolverPanel.vue` 的收藏品錯誤提示保持一致。
- 一般採集與收藏品使用相同的 warning gate 原則：memo capacity 可提供手動提高記憶體重跑；allocation failure 只顯示受控失敗，不提供默默升級或無限制重試。

Worker / UI parity audit：

- 新增 `src/workers/solver.worker.test.ts`，用正式 WASM wrapper 經 worker response path 驗證：
  - `bestRotation`
  - `rotationPlans` action 順序
  - plan-level `expectedYield` / `minYield` / `maxYield`
  - `minYieldChance` / `maxYieldChance`
  - 每個 plan 的 outcome distribution bucket 與 probability
  - Revisit combined summary
- `src/composables/useSolver.test.ts` 新增 UI/composable 層 memo capacity 測試，確認 `memoCapacity` 會成為受控錯誤，且只有使用者確認後才在下一次 request 帶 `manualMemoCapacityPower`。
- 若 WASM 分數一致但手法順序不同，worker test 仍會失敗；本輪沒有放寬 rotation shape parity。

本輪已通過驗證：

- `npm run wasm:regular:build`
- `npm run test:unit -- src/workers/solver.worker.test.ts src/composables/useSolver.test.ts`
- `npm run test:unit -- src/utils/regularGatheringWasmSolver.test.ts src/utils/regularGatheringRotationContract.test.ts src/utils/rotationSolver.test.ts src/utils/algorithmGoldenScenarios.test.ts src/workers/solver.worker.test.ts src/composables/useSolver.test.ts`
- `npm run test:unit`：`31 passed / 213 passed`
- `npm run build`：通過，僅保留既有 Vite chunk size warning。

Benchmark / diagnostic 觀察：

- 本輪未新增 benchmark 觀察；`scripts/regular-gathering-wasm.bench.ts` 與 `npm run bench:regular-wasm` 維持前一階段用途，仍建議把高 GP + 高耐久 + 低成功率 + Revisit 的壓力案例留在 benchmark / diagnostic，不放進預設 unit suite。

下一階段剩餘條件：

1. 2026-05-24 使用者已實際頁面確認一般採集成功求解、`memoCapacity` warning gate、`memoAllocationFailed` 受控顯示與收藏品錯誤 UX 視覺一致；此項不再視為 blocker。
2. 研究者匯出 / debug metadata 已補上 solver engine 線索：一般採集與收藏品 debug optimality 會標示 `engine: 'wasm-core' | 'ts-core'`，既有 `stateKeyEngine: 'wasm-packed'`、memo capacity 與 plan distribution 仍會透過 JSON 匯出保留，避免第三方驗證失去線索。
3. 使用者已有一組可踩 `memoCapacity` 上限的實際數值，暫時不需要另做專門 diagnostic hook；若未來補 diagnostic，也不要把高記憶體壓力案例塞進預設 unit test。
4. 若之後調整 WASM tie-break metadata、capacity selector 或 worker fallback policy，必須重跑 worker parity test；不能只跑 wrapper test 或 summary test。這項需繼續保留在待辦內供未來 agent 參考。

## 下一步建議

收藏品 solver 繼續收斂：

1. 黑鐵礦高分尾端消失問題已定位為先前不合理的成功率補滿剪枝造成，正式路徑已撤回該剪枝；目前不應再把它視為尚未修復的功能缺口。
2. 若未來重新改變剪枝策略，仍需用黑鐵礦案例確認 `304` / `342` primary 尾端與 `684` combined max 沒有消失，再討論 memo 容量成本。
3. 保留 TS/WASM summary parity 測試；對等價 root action 差異採寬鬆驗收。
4. 在 debug/export 中標示 solver engine，例如 `wasm-core` / `ts-core`，方便未來追查。
5. 若要重新追求完整 policy tree parity，必須先接受 memo/時間成本可能大幅上升。

一般採集 solver 評估：

1. 先寫正式 benchmark，不直接搬；把 `GP 2000`、`GP 4000`、接近 `4095` 與不同耐久案例納入。
2. 建立 golden scenario corpus，保存完整 `bestRotation`、`rotationPlans`、summary、outcome distribution 與 debug counters。
3. 把 TS solver 的 action ordering、equal-score tie-break、GP spending preference、skill habit preference 與 Revisit plan 規則整理成可測試契約。
4. 若 benchmark 確認慢點同樣是 memo + object allocation，再建立 AssemblyScript core POC。
5. 第一版 POC 只允許用來產生 score/action 與 memo stats，不改正式 UI。
6. 接入 worker 前必須通過完整 rotation parity；數值一致但 rotation 不同時，不可接入正式路徑。
7. 接線時沿用收藏品 memo capacity / 手動升級重跑 UX，並新增一般採集專用的受控 memo capacity error。

## 結論

收藏品 solver 的 WASM 遷移方向是成立的，且效能改善幅度足以抵消維護成本。但目前不能只用「期望值 / 分布 / 極值 match」宣告完全完成；完整決策樹 parity 還需要補強。

一般採集 solver 是否值得搬 WASM，應以同樣標準評估：先證明熱點相同，再明確決定 pruning 的正確性契約。若剪枝會移除可達尾端，即使 expected value 幾乎不變，也不應進正式網站路徑。
