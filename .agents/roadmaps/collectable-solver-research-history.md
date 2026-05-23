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

1. `.agents/roadmaps/wasm-solver-migration-report.md`
2. `.agents/roadmaps/shikhu-feedback-todo.md`
3. `.agents/skills/business/algorithm_verification.md`
4. `.agents/skills/business/gathering_math_formulas.md`
5. `.agents/skills/business/ffxiv_gathering_skills.md`
6. `.agents/skills/mission/product_architecture.md`

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

所以本研究不應再被當成「目前求解台仍未處理 OOM」的證據。若要處理現況，應改讀 `wasm-solver-migration-report.md` 與現有 WASM tests。

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

來源：`.agents/roadmaps/wasm-solver-migration-report.md`。

### 已驗證改善

收藏品 solver 搬到 WASM 後，主要 DP / memo 搜尋從 JS object-heavy 路徑移到 typed/static array 與 packed key，特殊慢案例的 JS heap 壓力大幅下降。worker 目前會優先使用 WASM；一般 WASM 載入或執行失敗時才 fallback 到 TS solver。

若 WASM memo table 容量不足，worker 不應 fallback 到 JS solver，因為 JS 路徑在高壓案例可能更危險。現況會回傳 memo capacity / allocation 類型錯誤。

### 仍然不能誤判的地方

WASM 只讓搜尋更能承受，不代表可以放寬正確性：

- summary parity 不等於完整 policy tree parity。
- 等價分數下，root action 或 policy shape 可能不同。
- skill habit 只能作為最後 tie-break，不能排在 objective score、GP、action count、node count 之前。
- 成功率補滿剪枝已撤回，因為它會移除極低機率但可達的高分尾端。
- 未來若要新增剪枝，必須證明 summary、完整 distribution 與可達尾端不變，不能只看 expectedScore。

### 後續應優先維護的驗證

- 保留 TS/WASM summary parity 測試。
- 對等價 root action 差異採寬鬆驗收，但要保留 debug 線索。
- 用黑鐵礦匯出案例做 regression fixture，確認 `304` / `342` primary 尾端與 `684` combined max 不會消失。
- 在 debug/export 中標示 solver engine，例如 `wasm-core` / `ts-core`。
- 若要追求完整 policy tree parity，需先接受 memo / 時間成本可能大幅上升。

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
