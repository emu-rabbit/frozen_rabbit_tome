# Codex 專案指令

本專案使用 `.agents` 目錄保存給 Agent 的專案脈絡、技能規範與工作流程。開始任何分析、實作、設計、測試、提交或文件工作前，請先把本檔視為入口，並依任務讀取下列資料。

## 必讀核心脈絡

每次開始工作時，請先閱讀：

1. `.agents/skills/README.md`
2. `.agents/skills/core/language_policy.md`
3. `.agents/skills/core/global_standards.md`
4. `.agents/skills/mission/project_mission.md`
5. `.agents/skills/mission/brand_identity.md`
6. `.agents/skills/mission/reference_project.md`

## 任務型補充資料

若任務涉及程式碼撰寫、重構、測試、架構分析或 code review，另讀：

- `.agents/skills/professional/development_standards.md`

若任務涉及前端元件、UI、CSS、互動流程、RWD、視覺設計或可用性，另讀：

- `.agents/skills/professional/ui_ux_standards.md`

若任務涉及 FFXIV 採集、採掘師、園藝師、技能、採集節點、公式、數值、rotation、期望值或演算策略，另讀：

- `.agents/skills/business/ffxiv_gathering_knowledge.md`
- `.agents/skills/business/ffxiv_gathering_skills.md`
- `.agents/skills/business/gathering_math_formulas.md`

若使用者要求提交 git 變更，另讀：

- `.agents/workflows/add-commit-all.md`

## 核心專案理解

- `frozen_rabbit_tome` 是 Final Fantasy XIV 大地使者採集策略工具，重點是採掘師與園藝師的採集 rotation 最佳化。
- 本專案的核心目標是根據玩家屬性、GP、採集次數、節點特性與技能效果，計算總獲得量期望值或收藏價值最大的策略。
- 漁師機制與採掘師、園藝師差異較大，目前不要把漁師納入核心演算。
- 採集演算必須遵循 `.agents/skills/business/gathering_math_formulas.md` 中的分段函數與數值規範，不可用簡單線性假設替代。
- 品牌為 Frozen Rabbit，語氣應像友善且專業的朋友：親切、可靠、方便上手。
- UI 與視覺風格應參考姊妹專案 `frozen_rabbit_workshop`，但不能為一致性犧牲本專案的策略演算與工具便利性。

## 固定行為規範

- 回覆使用者、撰寫文件、撰寫任務說明時，預設使用繁體中文。
- 技術關鍵字、程式碼識別字、套件名稱與無通用譯名的專有名詞可保留英文。
- 修改程式碼時，遵循既有專案風格，保持變更聚焦，不主動重構無關 legacy code。
- 前端實作需重視元件小型化、關注點分離、無障礙性、RWD 與一致的設計系統。
- 若 `.agents` 內的舊文件提到 Antigravity 專用工具或舊路徑，請理解其意圖並改用目前 Codex 可用的檔案讀取與 shell 工具完成同等工作。
