---
description: 在新對話開始前，確保agent詳讀Skill並使用
---

# 核心技能初始化 (Initialize Core Skills)

當新對話開始時，請執行此工作流以載入專案的核心規範與技能。

## 步驟

1. **讀取技能總覽**：讀取 [@.agents/skills/README.md](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/README.md) 以瞭解技能架構。
2. **載入核心規範**：依序讀取 `core/` 目錄下的所有檔案。
   - [語言政策 (language_policy.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/core/language_policy.md)
   - [全域標準 (global_standards.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/core/global_standards.md)
   > [!IMPORTANT]
   > 必須使用 `view_file(IsSkillFile: true)` 來讀取這些檔案，以確保規則被寫入系統提示。
3. **載入專案使命**：讀取 `mission/` 目錄下的關鍵檔案以瞭解專案目標。
   - [專案目標 (project_mission.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/mission/project_mission.md)
   - [品牌識別 (brand_identity.md)](file:///c:/Users/User/Documents/GitHub/frozen_rabbit_tips/.agents/skills/mission/brand_identity.md)
4. **確認狀態**：完成後，請向使用者確認核心技能已載入，並根據 `language_policy.md` 開始使用繁體中文進行後續溝通。
