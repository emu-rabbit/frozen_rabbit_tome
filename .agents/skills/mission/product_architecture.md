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
- `gathering_math_formulas.md` 是底層公式來源，秘笈與實驗都必須遵守。
- `ffxiv_gathering_skills.md` 定義可用 action model 與目前排除的技能。
