# 收藏品求解器歷史研究紀錄

本文件用來保存 `frozen_rabbit_tome` 收藏品求解器、策略台與 WASM 遷移過程中已踩過的坑。它是歷史研究紀錄，不是 active roadmap；後續 Agent 若要改核心求解、策略分析、debug/export 或效能保護，可以先讀本文件避免重複走錯路。

若有新的研究結果，請追加新段落，並清楚標示：

- 日期。
- 當時症狀。
- 已驗證事實。
- 曾經誤判或撤回的方向。
- 仍然有效的維護規則。
- 後續應改讀哪一份 active 文件或測試。

目前 active 參考優先順序：

1. `.agents/skills/business/algorithm_verification.md`
2. `.agents/skills/business/gathering_math_formulas.md`
3. `.agents/skills/business/ffxiv_gathering_skills.md`
4. `.agents/skills/mission/product_architecture.md`
5. `.agents/roadmaps/shikhu-feedback-todo.md`

## 2026-05-19：收藏品策略樹分支爆炸研究

來源：已移除的 `.agents/skills/mission/collectable_strategy_branching_research.md`。

### 當時症狀

收藏品策略台初版用「由上而下套用規則」分析使用者自訂策略。使用者加入一條看似合理的 fallback 規則後，節點數快速抵達上限；另有低成功率收藏品案例曾讓求解台 out of memory。

當時的使用者策略大意是：

1. 前段用集中檢查、提煉、價值矚目等規則建立收藏價值。
2. 收藏價值達 850 以上後，用慎重提煉補刀。
3. 收藏價值達 1000 後，使用石工之理 / 理智同興 / 收藏品採集收尾。
4. 最後補上一條 fallback：收藏價值低於或等於 850 時使用提煉。

加入 fallback 前，策略台只剩少量待決策節點，例如 `GP 630 / 耐久 5 / 收藏價值 450 或 550`。直覺上這些狀態距離 850 只需要 1 到 2 次提煉，因此不能把爆炸簡化成「fallback 規則寫太寬」。

### 主要結論

真正的放大來源是隨機分支組合：

- 收藏品採集在成功率不是 100% 時會分成成功 / 失敗。
- 提煉會分出價值提升 / 未提升與洞察 proc。
- 慎重提煉會再加上耐久消耗 / 未消耗。
- 石工之理 / 理智同興不是無限循環，但會增加採集階段長度，讓低成功率採集分支被放大。

因此 fallback 規則本身不是唯一元凶；它只是把原本停止的 frontier 接回完整隨機流程。

### 當時提出但現在需重新解讀的方向

原研究建議：

- 求解台加防 OOM guard 與 debug telemetry。
- 策略台從 tree expansion 改為 state aggregation / DAG。
- 求解台拆開 DP 計算結果與 policy 展示。
- UI 分清「決策狀態數」與「隨機路徑數」。

這些方向在 WASM 遷移後已不能直接照舊理解：

- 收藏品求解器目前 worker 會優先走 WASM core。
- WASM memo capacity 或 memory allocation 失敗時，已可回傳受控錯誤。
- 高壓案例的 JS heap 壓力已大幅降低。
- `src/utils/collectableStrategyTree.ts` 已有 `nodeCache`，不再是當時描述的純樹狀遞迴。
- `src/utils/collectableWasmPolicy.ts` 已有 `visited` 與 `nodeLimit`，policy materialization 也不是完全沒有保護。

所以本研究不應再被當成「目前求解台仍未處理 OOM」的證據。若要處理現況，應改讀 `.agents/skills/business/algorithm_verification.md` 與現有 WASM tests。

### 仍然有效的踩坑規則

- 不要只看 raw path 數量；要分清 raw random paths、unique decision states、outcome distribution。
- 精確狀態合併不是啟發式剪枝。若兩條路徑抵達相同決策 state，且後續規則匹配與 action 結果完全相同，機率可以合併。
- 合併 key 不應包含 `path`、`depth` 或純 UI label；但如果有 `pendingActions`，它會影響後續決策，必須納入。
- 不能為了壓低節點數默默丟棄低機率尾端。後來黑鐵礦案例已證明，會移除 `304` / `342` primary 尾端或 `684` combined max 的剪枝不可進正式路徑。
- outcome distribution 必須與決策 state 分開思考；合併 state 時不能丟失已累積 reward / score。
- UI 文案不要暗示使用者策略一定寫錯。低成功率造成大量隨機路徑，是模型本身的複雜度，不一定是策略規則錯誤。

### 後續驗證若要補測

若未來再碰到策略台或求解器複雜度問題，建議補測：

- 低成功率連續採集時，unique decision state 是否顯著低於 raw path。
- 合併前後小案例 terminal state 機率總和是否一致。
- outcome distribution 機率總和是否約等於 100%。
- `expectedScore` 是否等於 distribution 加權平均。
- UI 是否能指出主要分支來源，例如 `collect` 的成功 / 失敗。

### 原型 stash 狀態

舊研究紀錄曾提到一個 stash：

- `stash@{0}`
- 訊息：`wip collectable strategy lab branching research`
- 內容包含 `Simulator.vue`、`CollectableStrategyLab.vue`、`collectableStrategyTree.ts`、`collectableStrategyTree.test.ts`

這個 stash 編號只代表當時本機狀態，後續 stash 操作可能已改變順序。若真的需要找回，應先用 `git stash list` 和 `git stash show --stat` 重新確認，不可假設 `stash@{0}` 仍是同一份。

## 2026-05-23：WASM 遷移後的新判斷

來源：2026-05-23 WASM 遷移整理，有效維護規則已收斂到 `.agents/skills/business/algorithm_verification.md`。

### 已驗證改善

收藏品 solver 搬到 WASM 後，主要 DP / memo 搜尋從 JS object-heavy 路徑移到 typed/static array 與 packed key，特殊慢案例的 JS heap 壓力大幅下降。worker 目前會優先使用 WASM；一般 WASM 載入或執行失敗時才 fallback 到 TS solver。

若 WASM memo table 容量不足，worker 不應 fallback 到 JS solver，因為 JS 路徑在高壓案例可能更危險。現況會回傳 memo capacity / allocation 類型錯誤。

### 仍然不能誤判的地方

WASM 只讓搜尋更能承受，不代表可以放寬正確性：

- 等價分數下，root action 或 policy shape 可能不同。
- skill habit 只能作為最後 tie-break，不能排在 objective score、GP、action count、node count 之前。
- 成功率補滿剪枝已撤回，因為它會移除極低機率但可達的高分尾端。
- 未來若要新增剪枝，必須證明 summary、完整 distribution 與可達尾端不變，不能只看 expectedScore。

### 後續應優先維護的驗證

- 保留 TS/WASM summary、distribution、reward / tier counts parity 測試。
- 對等價 root action 差異採寬鬆驗收，但要保留 debug 線索。
- 用黑鐵礦匯出案例做 regression fixture，確認 `304` / `342` primary 尾端與 `684` combined max 不會消失。
- 在 debug/export 中標示 solver engine，例如 `wasm-core` / `ts-core`。

## 2026-05-24：一般採集高 GP WASM materialization 診斷

來源：一般採集玩家路徑 WASM worker 接線後，使用者在手動提高 memo capacity 重跑時提供的極端案例截圖與本機 scratch 診斷。診斷只使用臨時 `scratch` / `src/__scratch__` 檔案，未修改正式 solver 邏輯。

### 當時症狀

一般採集案例：

- 物品：重蠑木原木，園藝師，`Glv 700` / `Lv 100`。
- 玩家：Lv 100，獲得力 `2060`，鑑別力 `4480`，開始 GP / 最大 GP `4058`。
- 食物：醬炒飯 HQ。
- 節點：基礎耐久 `6`，無額外採集次數、無獲得數增加、無額外率增加。
- 公式中間值：基礎採集成功率 `52%`，基礎額外採集率 `23%`。

`2^22` memo capacity 很快回報 capacity exhaustion；使用者手動提高到 `2^24` 後，worker 長時間沒有回來。初看容易誤判為 WASM core 本身仍在搜尋或進入死循環。

### 已驗證事實

精確案例在 `2^22` 下約 `1.47s` 撞 memo guard：

- `statesSolved`: `3,565,197`
- `memoHits`: `8,046,286`
- `actionsEvaluated`: `4,767,397`
- `terminalStates`: `1,096,638`
- `branchCount`: `12,708,120`
- WASM memory：約 `546MB`

但同一案例直接呼叫 WASM core `solvePlanObjective()`，不做 wrapper materialization 時，`2^23` 約 `1.95s` 就完成：

- `statesSolved`: `4,982,242`
- `memoHits`: `11,371,516`
- `actionsEvaluated`: `6,713,629`
- `candidateComparisons`: `6,713,629`
- `terminalStates`: `1,547,326`
- `branchCount`: `17,901,083`
- `expectedYield`: `89.47074218749998`
- `minYield / maxYield`: `48 / 131`
- `bestAction`: `successIII`
- WASM memory：約 `1,090MB`

所以這次 `2^23` / `2^24` 長時間不回來，主要不是 WASM DP core 解不完，而是 `src/utils/regularGatheringWasmSolver.ts` 在 core 完成後，用 TS wrapper 讀 memo 重建 `bestRotation` / `rotationPlans` / outcome distribution 時反覆展開同一批 policy state。

臨時診斷 core 加上 memo probe counter 後確認：

- state limit `4,950,000` 時仍可約 `2.05s` 回報。
- probe limit `100,000,000` 時耗時約 `30.3s`，但 `statesSolved`、`memoHits`、`actionsEvaluated`、`branchCount` 都停在同一組數字。
- 代表慢點發生在 materialization 查表 / 重建過程，不是新增搜尋 state 持續增加。

幾個 ablation 結果：

- GP `1000`：`82ms` 完成，`124,893` states。
- GP `2000`：`378ms` 完成，`925,671` states。
- GP `3000`：`2.17s` 完成，`2,506,791` states。
- GP `3500`：`2^22` 已撞 capacity。
- 同樣 GP `4058` / 耐久 `6`，拿掉 Lv90+ Wise proc（改成 Lv89）可在 `749ms` 完成。
- 同樣 GP `4058` / 耐久 `6`，讓 boon chance 變成 0 可在 `285ms` 完成。

結論：高 GP 給 `restore` / `wise` 很多展開空間；Lv90+ `restore` 的 Wise 50/50 分支、52% 成功率的失敗 / 成功分支、23% boon 分支會讓 policy graph 很大。WASM core 可以用 memo 解完，但 wrapper 若沒有 materialized-state memo 或 cycle/visited guard，重建完整分布時會重複走相同子圖。

### 曾經誤判或撤回的方向

- 不應把這次現象直接解讀成公式錯誤。截圖中的 `52%` / `23%` 與目前公式推導一致。
- 不應只用 memo capacity escalation 解釋。提高到 `2^23` 後 core 已可完成，但 wrapper 後段仍可能長時間卡住；`2^24` 只會增加記憶體壓力，不保證縮短時間。
- 不應在 memo capacity exhaustion 時 fallback 到 TS solver 長跑；這仍可能把高壓案例帶回更危險的 JS heap 路徑。
- 不應為了讓此案例快回來而放寬 rotation shape parity、只回 summary、或丟棄 outcome distribution 尾端。

### 仍然有效的踩坑規則

- 一般採集 WASM 診斷必須拆開「core solve」與「wrapper materialization」計時；只看 worker 總耗時會誤判瓶頸。
- 高 GP / Lv90+ Wise / 低成功率 / 非零 boon 的普通採集案例，可能不是 DP core 最慢，而是 rotation / distribution materialization 最慢。
- 若修 materialization，方向應是對 materialized policy state 做 memo / visited / DAG 化，並維持完整 rotation shape parity 與 outcome distribution parity；不能用 summary-only 或 heuristic pruning 取代。
- 手動提高 memo capacity 的 UX 可以保留 warning gate，但效能診斷不要把「更大 capacity」當成必然能完成的承諾。
- Benchmark / diagnostic 可以保留此類高壓案例，但不要塞進預設 unit test。

### 後續應改讀的 active 文件或測試

- `.agents/skills/business/algorithm_verification.md`
- `src/utils/regularGatheringWasmSolver.ts`
- `src/utils/regularGatheringWasmSolver.test.ts`
- `src/workers/solver.worker.test.ts`
- `scripts/regular-gathering-wasm.bench.ts`

## 後續追加格式

請用以下格式追加新研究：

```markdown
## YYYY-MM-DD：研究主題

來源：相關 issue / 對話 / 檔案 / commit。

### 當時症狀

### 已驗證事實

### 曾經誤判或撤回的方向

### 仍然有效的踩坑規則

### 後續應改讀的 active 文件或測試
```
