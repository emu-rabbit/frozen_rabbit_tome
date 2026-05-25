# 演算法驗證與第三方復現規範

## 目的

本文件定義 Frozen Rabbit Tome 的演算法品質門檻與第三方驗證範圍。只要任務涉及普通採集求解器、收藏品求解器、模擬器、底層公式、reward model、debug trace、測試 fixture 或演算法輸出格式，Agent 都必須讀取本文件。

核心原則：

- 演算法結果必須可重現、可追蹤、可定位。
- 對外可驗證的內容必須明確標示使用的模型版本、輸入、輸出、已知限制，以及必要時的資料來源 / 公式 / action model 線索。
- 不可把尚未驗證的遊戲機制包裝成已確認事實。
- 測試不只驗證單一答案，也要驗證公式邊界、機率分布、搜尋狀態與可接受的效能範圍。

## Unit Test 分層

### 1. 公式表測試

底層公式必須用 table-driven tests 覆蓋每個分段邊界與 clamp 行為。

目前必要範圍：

- `src/utils/gatheringMath.ts`
  - `calculateSuccessRate`
  - `calculateBoonChance`
  - `calculateBountifulYield`
- `src/utils/collectableMath.ts`
  - `calculateCollectableScourValue`
  - `calculateValueIncreaseRate`
  - `calculateMeticulousProcRate`
  - `calculateScrutinyMultiplier`
  - `calculateCollectableScourGain`
  - `calculateCollectableMeticulousGain`
  - reward tier 與 objective scoring

測試必須至少包含：

- 每個分段左右邊界。
- 上限與下限 clamp。
- base value 為 0 或資料缺失時的防禦行為。
- 取整順序會影響結果的案例。

### 2. 演算法 invariant 測試

求解器與模擬器必須驗證永遠成立的性質，而不是只比對某一組手法字串。

必要 invariant：

- outcome distribution 機率總和約等於 100%。
- `expectedYield` / `expectedScore` 等於 outcome distribution 加權平均。
- `min <= expected <= max`。
- GP 不為負且不超過玩家最大 GP。
- 耐久不為負且不超過節點最大耐久。
- 收藏價值介於 0 到 1000。
- 收藏價值已滿時不可推薦遊戲內不能施放的提煉與提煉 buff。
- 一次性 buff 不可重複施放。

### 3. Golden Scenario Corpus

代表性情境必須有固定輸入與固定輸出，作為重構與版本升級的回歸樣本。

必要情境類型：

- 普通採集：無技能、只使用下一次採集技能、全域 buff、恢復耐久、再起。
- 收藏品：Scour 基準、Meticulous 多分支、Scrutiny、Collector's Focus、Priming Touch、Collector's Standard、成功率補強、再起。
- 目標模式：`expected`、`max`、`min`。
- 資料邊界：缺 reward high tier、成功率不足、1000 收藏價值、0 GP、低等級不可用技能。

Golden scenario 可先寫在 test 檔內；若數量增加，應移到 `src/utils/__fixtures__/` 或 `tests/fixtures/`，並保持 JSON 可被第三方讀取。

### 4. Cross-check Oracle

對小狀態空間，應提供獨立於正式 solver 的慢速 brute-force oracle。Oracle 不需要快，但邏輯必須簡單、容易審查。

用途：

- 證明 DP / memo / 剪枝沒有漏掉合法分支。
- 在正式 solver 進行效能優化後，仍能用小案例確認結果一致。
- 對同分結果，oracle 應允許多個等價最優解；正式 solver 可再用 habit tie-break 決定使用者看到的順序。
- 收藏品 WASM core 應與 TS solver 保持 oracle / parity 關係。若 root action 或 policy shape 因同分 tie-break 不同而不完全一致，必須至少證明 summary、outcome distribution、reward/tier counts、min/max 與可達尾端一致，並在測試中明確標示寬鬆驗收原因。

## 效能與狀態數門檻

`debugMode` 已提供搜尋統計，例如：

- `statesSolved`
- `memoHits`
- `memoHitRate`
- `actionsEvaluated`
- `candidateComparisons`
- `terminalStates`
- `branchCount`

WASM 路徑另需注意：

- `stateKeyEngine` 或等價欄位應能辨識 `wasm-packed`、`js-packed`、`string` 等 key 建立路徑。
- memo capacity / allocation failure 必須回傳受控錯誤，不應讓頁面或 worker 直接 OOM。
- 若手動提高 memo capacity，debug/export 應保留足夠線索讓第三方知道該結果使用的 engine 與容量。
- 一般採集 WASM 修改 `tie-break metadata`、capacity selector 或 worker fallback policy 時，必須重跑 worker parity test；不能只跑 wrapper test 或 summary test。
- 一般採集的高 GP / 高耐久 / 低成功率 / Revisit 壓力案例應放在 `npm run bench:regular-wasm` 或 diagnostic，不應塞進預設 `npm run test:unit`。
- 一般採集 WASM 效能診斷必須分開量測 core DP solve 與 wrapper materialization。2026-05-24 的重蠑木原木極端案例證明，`solvePlanObjective()` 可在 `2^23` 約 2 秒完成，但 TS wrapper 重建 `bestRotation` / `rotationPlans` / outcome distribution 可能因反覆展開同一 policy 子圖而長時間不回來；不可只用 memo capacity 或 `statesSolved` 判斷瓶頸。
- 收藏品若新增剪枝策略，必須證明 summary、完整 distribution、reward/tier counts 與可達尾端不變，不能只看 expectedScore。

代表性案例應設寬鬆上限，目標是防止搜尋空間意外爆炸，而不是限制合理的演算法調整。若重構後狀態數增加，Agent 必須判斷：

- 增加是否來自新增合法模型分支。
- 增加是否只出現在極端輸入。
- 是否需要改善 state key、剪枝或預先計算。
- 是否需要同步更新效能門檻與說明。

不可只因測試門檻失敗就盲目放寬；放寬前要能說明狀態數增加的原因。

## 第三方驗證範圍

### 目前應可提供給第三方驗證的內容

- 模型與匯出版本資訊
  - git commit 或 release tag。
  - `package.json` version。
  - JSON `schemaVersion`。
  - scenario-aware 的 solver / simulator / analyzer model version。
  - strategy codec version，例如收藏品 `collectable-policy-strategy-rules-v1`。
  - 使用的資料來源、檔案來源或 game data 線索；若尚未建立正式資料版本，應明確標示為來源線索而不是完整版本管理。
  - 已知排除項目。
- 輸入資料
  - 玩家 `level/gathering/perception/gp`。
  - `baseValues.Gathering` 與 `baseValues.Perception`。
  - `itemLevel`。
  - `nodeBonuses`。
  - `temporaryGp`。
  - `jobType`。
  - `isTimedNode`。
  - `objectiveMode`。
  - 收藏品 `rewardTable`、`objective`、`hasRelicToolBonus`。
- 公式中間值
  - 成功率 score、raw rate、level modifier、final rate。
  - boon score 與 final rate。
  - bountiful 門檻與加成量。
  - 收藏品 Scour、value increase、focused value increase、Meticulous rate、Scrutiny multiplier、Scrutiny bonus。
  - Collector's Standard proc rate 與來源分類。
- 搜尋與分布
  - 主要與再起分支的起始 GP。
  - 每個 plan 的 outcome distribution。
  - `expected/min/max` 與 endpoint chance。
  - 搜尋統計。
  - 收藏品 WASM / TS engine、state key engine、memo capacity 或相關 capacity guard 資訊。
  - policy tree 或 rotation plans。
- 限制聲明
  - 普通採集與收藏品各自的支援技能。
  - `Brazen` 排除。
  - `Collector's High Standard` 排除。
  - 精選 reward model 排除。
  - 宇宙探索 / Stellar Mission 專用模型排除。

### 暫時不應宣稱第三方可完整驗證的內容

- `Brazen` 隨機分布、檔位與取整順序。
- `Collector's High Standard` 完整觸發模型與疊加順序。
- 節點特殊效果對慎重不耗耐久率的完整疊加順序。
- 精選 reduction reward model。
- 宇宙探索 mission score 與 reward model。
- 任何未由 `.agents/skills/business/gathering_math_formulas.md` 或可靠來源確認的推測公式。

## 建議輸出格式

下載 JSON 應作為完整交換檔，支援分享、匯入、比較器、第三方驗證與 bug report。使用者不需要選簡易版 / 完整版；預設下載就應包含完整輸入、輸出摘要、策略 / 手法、debug summary、搜尋線索、版本資訊與已知限制。若匯入後要保存到藏書庫或實驗資料庫，才依目標頁面剪枝 / 投影成輕量卡片資料。

未來若新增或整理研究者匯出功能，建議輸出單一 JSON 檔，結構如下：

```json
{
  "manifest": {
    "app": "frozen_rabbit_tome",
    "schemaVersion": 1,
    "version": "0.1.0",
    "commit": "<git commit>",
    "scenario": "tome.regular | tome.collectable | experiment.regular | experiment.collectable",
    "generatedAt": "<ISO timestamp>",
    "limitations": []
  },
  "modelVersions": {
    "exportSchema": 1,
    "app": "0.1.0",
    "regularSolver": "regular-solver-v1",
    "collectableSolver": "collectable-solver-v1",
    "regularSimulator": "regular-simulator-v1",
    "collectableSimulator": "collectable-simulator-v1",
    "regularAnalyzer": "regular-analyzer-v1",
    "collectableAnalyzer": "collectable-analyzer-v1",
    "collectableStrategyCodec": "collectable-policy-strategy-rules-v1"
  },
  "input": {},
  "formulaDebug": {},
  "plans": [],
  "combined": {},
  "search": {
    "engine": "wasm-core | ts-core",
    "stateKeyEngine": "wasm-packed | js-packed | string",
    "memoCapacityPower": null
  },
  "policy": {},
  "rotationPlans": []
}
```

實作時 `modelVersions` 不必每個 scenario 都塞滿所有欄位；應只輸出該 JSON 會用到的版本。例如 `tome.collectable` 需要 collectable solver 與 collectable strategy codec，`experiment.regular` 則需要 regular simulator / analyzer。

版本粒度以「同一份輸入在新版模型下，使用者可觀察輸出是否可能不同」為判準。第一版不建議把 `formulaVersion`、`actionModelVersion`、`gameDataVersion` 做成所有 JSON 的第一層必填欄位；若公式、技能模型或資料來源變更會影響結果，應 bump 對應的 solver / simulator / analyzer model version。內部公式、action model、資料來源與 server region 可作為 debug / release note / future extension 欄位。

JSON 欄位需保持穩定；若破壞相容性，應在 release note 或 changelog 說明。

## 本地持久儲存與匯入投影

本地藏書庫與實驗資料庫不是完整 JSON 的替代品。後續 Agent 設計 import / save flow 時應遵守：

- 藏書庫保存秘笈問題本身，也就是可重現求解的輸入條件；秘笈輸出若保存，只能是保存時快照或卡片預覽。
- 實驗資料庫保存使用者指定的 rotation / strategy rules，因為這是模擬與分析的核心使用情境。
- 收藏品秘笈若保存完整推薦策略，只保存無損 `strategyCodec`，不可保存巢狀 `policy.next` 樹或完整 debug blob 到 localStorage。
- 完整 JSON 匯入後若使用者選擇保存，應依 `manifest.scenario` 投影成藏書卡或實驗卡；比較器與第三方驗證工具則可直接使用完整 JSON。
- 匯入舊版 JSON 或舊求解快照時，應能區分「保存時結果」與「目前版本重新求解 / 重新分析結果」。

## Agent 維護規則

- 修改核心演算法時，至少跑 `npm run test:unit`。
- 若修改普通採集或收藏品求解器，必須檢查公式表測試、invariant 測試、golden scenario 與 oracle 是否仍符合模型。
- 若修改一般採集 WASM core、wrapper、worker fallback、memo capacity selector 或 rotation materialization，必須檢查 `src/utils/regularGatheringWasmSolver.test.ts`、`src/workers/solver.worker.test.ts` 與 `src/utils/regularGatheringRotationContract.test.ts`；高壓案例改用 `npm run bench:regular-wasm` 驗證。
- 若修改收藏品 WASM core、wrapper、policy materialization、objective scoring 或剪枝策略，必須檢查 `src/utils/collectableWasmSolver.test.ts` 與 TS/WASM parity，並確認不會移除極低機率但可達的高分尾端。
- 若新增支援技能或新 reward model，必須同步更新：
  - `.agents/skills/business/ffxiv_gathering_skills.md`
  - `.agents/skills/business/gathering_math_formulas.md`
  - 本文件的驗證範圍與排除項目
  - 對應 unit tests
- 若 debug 輸出新增或改名欄位，應評估是否影響第三方驗證資料格式。
- 對外文案仍只能稱為「推薦」、「依目前模型推算」，不可宣稱「最佳」、「最優」或「唯一正解」。
