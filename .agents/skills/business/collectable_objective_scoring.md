# 收藏品評分偏好與自訂權重設計筆記

本文件整理 2026-05-19 針對收藏品求解器目標函數的討論結果，並於 WASM 遷移後補充目前核心路徑。後續 Agent 若要修改 `assembly/collectableSolverCore.ts`、`src/utils/collectableWasmSolver.ts`、`src/utils/collectableWasmPolicy.ts`、`src/utils/collectableSolver.ts`、`src/utils/collectableMath.ts`、收藏品 UI、設定頁、實驗分析器或 Tome Library 的收藏品儲存格式，請先讀本文件。

## 問題背景

使用者發現一個老主顧採集收藏品案例中，求解器可能在中標階段就開始 `Collect`，而不是繼續衝高標。

該案例的 debug reward table 為：

| 檔位 | 收藏價值門檻 | 張票 |
| :--- | ---: | ---: |
| 低標 | 240 | 107 |
| 中標 | 450 | 124 |
| 高標 | 600 | 140 |

從目前求解器角度看，這不一定是 bug。現行收藏品求解器會最大化整個採集點的 reward 總和期望。因為中標到高標只增加 `16` 張票，但多做一次提煉通常會少一次 `Collect`，所以「多採一顆中標」在票據總量上常常勝過「少採一顆高標」。

然而這不符合老主顧的主要使用情境：

- 老主顧每週最多交 6 顆。
- 此類採集點通常不是限時點，旁邊馬上有下一個點可刷。
- 下週可能輪到不同物品，甚至有 bonus 的物品不一定是這個。
- 玩家真正重視的常常是高標交納品質，而不是單一礦脈榨出的總票據。

因此，問題核心不是 action model，而是 objective scoring model。

## 設計方向

不要把 reward model 寫死成「已知票據表」。收藏品求解應抽象成：

```txt
collectability -> score
```

現行 reward vector 評分可理解為：

```txt
collectability -> reward tier -> scrip amount -> score
```

現行 tier-aware 評分已允許：

```txt
collectability -> tier / custom breakpoint -> score
```

這讓求解器能支援：

- 已支援收藏品：沿用票據、經驗、金幣、物品等 reward table。
- 老主顧：用高標優先的 preset，而不是只看票據總量。
- 精選或宇宙探索等未完整支援模型：可先提供「收藏價值評分模式」或推薦權重，避免假裝已知道完整 reward model。
- 使用者自訂：允許使用者針對不同檔位設定自己的分數。

## 現行使用者介面概念

求解台與策略分析使用小型 `評分偏好` 設定入口，讓使用者選擇本次推薦或分析要重視的目標。

不要稱為「真實收益」或「最佳權重」，避免誤導。可用文案方向：

- `評分偏好`
- `推薦排序權重`
- `依目前目標評分`

小視窗目前提供下列方向：

1. **使用 reward vector 評分**
   - 一般素材票據收藏品：使用現有 reward table，也就是票據 / 經驗 / 金幣 / 物品權重。

2. **使用 tier-aware 評分**
   - 老主顧或交納品質導向：使用高價值、中價值、低價值等 preset，而不是只看票據總量。
   - 精選：在正式 reward model 尚未建立前，可用收藏價值 / 高檔位偏好做研究用排序，但必須清楚標示不是完整 reduction 期望。
   - 宇宙探索：可先做「收藏價值評分模式」，但必須標明尚未等於 mission score / 銀星金星 reward。

3. **自訂權重**
   使用者可以針對各檔位填分數，例如：

   ```txt
   未達標: 0
   低標: 1
   中標: 3
   高標: 8
   ```

## 老主顧案例的建議 preset

老主顧不應拋棄低標與中標。低中標仍然是合法 fallback，尤其在裝備不足、GP 不足、玩家只想穩定交納或剩餘週次很少時仍有價值。

但老主顧的預設目標應強烈偏向高標。可用類似以下 preset：

```txt
未達標: 0
低標: 0
中標: 1
高標: 100
```

或更強烈：

```txt
未達標: 0
低標: 0
中標: 1
高標: 1000
```

這樣求解器就不會因為「兩顆中標票數大於一顆高標」而提早停手。

## 建議 preset set

| Preset | 權重方向 | 適用情境 |
| :--- | :--- | :--- |
| 票據總量 | 沿用目前 `scrip` reward | 一般收藏品、刷票、想最大化單點總票據 |
| 老主顧高標 | 高標大幅加權，中標作 fallback | 每週 6 顆、非限時可刷點、重視交納品質 |
| 穩定交納 | 中標與高標都有明顯分數，低標較低 | 裝備不足或想保守達標 |
| 收藏價值優先 | 最高檔位或最高可達收藏價值大幅加權 | 精選、未知 reward model、研究用途 |
| 自訂 | 使用者自行設定各檔位 / breakpoint | edge case、個人習慣、第三方驗證 |

## 現行實作與維護規則

### 1. 不要重寫 action engine

目前收藏品 action engine 已是 DP + memo policy search，支援 `Collect`、`Scour`、`Meticulous`、`Scrutiny`、`Collector's Focus`、`Priming Touch`、成功率補強、恢復耐久與 `Revisit`。

WASM 遷移後，正式路徑是 WASM core 負責 DP / memo / objective score / best action / search counters，TS wrapper 負責 request parsing、reward table、objective preset、policy materialization、export 與 debug。TS solver 仍是 fallback 與 parity 參考。修改 scoring layer 時必須同步考慮 WASM 介面能否表達該 objective。

Objective / tie-break / scoring 問題應優先改 scoring layer，不應重寫動作模型。

### 2. Objective 型別現況

`CollectableObjective` 目前已支援 reward vector 與 tier-aware objective：

```ts
export type CollectableObjectiveKind = 'scrip' | 'exp' | 'gil' | 'custom' | 'tierScore';

export interface CollectableRewardWeights {
  exp?: number;
  gil?: number;
  scrip?: number;
  items?: Record<number, number>;
}

export interface CollectableTierScoreWeights {
  none?: number;
  low?: number;
  mid?: number;
  high?: number;
}

export interface CollectableObjective {
  kind: CollectableObjectiveKind;
  presetId?: CollectableObjectivePresetId;
  weights?: CollectableRewardWeights;
  tierWeights?: CollectableTierScoreWeights;
}
```

現行 preset 包含 `scrip`、`highValue`、`midValue`、`lowValue`、`customTier`。`tierScore` 會把收藏價值先映射到 `none / low / mid / high`，再用 tier weights 算分。若未來需要支援精選、宇宙探索或任意 breakpoint，不能只改 UI；必須同步設計 WASM input shape、TS fallback parity、export/debug 呈現與模型版本。

### 3. Collectability scoring helper

現行 `scoreCollectability(collectability, rewardTable, objective)` 是秘笈求解、策略 codec 與實驗分析共用的評分入口：

```ts
scoreCollectability(collectability, rewardTable, objective)
```

行為：

- `scrip` / `exp` / `gil` / `custom`：沿用目前 reward vector scoring。
- `tierScore`：先由 `getCollectableRewardTier(collectability, rewardTable)` 判斷 `none / low / mid / high`，再查 `tierWeights`。
- 若未來加入 `cap` 或特殊 breakpoint 權重，需小心不要讓「1000」與「高標」語意混淆。

### 4. 保留 reward 顯示

即使 scoring 使用 tier weights，結果 UI 仍應顯示實際 reward table 與期望票據，因為這是玩家理解與 debug 的重要資訊。

也就是說：

- scoring 可用「高標權重」。
- 顯示仍可保留「預期大地橘票」、「低 / 中 / 高標門檻」、「最低 / 最高結果」。
- 文案要清楚標示目前推薦是依哪個評分偏好產生。

### 5. 顯示預期檔位顆數

現行結果已提供 `expectedTierCounts`。若使用自訂權重或高標優先 preset，UI 不應只顯示 `expectedScore`。此時分數是使用者偏好權重，不是遊戲內真實單位；更有用的摘要是「預期會拿到幾顆高標 / 中標 / 低標」。

不要嘗試從 scalar score 反推檔位顆數。原因：

- 權重可能導致碰撞，例如同一個總分可由不同低 / 中 / 高組合得到。
- `scrip` 模式下，總票數也無法可靠還原每顆的檔位。
- 若未來加入特殊 breakpoint、精選評分或物品權重，反推會更不穩定。

`expectedTierCounts` 是與 `expectedReward` 平行的摘要向量：

```ts
export interface CollectableTierCounts {
  none: number;
  low: number;
  mid: number;
  high: number;
}
```

每次 `Collect` 成功時，依當下 `collectability` 判斷 tier，給該 branch 加上一次 tier count：

```ts
{ high: 1 }
```

再像 `expectedReward` 一樣沿著 DP 結果加總並乘上機率，最後得到：

```ts
expectedTierCounts: {
  low: 0.12,
  mid: 1.35,
  high: 4.48
}
```

UI 可顯示為：

```txt
預期交納品質
高標 4.48 顆
中標 1.35 顆
低標 0.12 顆
未達標 0.00 顆
```

如果目前評分偏好是「老主顧高標」或其他 tier-aware preset，主視覺應優先顯示 tier counts；`expectedScore` 可以降級為 debug / 進階資訊，避免玩家把權重分數誤認為真實票據。

### 6. RAM 與效能邊界

只累積 `expectedTierCounts` 的 RAM 成本很低。它只是每個 memo result 多 4 到 5 個 number，相對目前已保存的 `expectedReward`、`outcomes: Map<number, probability>`、policy branch 物件與 debug 資訊，成本可忽略。

請注意下列邊界：

- `expectedTierCounts` 是結果摘要，不是求解狀態；不要把它加入 DP state key。
- 不要為了一般 UI 把 endpoint outcome key 擴成 `score + lowCount + midCount + highCount`。這會放大 outcome distribution，尤其在多次 `Collect`、`Revisit` 與洞察分支下容易變胖。
- 若未來需要完整檔位組合分布，建議只在 `debugMode` 或專門研究匯出中計算，平常求解不要保存。
- 一般 UI 只需要期望檔位顆數即可，不需要完整 endpoint tier distribution。

主要風險不是 RAM，而是命名、顯示與測試要避免讓使用者誤解 scoring 分數。

### 7. Tome Library 與實驗系統

儲存到 Tome Library 時應保存 objective/preset，而不是只保存當下顯示文字。

實驗系統的策略分析也應共用同一 scoring helper，避免同一手法在秘笈與實驗中被不同規則評分。

## 已知邊界

- 低標與中標不應從模型刪除；它們是合法 reward tier，也是裝備不足玩家的 fallback。
- 老主顧預設應偏向高標，但使用者仍應能改回票據總量或自訂權重。
- 精選 reward model 不可直接沿用一般三檔票據模型；若用收藏價值評分，必須明確標示它是「推薦排序權重」而不是完整 reduction 期望。
- 宇宙探索若缺 mission score / 銀星金星 reward 公式，也只能先用收藏價值偏好做參考推薦，不可宣稱完整支援。
- Objective / tie-break / scoring 變更至少要驗證 TS 與 WASM 的 summary、distribution、reward/tier counts 與可達尾端；同分 root action 差異可視情況寬鬆驗收，但必須能解釋。
- 對外文案仍只能使用「推薦」、「依目前模型」、「評分偏好」等保守語氣，不可宣稱「最佳」或「唯一正解」。

## 後續擴充檢查清單

1. 若新增 objective kind、preset、breakpoint 或 reward model，先確認 WASM input shape、TS fallback、strategy analysis 與 export/import 都能表達同一語意。
2. 若 scoring 實作變更可能影響同一輸入的推薦、分析分數、distribution 或檔位摘要，提交前必須依 `AGENTS.md` bump `src/config/modelVersions.ts` 的對應 model version。純文件修正只是讓說明貼近目前真實模型，不需 bump。
3. 測試至少覆蓋：現有 `scrip` 模式維持舊行為、tier preset 能改變推薦策略、`expectedTierCounts` 隨 `Collect` 成功分支正確累積且不進 DP state key、秘笈與實驗分析使用同一 scoring helper。
4. 若新增完整 endpoint tier distribution，只能放在 debug / 研究匯出或專門比較工具，平常求解不要讓 outcome key 因檔位組合而膨脹。
