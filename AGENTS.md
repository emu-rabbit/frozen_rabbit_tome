# Codex 專案指令

本專案使用 `.agents` 目錄保存給 Agent 的專案脈絡、技能規範、研究紀錄與工作流程。開始任何分析、實作、設計、測試、提交或文件工作前，請先把本檔視為唯一初階入口，並依任務讀取下列資料。

除本 `AGENTS.md` 外，`.agents` 內的 Markdown 不會保證被 Codex 自動載入；後續 Agent 必須依本檔路由主動讀取需要的文件。舊的 `.agents/skills/README.md` 與 `.agents/workflows/init-skills.md` 已移除，初階導覽與技能索引由本檔統一承擔。

## 讀檔編碼規範

- 讀取本專案任何 `.agents`、skill、workflow 或 Markdown 脈絡檔案時，請務必明確使用 UTF-8 編碼。
- 在 Windows PowerShell 中請使用 `Get-Content -Encoding UTF8 <path>`；不要使用未指定編碼的 `Get-Content`、`type` 或其他可能套用系統預設編碼的讀檔方式。
- 本專案主要文件使用繁體中文撰寫；若讀取結果出現 `?`、亂碼或不可辨識字元，請立刻用 UTF-8 重新讀取，不要依亂碼內容推論。

## 必讀核心脈絡

每次開始工作時，請先閱讀：

1. `.agents/skills/core/language_policy.md`
2. `.agents/skills/core/global_standards.md`
3. `.agents/skills/mission/project_mission.md`
4. `.agents/skills/mission/product_architecture.md`
5. `.agents/skills/mission/brand_identity.md`
6. `.agents/skills/mission/reference_project.md`

## `.agents` 目錄地圖

- **`core/`**：全域核心規範，例如語言政策與基礎行為準則。
- **`mission/`**：專案使命、產品架構、品牌識別與姊妹專案參考。
- **`professional/`**：開發實作與 UI/UX 專業標準。
- **`business/`**：FFXIV 採集知識、技能模型、公式、演算法驗證與收藏品評分規則。
- **`workflows/`**：明確任務流程，目前主要保留 git 提交流程。
- **`roadmaps/`**：產品待辦、研究報告與歷史踩坑紀錄；不一定是 active 指令，讀取時需注意文件自身標示。

## 技能索引

### Core

- `.agents/skills/core/language_policy.md`：規定回覆、任務說明與文件預設使用繁體中文。
- `.agents/skills/core/global_standards.md`：定義分析方式、回應風格、編碼與安全讀寫規範。

### Mission

- `.agents/skills/mission/project_mission.md`：專案定位、產品目標與不可宣稱「最佳 / 唯一正解」的邊界。
- `.agents/skills/mission/product_architecture.md`：秘笈 / 實驗分工、收藏品秘笈現況與文案邊界。
- `.agents/skills/mission/brand_identity.md`：Frozen Rabbit 品牌人格、語氣與視覺方向。
- `.agents/skills/mission/reference_project.md`：姊妹專案 `frozen_rabbit_workshop` 的視覺、資料與 i18n 參考。

### Professional

- `.agents/skills/professional/development_standards.md`：程式碼風格、重構、測試與維護要求。
- `.agents/skills/professional/ui_ux_standards.md`：前端元件、RWD、無障礙與一致設計系統要求。

### Business

- `.agents/skills/business/ffxiv_gathering_knowledge.md`：採集系統背景、玩法分類、reward model 邊界。
- `.agents/skills/business/ffxiv_gathering_skills.md`：普通採集與收藏品 action model、支援技能與排除項目。
- `.agents/skills/business/gathering_math_formulas.md`：採集成功率、產量、收藏品提煉、proc 與未知公式邊界。
- `.agents/skills/business/algorithm_verification.md`：演算法測試分層、golden scenario、oracle、debug/export 驗證規範。
- `.agents/skills/business/collectable_objective_scoring.md`：收藏品 objective scoring、tier counts 與自訂權重設計。

### Roadmaps / Research

- `.agents/roadmaps/shikhu-feedback-todo.md`：Shikhu 回饋收斂出的產品與技術待辦，不代表全部都要立即實作。
- `.agents/roadmaps/collectable-solver-research-history.md`：歷史研究與踩坑紀錄；用來避免重複錯誤，不是 active roadmap。

## 任務型補充資料

若任務涉及程式碼撰寫、重構、測試、架構分析或 code review，另讀：

- `.agents/skills/professional/development_standards.md`

若任務涉及前端元件、UI、CSS、互動流程、RWD、視覺設計或可用性，另讀：

- `.agents/skills/professional/ui_ux_standards.md`

若任務涉及 FFXIV 採集、採掘師、園藝師、技能、採集節點、公式、數值、rotation、期望值或演算策略，另讀：

- `.agents/skills/business/ffxiv_gathering_knowledge.md`
- `.agents/skills/business/ffxiv_gathering_skills.md`
- `.agents/skills/business/gathering_math_formulas.md`

若任務涉及核心演算法測試、debug trace、可復現輸出、第三方驗證、golden scenario、oracle 或研究用途資料，另讀：

- `.agents/skills/business/algorithm_verification.md`

若任務涉及收藏品求解器、WASM、policy tree、策略台、score / tier counts、debug export 或 OOM / memo capacity，另讀：

- `.agents/skills/business/collectable_objective_scoring.md`
- `.agents/skills/business/algorithm_verification.md`
- `.agents/roadmaps/collectable-solver-research-history.md`

若任務是在整理產品待辦、Shikhu 回饋、策略台 UI 或研究者分享 / 匯出方向，另讀：

- `.agents/roadmaps/shikhu-feedback-todo.md`

若使用者要求提交 git 變更，另讀：

- `.agents/workflows/add-commit-all.md`

## 核心專案理解

- `frozen_rabbit_tome` 是 Final Fantasy XIV 大地使者採集策略工具，重點是採掘師與園藝師的採集 rotation 最佳化。
- 本專案的核心目標是根據玩家屬性、GP、採集次數、節點特性與技能效果，在目前支援模型內推薦較高期望值或較符合評分偏好的採集策略；對外不可宣稱全域最佳或唯一正解。
- 漁師機制與採掘師、園藝師差異較大，目前不要把漁師納入核心演算。
- 採集演算必須遵循 `.agents/skills/business/gathering_math_formulas.md` 中的分段函數與數值規範，不可用簡單線性假設替代。
- 收藏品求解器目前是 WASM-first 架構；涉及收藏品核心、policy、debug/export 或效能時，必須同時理解 WASM core、TS wrapper / fallback 與 parity 測試。
- 品牌為 Frozen Rabbit，語氣應像友善且專業的朋友：親切、可靠、方便上手。
- UI 與視覺風格應參考姊妹專案 `frozen_rabbit_workshop`，但不能為一致性犧牲本專案的策略演算與工具便利性。

## 固定行為規範

- 回覆使用者、撰寫文件、撰寫任務說明時，預設使用繁體中文。
- 技術關鍵字、程式碼識別字、套件名稱與無通用譯名的專有名詞可保留英文。
- 修改程式碼時，遵循既有專案風格，保持變更聚焦，不主動重構無關 legacy code。
- 前端實作需重視元件小型化、關注點分離、無障礙性、RWD 與一致的設計系統。
- 使用目前 Codex 可用工具完成工作：搜尋優先用 `rg`，讀取中文 Markdown 明確使用 UTF-8，手動編輯優先用 `apply_patch`。
- 若 `.agents` 內的舊文件提到 Antigravity 專用工具、舊式檔案讀寫工具或舊路徑，請理解其意圖並改用目前 Codex 可用的檔案讀取、`apply_patch` 與 shell 工具完成同等工作。
