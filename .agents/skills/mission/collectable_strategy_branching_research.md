# 收藏品策略樹分支爆炸研究紀錄

更新日期：2026-05-19

## 背景

收藏品模擬器 / 策略台初版已能用「由上而下套用規則」的方式覆蓋大量收藏品決策狀態。使用者實測後確認，這個方向符合原本構想：收藏品不是固定 linear rotation，而是 policy tree / decision table。

本輪研究起因是：策略台在加入看似合理的 fallback 規則後，節點數會快速抵達上限；另有一次在求解台用低獲得成功率案例時，直接 out of memory。

目前相關原型碼已先保存到 git stash：

- `stash@{0}`（建立時間：2026-05-19 13:05:23）
- stash 訊息：`wip collectable strategy lab branching research`
- 保存內容包含：
  - `src/views/Simulator.vue`
  - `src/components/CollectableStrategyLab.vue`
  - `src/utils/collectableStrategyTree.ts`
  - `src/utils/collectableStrategyTree.test.ts`

未來若要恢復本輪原型，可先執行：

```powershell
git stash list
git stash show --stat stash@{0}
git stash apply stash@{0}
```

套用前請先確認目前工作樹是否乾淨，避免覆蓋使用者後續變更。

## 使用者觀察

使用者建立了一組有邏輯的收藏品策略：

1. 前段用集中檢查、提煉、價值矚目等規則建立收藏價值。
2. 收藏價值達 850 以上後，用慎重提煉補刀。
3. 收藏價值達 1000 後，使用石工之理 / 理智同興 / 收藏品採集處理耐久與收尾。
4. 最後補上一條 fallback：收藏價值低於或等於 850 時使用提煉。

加入最後一條 fallback 前，策略台只有約 10 個節點，其中 4 個待決策節點，狀態大約是：

- `GP 630 / 耐久 5 / 收藏價值 450`
- `GP 630 / 耐久 5 / 收藏價值 550`
- 部分狀態帶有 `價值矚目`
- 部分狀態帶有 `洞察`
- 都已開始使用收藏品技能

直覺上，這些狀態距離 850 最多只需要 1 到 2 次提煉，不應直接暴漲到 1200 節點以上。因此節點爆炸不應簡化解釋為「fallback 規則太寬」。

後續使用者又在求解台測試獲得成功率約 50% 的案例，直接觸發 out of memory。這強烈指向低成功率採集分支是重要元凶。

## 目前實作盤點

### 普通採集模擬台已經有狀態合併

`src/utils/rotationSimulator.ts` 的 `runRotation()` 每跑一個 action 後會呼叫 `normalizeStates()`。

`normalizeStates()` 會用「移除 probability 後的 state JSON」作為 key，將等價狀態的機率相加。這代表本專案已經有「合併隨機路徑但保留機率」的先例。

這是重要基準：合併不是理論空談，普通採集模擬台已經這樣做。

### 收藏品策略台目前是純樹狀遞迴，沒有合併

`src/utils/collectableStrategyTree.ts` 的 `expandNode()` 目前會：

1. 為每個狀態建立一個 `CollectableStrategyNode`。
2. 找第一條可執行規則。
3. 對 action 的每個隨機結果建立 child。
4. 對 child 遞迴展開。

它目前沒有 visited / memo / frontier aggregation。

此外，`stateKey()` 包含：

- `depth`
- `pendingActions`
- 各種 state 欄位

但這個 key 只是節點 id，不用於合併。因為包含 depth，即使未來直接拿來當合併 key，也會讓同一狀態在不同路徑深度下無法合併。

### 收藏品求解台有 DP memo，但 policy materialization 可能造成記憶體壓力

`src/utils/collectableSolver.ts` 已經有 `buildMemoKey()` 與 `memo: Map<string, SearchResult>`。這代表求解台不是完全 naive tree expansion。

但 `SearchResult` 內包含：

- `expectedScore`
- `expectedReward`
- `outcomes`
- `policy`
- `gpSpent`
- `actionCount`
- `nodeCount`

也就是 memo 裡不只保存計算結果，也保存整棵可展示 policy。`buildPolicyResult()` 會對每個 candidate action 建立 policy branches，再比較候選。低成功率讓採集成功 / 失敗造成更多 GP 狀態，進而增加 policy 物件建立與 worker 回傳資料量。

因此求解台 OOM 的合理懷疑不是「完全沒有 memo」，而是：

1. 狀態數因低成功率與 GP 回復差異增加。
2. 每個狀態的候選 action 都會 materialize policy。
3. memo 保存的 `SearchResult.policy` 讓記憶體壓力高於只保存 scalar / distribution 的 DP。

## 分支爆炸的主要來源

### 低成功率收藏品採集

收藏品採集在成功率不是 100% 時會分成：

- 採集成功：回 GP、取得 reward、消耗耐久
- 採集失敗：不回 GP、reward 為 0、消耗耐久

連續採集會形成二元分支：

- 1 次採集：2 條
- 5 次採集：32 條
- 10 次採集：1024 條
- 20 次採集：約 1,048,576 條

如果前面還有提煉價值提升、洞察、慎重不耗耐久、石工之理 / 理智同興等分支，總節點數會更快膨脹。

這解釋了「只有 4 個待處理節點，卻補上 fallback 後爆炸」的現象：fallback 不是單獨造成爆炸，而是把原本停止的 frontier 接回了後續完整隨機流程，其中低成功率採集是最危險的乘法來源。

### 提煉與慎重提煉也會放大分支

提煉可能分：

- 價值提升 / 未提升
- 洞察觸發 / 未觸發

慎重提煉可能分：

- 價值提升 / 未提升
- 消耗耐久 / 未消耗耐久
- 洞察觸發 / 未觸發

目前測試中也明確保留「慎重提煉會建成多個獨立組合分支」的行為。這對 debug 透明度有利，但對 UI tree 展開成本很高。

### 石工之理不是無限循環，但會增加採集階段長度

使用者正確指出：GP 只有 600 到 700 時，石工之理 / 理智同興最多只會增加一兩輪，不應被描述成無限循環。

更準確地說，石工之理會增加可採集次數，而低成功率採集對次數高度敏感；每多一點耐久都可能讓採集成功 / 失敗排列倍增。

因此石工之理是放大器，但不是根本錯誤。

## 對合併的嚴謹結論

### 可以合併，但不能把所有情境都視為同一種合併

應區分：

1. **精確狀態合併**：相同決策狀態的機率相加。
2. **連續採集分布折疊**：在確認中間不會插入其他決策時，用成功次數分布替代完整成功 / 失敗排列。
3. **啟發式剪枝**：丟棄低機率或低價值分支。

目前建議只先做 1，謹慎評估 2，不建議默默做 3。

### 精確狀態合併不會降低可靠性

若兩條路徑抵達的「後續決策所需狀態」完全相同，後續規則匹配與 action 結果也會完全相同。此時可將機率相加，這不是近似，也不是裁剪。

合併 key 應包含至少：

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
- `pendingActions`

合併 key 不應包含：

- `path`
- `depth`
- 只用於 UI 顯示的 label

若保留 path，應只保存少量 path samples，不能讓 path 阻止狀態合併。

### outcome distribution 必須與決策 state 分開保存

不能只合併 state 而丟掉已累積 reward / score。正確做法是：

- 決策使用 state key 合併。
- 每個 aggregate state 帶機率與累積結果分布。
- 後續同狀態共用同一套決策。
- 回算結果時用 weighted merge / convolution 合併已累積分布與 future distribution。

這與現有 `collectableSolver.ts` 的 `mergeOutcomeDistributions()` 思路相容。

## 建議下一步

### P0：先加防 OOM 保護與診斷

低成功率 case 已實測會讓求解台 out of memory，這是安全性問題，優先於 UI polish。

建議新增 debug / telemetry 欄位：

- raw branch count
- unique decision state count
- duplicate state hits
- branch count by action
- materialized policy node count
- max policy materialization depth
- worker payload size 或近似節點數

求解台 worker 應在超過安全門檻時回傳可理解錯誤，而不是 OOM。

### P1：策略台改為 DAG / frontier aggregation

目前 `CollectableStrategyLab` 的策略台應優先從 tree expansion 改為 state aggregation。

建議資料模型方向：

- unique decision node：用 state + pendingActions 作 key。
- node 保存 merged probability 與 path samples。
- edges 保存 action outcome 與 probability。
- UI 顯示「此狀態由 N 條路徑合併」。
- 規則 coverage 應拆成：
  - unique states matched
  - raw paths matched
  - branches generated

這會讓策略台更符合「分析決策規則」而不是「列出所有隨機排列」。

### P2：求解台拆分計算結果與 policy 展示

求解台目前 memo `SearchResult` 直接包含 policy，可能讓低成功率案例的記憶體壓力放大。

建議方向：

1. DP 階段只保存：
   - score
   - expected reward
   - outcome distribution
   - best action kind
   - compact branch descriptors
2. policy 展示階段再依 best action 建立可展示 graph。
3. policy materialization 應支援 cap / lazy expansion / shared node。
4. debug dialog 顯示「已省略 / 已合併 / 已達展示上限」，但 outcome distribution 仍維持精確。

### P3：UI 呈現分清決策複雜度與隨機路徑數

目前 UI 容易把「策略覆蓋很多節點」誤讀成「策略造成爆炸」。建議右側 dashboard 改成：

- 決策狀態數
- 隨機路徑數
- 已合併狀態數
- 待補規則數
- 達上限 / OOM 風險
- 主要分支來源排行：
  - 收藏品採集：成功 / 失敗
  - 慎重提煉：價值提升 / 耐久消耗 / 洞察
  - 提煉：價值提升 / 洞察
  - 石工之理：理智同興

文案應避免暗示使用者策略一定寫錯。更準確的訊息是：

> 目前策略已覆蓋多數決策狀態，但低採集成功率造成大量隨機結果路徑，已停止完整展開。

## 重要限制與未確認事項

- 本輪沒有完成修復，只有完成研究與方向判斷。
- 低成功率 OOM 的精確最小重現案例尚未寫成 unit test。
- 尚未量測求解台 OOM 是狀態數主導、policy materialization 主導，或 worker postMessage payload 主導。
- 連續採集 binomial folding 只有在中間不會插入其他決策時才安全；目前不建議先做成預設行為。
- 若要改收藏品求解台核心 DP，必須保留現有 outcome distribution invariant：
  - 機率總和約等於 100%。
  - expected score 等於 distribution 加權平均。
  - `min <= expected <= max`。
  - GP / 耐久 / 收藏價值狀態合法。

## 建議驗證項目

未來實作時建議補測：

1. 收藏品策略台：低成功率連續採集時，合併後 unique state 數顯著低於 raw path 數。
2. 收藏品策略台：合併前後小案例的 terminal state 機率總和一致。
3. 收藏品求解台：50% 成功率案例不再 OOM，且能回傳受控錯誤或完整結果。
4. 收藏品求解台：outcome distribution 機率總和仍為 100%。
5. 收藏品求解台：小狀態空間與現有結果相符。
6. UI：分支來源排行能指出 `collect` 是低成功率時的主要放大來源。

## 快速接續指引

若未來新對話要繼續本議題，建議先讀：

1. 本文件。
2. `.agents/skills/mission/product_architecture.md`
3. `.agents/skills/business/ffxiv_gathering_skills.md`
4. `.agents/skills/business/gathering_math_formulas.md`
5. `.agents/skills/business/algorithm_verification.md`
6. `src/utils/collectableSolver.ts`
7. `src/utils/collectableStrategyTree.ts`（需先從 stash 還原）
8. `src/utils/rotationSimulator.ts`

接續時請先不要直接提高節點上限。優先確認：

- 是 raw path explosion 還是 unique state explosion。
- policy materialization 是否比 DP 計算本身更耗記憶體。
- 哪些 action 是主要分支來源。
