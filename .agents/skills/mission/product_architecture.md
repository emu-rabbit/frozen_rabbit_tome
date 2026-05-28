# 產品架構：秘笈與實驗

## 概述

`frozen_rabbit_tome` 的網頁目前分成兩大系統：**秘笈**與**實驗**。後續 Agent 在設計資訊架構、命名、UI 文案、路由、元件或演算功能時，必須先用這個分工理解專案。

## 兩大系統定位

### 秘笈

秘笈負責 **求解器 (Solver)**。

- 使用者輸入特定條件，例如玩家數值、GP、採集次數、節點特性、物品與求解目標。
- 系統根據已知公式與支援的技能集合，計算並輸出一組或多組 **推薦技能手法**。
- 秘笈的輸出是「推薦」，不是絕對真理。
- UI、文件與程式命名都不可宣稱「最佳」、「最優」、「絕對最大化」或「唯一正解」。
- 若內部演算法使用 DP、搜尋、剪枝、期望值排序或 reward scoring，對使用者仍應呈現為「推薦」、「較高期望」、「依目前模型推算」等保守語氣。
- 當資料不完整、公式未確認或模型排除某些技能時，必須清楚標示限制，不能把排除後的結果包裝成全域最佳。

### 實驗

實驗負責 **模擬器與分析器 (Simulator / Analyzer)**。

- 使用者在特定條件下，自行輸入或組合想測試的技能手法。
- 系統依照採集公式、隨機事件模型與目前支援的規則進行模擬。
- 系統分析該手法的結果，例如期望獲得量、收藏價值分布、GP 使用、耐久消耗、失敗風險、觸發條件與可能瓶頸。
- 實驗可以提供比較與洞察，但不應自動把某個手法宣稱為最佳。
- 若分析中出現「比另一個手法高」的結論，需明確限定在使用者提供的條件、樣本、模型與比較集合內。

## Agent 命名與文案規範

- 對外文案優先使用「推薦手法」、「推薦策略」、「模擬結果」、「分析結果」。
- 避免使用「最佳手法」、「最優解」、「完美 rotation」、「唯一正解」等絕對化說法。
- 程式內部若已有 `solver`、`optimize`、`best` 等 legacy 命名，不必為了文字潔癖大規模重構；新增使用者可見文案與新架構命名時，應改用 `recommendation`、`suggested`、`experiment`、`simulation`、`analysis` 等較符合定位的詞。
- 若必須描述演算法排序，可使用「依目前模型評分最高」、「在支援範圍內排序較前」、「推薦候選」。

## 功能歸屬判斷

- 需要系統自動產生手法、排序候選或給出建議：放在 **秘笈**。
- 需要使用者輸入手法，然後查看結果、分布、風險或比較：放在 **實驗**。
- 同一組底層公式與 action model 可以被兩邊共用，但 UI 心智模型必須分開。
- 公式、資料與狀態模型應盡量共用，避免秘笈與實驗對同一技能算出不一致結果。

## 持久儲存、匯出與版本語意

後續 Agent 設計 Tome Library、Experiment Database、JSON 匯出 / 匯入、比較器或跨裝置分享時，請先區分「本地持久儲存」與「完整交換檔」的產品意義。

### 本地持久儲存

- 藏書庫與實驗資料庫是管理用的輕量索引，不是完整證據包倉庫。
- 秘笈藏書庫的 canonical data 應是「可重現求解條件」：物品、玩家數值、GP、食物、節點加成、objective / scoring preference、reward table 或 reward source、限時點、relic bonus 等。
- 秘笈求解結果若被保存，只能視為 `lastSolvedSnapshot`：可供卡片預覽、上次推薦摘要或離線參考，但不能當成永遠正確的答案。開啟或重新求解時，應以目前版本模型重新計算，並在版本不同或結果不同時清楚標示「保存時快照」與「目前推薦」。
- 收藏品秘笈若保存完整推薦策略，應保存無損 `strategyCodec` / 策略表，而不是巢狀 `policy tree` 或完整 debug blob。`strategyCodec` 仍屬於輸出快照，應帶版本與來源資訊。
- 實驗資料庫則可以、也應該保存使用者指定的手法或策略；實驗的核心需求就是重放與分析使用者輸入，不同於秘笈的「依目前模型推薦」。
- 匯入 JSON 後若要存進藏書庫或實驗資料庫，應由使用者確認，並把完整 JSON 依目標頁面剪枝 / 投影成卡片資料，不應原封不動塞進 localStorage。

### 下載 JSON / 分享檔

- 下載 JSON 是完整交換格式，可比本地儲存更完盡。使用者按下載時不需要在「簡易版 / 完整版」間選擇；預設應輸出可攜、可驗證、可匯入、可比較的完整資料包。
- 完整 JSON 可包含 input、solver / simulator / analyzer output、strategyCodec、debug summary、搜尋統計、公式中間值、版本資訊、已知限制與 reward table。
- 下載檔案不吃 localStorage 配額，因此可以保留研究、比較器、第三方驗證與 bug report 所需的較完整資料。
- 匯入功能應依 `manifest.scenario` 判斷用途：匯入到藏書庫時重建條件與小型摘要；匯入到實驗台時重建使用者手法 / strategy rules；匯入到比較器或驗證工具時可直接使用完整 JSON。

### 版本管理原則

- `package.json` 的 app version 代表產品發行版，不應單獨用來判斷求解、模擬或分析結果是否相容。
- 現行模型版本來源為 `src/config/modelVersions.ts`，並已輸出 scenario-aware 的 `modelVersions`。版本更新單位應以「使用者可觀察結果是否可能改變」或「模型相關實作是否被修改 / 重構」為準，而不是把所有內部公式、action model、資料來源拆成第一層必填版本。
- 第一版建議依情境只輸出相關欄位，例如：
  - `tome.regular`：`exportSchema`、`app`、`regularSolver`。
  - `tome.collectable`：`exportSchema`、`app`、`collectableSolver`、`collectableStrategyCodec`。
  - `experiment.regular`：`exportSchema`、`app`、`regularSimulator`、`regularAnalyzer`。
  - `experiment.collectable`：`exportSchema`、`app`、`collectableSimulator`、`collectableAnalyzer`。
- `formulaVersion`、`actionModelVersion`、`gameDataVersion` 可作為內部 release note、debug 或長期擴充欄位，但第一版不應要求所有 JSON 都獨立維護這三個板號。若公式、技能模型或資料來源改動會影響結果，應 bump 對應的 solver / simulator / analyzer model version。
- 提交硬約束：涉及求解、模擬、分析、策略 codec、公式、action model 或模型相關重構的變更，若尚未同步 bump `src/config/modelVersions.ts` 對應模型版本，Agent 不得執行 `git commit`。即使重構宣稱不改行為，也應 bump；除非使用者明確要求不更新模型版本也提交，否則 Agent 在 commit 前必須停下詢問。
- 純 `.agents` / Markdown 文件更新不納入 model version 管理。文件應反映目前真實模型、產品邊界與維護規則；修正文件本身不會改變 solver / simulator / analyzer 行為。若同一任務同時修改模型實作與文件，是否 bump 由實作變更決定。

## 一般採集秘笈現況

一般採集秘笈目前是 WASM-first 架構，後續 Agent 應以既有玩家路徑為基礎維護，不要再把一般採集 WASM 視為 POC 或未接線功能。

- 現有核心檔案：
  - `assembly/regularGatheringSolverCore.ts`：一般採集 WASM core，負責 DP / memo / objective score / best action / search counters。
  - `src/wasm/regular-gathering-solver-core.wasm`：由 AssemblyScript 產出的核心；修改 AssemblyScript 後必須同步重建並提交。
  - `src/utils/regularGatheringWasmSolver.ts`：WASM wrapper、rotation materialization、outcome distribution 重建、Revisit combined summary 與 memo capacity 錯誤分類。
  - `src/utils/rotationSolver.ts`：TS solver；目前作為 fallback、oracle 與 parity 參考。
  - `src/workers/solver.worker.ts`：一般採集 worker；預設優先使用 WASM wrapper。只有非 memo / allocation 類 WASM 載入或執行失敗才 fallback 到 TS solver；memo capacity / allocation 問題必須回傳受控錯誤。
  - `src/composables/useSolver.ts`、`src/views/Solver.vue`：一般採集秘笈 UI 與 memo capacity warning gate。
- 使用者可見的 `bestRotation` 與 `rotationPlans` 必須維持既有 TS solver 的 rotation shape；數值一致但 action 順序不同時，不能視為可接受的正式行為。
- 高 GP / 高耐久 / 低成功率 / Revisit 的壓力案例應放在 benchmark 或 diagnostic，不應塞進預設 unit test。

### WASM 與 TS 雙實作同步約束

一般採集與收藏品的正式求解路徑雖然是 WASM-first，但 TS mechanics / math / solver 仍同時承擔實驗、結果物化、fallback、oracle 與 parity 參考。AssemblyScript WASM core 不是 TS mechanics 的自動編譯產物，而是另一份 solver 熱路徑實作；後續 Agent 不可假設改了 `src/utils/*Math.ts`、`src/utils/*Mechanics.ts` 或 TS solver 就會自動更新 WASM 行為，也不可假設改了 `assembly/*SolverCore.ts` 就已同步實驗與 TS fallback。

凡是修改公式、action model、狀態欄位、state key、狀態轉移、objective scoring、tie-break、reward / tier 判定、Revisit 或 memo / policy 查詢語意，都必須檢查 TS 與 WASM 兩側是否需要同步修改。若刻意只改其中一側，必須能說明另一側為何不受影響，並用 parity / oracle / benchmark 或測試範圍說明支撐該判斷。

## 收藏品秘笈現況

收藏品採集已不是「施工中」的空入口；後續 Agent 應以目前已存在的收藏品求解器為基礎維護，而不是重開大型規劃。

- 現有核心檔案：
  - `src/utils/collectableMath.ts`：收藏品公式、reward tier、reward vector scoring。
  - `assembly/collectableSolverCore.ts`：收藏品 WASM core，負責 DP / memo / objective score / best action / search counters。
  - `src/wasm/collectable-solver-core.wasm`：由 AssemblyScript 產出的收藏品 WASM 核心。
  - `src/utils/collectableWasmSolver.ts`：WASM wrapper、memo capacity 選擇、TS/WASM result 組裝與錯誤分類。
  - `src/utils/collectableWasmPolicy.ts`：沿 WASM 選出的 action 重建使用者可讀 policy tree。
  - `src/utils/collectableSolver.ts`：TS 版 DP + memo policy search；目前作為 fallback、oracle 與 parity 參考，不應被視為唯一正式核心。
  - `src/workers/collectableSolver.worker.ts`：收藏品 worker；預設優先走 WASM，WASM 一般失敗時才 fallback 到 TS solver。若失敗原因是 memo capacity / allocation，應回傳受控錯誤，不要改回高壓 JS 路徑硬算。
  - `src/services/collectableRewards.ts`：純收藏品、老主顧、薩雷安魔法大學與珠串萬貨街 reward table 載入。
  - `src/services/collectableActions.ts`：收藏品 action id、名稱與 icon fallback。
  - `src/components/CollectableSolverPanel.vue`、`CollectablePolicyView.vue`、`CollectableDebugDialog.vue`：收藏品秘笈 UI。
  - `src/types/collectable.ts`：收藏品 request、result、policy tree 與儲存型別。
- 收藏品結果是 **policy tree / 判斷表**，不是固定 linear rotation；藏書庫儲存的也應是 policy preview。
- 收藏品秘笈不提供巨集。若使用者要照指定手法跑結果，應歸入實驗系統。
- 目前可依 `expected`、`min`、`max` 等模式排序；對外仍只能稱「推薦」或「依目前模型推算」。
- 若調整 WASM core、TS fallback、policy materialization 或剪枝策略，必須讀 `.agents/skills/business/algorithm_verification.md` 與 `.agents/roadmaps/collectable-solver-research-history.md`，並確認 outcome distribution、reward/tier counts 與可達尾端沒有被破壞。
- Debug 必須保留限制提示：`Brazen / 大膽提煉`、`Collector's High Standard / 強化洞察` 與精選 reward model 仍不納入目前秘笈推薦。

## 與既有 Skill 的關係

- `project_mission.md` 定義專案目標，本文件定義目前產品架構與文案邊界。
- `runtime_input_boundaries.md` 定義物品選定後 runtime 可重建資料、使用者 / 設定檔輸入、以及 engine request 的分界；設計分享連結、匯入、儲存或 URL schema 時必須同讀，避免把 solver request 欄位誤判為使用者必填。
- `gathering_math_formulas.md` 是底層公式來源，秘笈與實驗都必須遵守。
- `ffxiv_gathering_skills.md` 定義可用 action model 與目前排除的技能。
