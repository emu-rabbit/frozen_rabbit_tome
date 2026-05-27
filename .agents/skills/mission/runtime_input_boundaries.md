# Runtime 資料與使用者輸入邊界

## 目的

本文件用網頁功能資料流定義 Frozen Rabbit Tome 中「runtime 可依物品重建的資料」、「使用者或設定檔必須提供的資料」與「最後 solver / simulator / analyzer engine 需要的資料」之間的分界。

後續 Agent 設計分享連結、匯入、儲存、URL schema、實驗資料庫、藏書庫、設定同步或資料重建流程時，必須先讀本文件。不要只從 `SolverRequest`、`CollectableSolverRequest` 或其他 engine 型別反推使用者需要填什麼；engine request 是組裝後的結果，不等於使用者輸入邊界。

## 核心原則

- `itemId` 是重建頁面條件的核心索引。使用者選定物品後，網站應優先透過 runtime data 取得物品、節點與 reward 相關欄位。
- 使用者輸入應限於玩家狀態、當前節點狀態、偏好與實驗手法；不要要求使用者分享或手填 runtime 已可查到的欄位。
- 分享「目前設置」與分享「完整驗證證據包」是不同產品語意：
  - 快速分享設置：應只攜帶使用者輸入與必要識別碼，runtime 重新查資料。
  - JSON / debug / 第三方驗證：可以攜帶 runtime snapshot、model version、reward table、公式摘要與分析輸出。
- 若 runtime 資料缺失或版本不相容，頁面應給出可理解的錯誤或降級提示，而不是把 runtime 欄位改成使用者必填。

## Runtime 可依物品取得的資料

選定 `itemId` 後，現行網頁可取得或重建下列資料：

- 物品 metadata：
  - `nameLocale` / `nameEn`
  - `glv`
  - `jobType` / `jobTypes`
  - `gatheringItemId`
  - `perceptionReq`
  - `isTimedNode`
  - `isCollectable`
  - icon
- 採集公式基礎值：
  - `baseValues.Gathering`
  - `baseValues.Perception`
  - `itemRealLevel`
- 節點基礎耐久：
  - `baseIntegrity`
  - 若查不到才 fallback 到 `4`。
- 收藏品 reward：
  - `CollectableRewardTable`
  - low / mid / high tier thresholds
  - tier reward vector
  - `rewardItemId`
  - reward source，例如 `collectables`、`customDelivery`。
- 顯示與操作資料：
  - 普通採集與收藏品 action 名稱 / id / icon
  - 食物資料與食物加成公式
  - job 對應技能名稱

這些欄位可能出現在 solver request、export JSON 或 local snapshot 中，但產品上不應視為使用者必須輸入。分享連結若只是重建設置，通常只需要帶 `itemId`，其餘由 runtime 補齊。

## 使用者或設定檔來源的資料

下列資料不是單靠物品能得知，必須由使用者輸入、gear profile、設定或實驗草稿提供。

### 玩家與裝備狀態

- `level`
- `gathering`
- `perception`
- 最大 GP
- 當前 GP / `temporaryGp`
- 食物選擇：
  - `foodId`
  - `quality`
- 收藏品遺物效果：
  - `hasRelicToolBonus` / `collectableRelicToolBonus`
  - 這是裝備/工具效果，不可由採集物品反推；應來自使用者設定或 gear profile。

### 節點當下狀態

- `gatheringCount`：採集次數增加。
- `yieldCount`：一般採集用的獲得數增加。
- `extraRate`：一般採集用的獲得力加成率增加。

`baseIntegrity` 是 runtime 可查欄位；`gatheringCount`、`yieldCount`、`extraRate` 是玩家看到當前節點加成後輸入的欄位。

### 求解與分析偏好

- 一般求解 `objectiveMode`：`expected` / `min` / `max`。
- 收藏品 objective：
  - `scrip`
  - `highValue`
  - `midValue`
  - `lowValue`
  - `customTier`
  - 自訂權重。
- Debug / memo capacity 類開關只屬於進階執行或診斷，不應成為一般分享設置的必要欄位。

### 實驗台手法

- 一般採集實驗：
  - `primaryRotation`
  - `revisitRotation`
  - 是否啟用 revisit block。
- 收藏品實驗：
  - `strategy rules`
  - rule conditions
  - rule actions
  - rule enabled/mode/name

收藏品實驗的 strategy rules 是使用者設計的策略，不是 runtime 可自動重建。simple example 只是 UI 產生的一組草稿規則，語意上仍屬於使用者策略。

## 最後 engine 需要的資料

以下欄位是求解器、模擬器或分析器執行時需要的完整 request。它們混合了 runtime 資料與使用者資料，因此不可直接等同於分享連結或表單的使用者輸入。

### 一般採集秘笈

Engine: `SolverRequest`

Runtime 來源：

- `baseValues`
- `itemLevel`
- `jobType`
- `isTimedNode`
- `nodeBonuses.baseIntegrity`

使用者 / 設定來源：

- `stats`：套用食物後的有效玩家數值。
- `temporaryGp`
- `nodeBonuses.gatheringCount`
- `nodeBonuses.yieldCount`
- `nodeBonuses.extraRate`
- `objectiveMode`
- `debugMode` / `manualMemoCapacityPower`，僅進階診斷。

### 一般採集實驗

Engine: `SimulationRequest`

Runtime 來源：

- `baseValues`
- `itemLevel`
- `jobType`
- `isTimedNode`
- `nodeBonuses.baseIntegrity`

使用者 / 設定來源：

- `stats`
- `temporaryGp`
- `nodeBonuses.gatheringCount`
- `nodeBonuses.yieldCount`
- `nodeBonuses.extraRate`
- `primaryRotation`
- `revisitRotation`
- `includeRevisit`

### 收藏品秘笈

Engine: `CollectableSolverRequest`

Runtime 來源：

- `baseValues`
- `itemLevel`
- `jobType`
- `isTimedNode`
- `nodeBonuses.baseIntegrity`
- `rewardTable`

使用者 / 設定來源：

- `stats`
- `temporaryGp`
- `nodeBonuses.gatheringCount`
- `objective`
- `objectiveMode`
- `hasRelicToolBonus`
- `debugMode` / `manualMemoCapacityPower`，僅進階診斷。

收藏品秘笈通常不需要 `yieldCount` 或 `extraRate`。若 UI 共用 `NodeBonuses` 型別，這兩個欄位可能存在，但不代表它們是收藏品核心輸入。

### 收藏品實驗

Engines:

- `CollectableStrategyBuildRequest`
- `analyzeCollectableStrategyTree(...)`

Runtime 來源：

- `baseValues`
- `itemLevel`
- `jobType`
- `isTimedNode`
- `nodeBonuses.baseIntegrity`
- `rewardTable`

使用者 / 設定來源：

- `stats`
- `temporaryGp`
- `nodeBonuses.gatheringCount`
- `hasRelicToolBonus`
- `rules`
- `objective`
- `maxNodes` 為 UI / safety 設定，不屬於使用者要分享的核心設置。

## 分享連結設計規範

快速分享連結的目標是讓接收者用最少步驟重建同一個頁面設置。建議 payload 分成三層：

1. 必填：`schemaVersion`、surface/scenario、`itemId`。
2. 使用者設置：玩家數值、當前 GP、食物、節點 bonus、遺物效果、偏好、實驗手法或 rules。
3. 選填 snapshot：只在需要降級提示、離線預覽或 debug 時攜帶 runtime snapshot。

一般快速分享不應把下列欄位當成必要內容：

- `baseValues`
- `itemRealLevel`
- `baseIntegrity`
- `rewardTable`
- action name / icon
- item name
- formula debug
- solver / analyzer output

若要追求可驗證、可比較或 bug report，請使用完整 JSON 匯出語意，而不是把完整證據包塞進快速分享 URL。

## 儲存與匯入規範

- 藏書庫與實驗資料庫可保存 runtime 欄位的 snapshot，但它們仍應被視為「保存當下參考」，不是 canonical data。
- 重新開啟或匯入時，應優先以 `itemId` 取得目前 runtime data。
- 若保存 snapshot 與目前 runtime data 不一致，應讓 UI 可以標示「保存時資料」與「目前資料」差異。
- 收藏品遺物效果、objective、實驗 rules 必須保留，因為 runtime 無法從物品重建。

## 常見錯誤

- 錯誤：看到 `CollectableSolverRequest.rewardTable` 就認為分享連結必須攜帶 reward tiers。
  - 正確：快速分享只帶 `itemId`，runtime 透過 `getCollectableRewardTable(itemId)` 重建 reward table。
- 錯誤：看到 `nodeBonuses.baseIntegrity` 就認為使用者要輸入 base integrity。
  - 正確：base integrity 由 `gatheringItemId` 查 `getItemBaseIntegrity(...)`；使用者輸入的是節點 bonus。
- 錯誤：遺物效果沒出現在物品資料就漏掉。
  - 正確：遺物效果是玩家裝備狀態，屬於使用者 / gear profile 來源，收藏品秘笈與實驗都要帶。
- 錯誤：收藏品策略表、實驗 rules 與 solver policy tree 混為一談。
  - 正確：實驗 rules 是使用者策略；solver policy / strategy codec 是秘笈輸出快照；完整 policy tree 不應塞進一般分享 URL。
