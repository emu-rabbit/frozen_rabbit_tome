# 技能系統管理規範 (Skill System Management)

## 概述
本專案採用分類目錄來管理 Agent 的技能檔案。本規範定義了這些目錄的用途，以及 Agent 應該如何識別並應用它們。

## 目錄結構
- **`core/`**：包含全域核心規範（如語言政策、基本思考邏輯）。Agent 啟動時必須載入。
- **`professional/`**：包含開發實作、UI/UX 等專業領域標準。Agent 執行開發任務時應主動讀取。
- **`business/`**：包含業務背景知識（如 FFXIV 資料、數值邏輯）。Agent 處理特定業務需求時應以此為準。
- **`mission/`**：包含專案的最終目標與願景。Agent 應以此作為決策的大方向。

## 目前技能清單 (Skill Inventory)
以下為目前專案中已存在的技能檔案，供 Agent 快速索引：

### 1. 核心規範 (Core)
- [語言政策 (language_policy.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/core/language_policy.md)：規定所有通訊與文件皆使用繁體中文.
- [全域標準 (global_standards.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/core/global_standards.md)：定義專案基礎開發準則。
 
 ### 2. 專業標準 (Professional)
- [開發標準 (development_standards.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/professional/development_standards.md)：具體的代碼風格與技術要求。
- [UI/UX 標準 (ui_ux_standards.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/professional/ui_ux_standards.md)：介面設計美學與交互規範。
 
 ### 3. 業務知識 (Business)
- [FFXIV 採集知識 (ffxiv_gathering_knowledge.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/business/ffxiv_gathering_knowledge.md)：遊戲內採集系統的背景資訊。
- [採集數學公式 (gathering_math_formulas.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/business/gathering_math_formulas.md)：用於計算成功率與產量的核心算法。
- [收藏品求解系統設計 (collectable_solver_design.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tome/.agents/skills/business/collectable_solver_design.md)：收藏品求解器的待解問題、資料來源、公式、reward model、演算法與 UIUX 設計。
 
 ### 4. 專案使命 (Mission)
- [品牌識別 (brand_identity.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/mission/brand_identity.md)：定義 Frozen Rabbit 的視覺與人格設定。
- [專案目標 (project_mission.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/mission/project_mission.md)：本專案的最終願景。
- [參考專案 (reference_project.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/mission/reference_project.md)：與姊妹專案的連結與差異。

## 核心規則
- **自動遞迴搜尋**：Agent 在尋找技能時，必須主動搜尋 `.agents/skills/` 目錄下的所有子目錄。
- **動態加載**：當任務涉及特定領域（如前端開發）時，Agent 必須主動檢查 `professional/` 或 `business/` 下是否有相關技能。
- **一致性維護**：所有新增的技能必須放置於對應的分類目錄中，禁止直接散落在 `.agents/skills/` 根目錄下。

## 執行步驟
1. 每次對話開始或接到新任務類型時，巡檢 `skills/` 目錄。
2. 使用 `view_file(IsSkillFile: true)` 載入符合當前語境的技能。
3. 若發現技能之間有衝突，優先以 `core/` 下的規則為準，次之為 `mission/`。

## 注意事項
- 本 `README.md` 檔案本身即是一項 Skill，定義了系統運作邏輯。
- 當新增技能檔案時，應主動更新此 README 的「目前技能清單」。
