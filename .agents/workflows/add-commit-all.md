---
description: 將所有變更 add 並以 Pascal-case 規範 commit 至 git。描述部分必須使用繁體中文。
---

# Git 提交工作流 (Git Commit Workflow)

## 概述
本工作流用於快速提交變更，同時確保 Commit Message 符合專案的命名與語言規範。

## 執行步驟

請 Agent 依照以下步驟執行：

1. **分析變更**：主動巡檢所有已修改或新增的檔案，並摘要變更重點。
2. **生成訊息**：根據變更內容生成符合以下規範的 Commit Message：
    - **Header**：使用 Pascal-case（如 `Feat:`, `Fix:`, `Docs:`, `Refactor:`, `Chore:`）。
    - **內容描述**：必須使用**繁體中文**。
3. **加入暫存區**：自動將所有變更（含 Untracked 檔案）加入暫存區。
4. **執行提交**：執行 git commit 指令。

// turbo
```powershell
git add . ; git commit -m "{{COMMIT_MESSAGE}}"
```

## 核心規則
- **Pascal-case Header**：Header 的首字母必須大寫。
- **繁體中文描述**：嚴格遵守專案的 `language_policy.md`，內容部分不可使用英文或簡體中文。
- **精準摘要**：Message 應精確反映變更，避免如 "update files" 等模糊描述。
- **確認機制**：若變更涉及重大架構調整，應在提交前向使用者確認。

## 範例
- `Feat: 建立技能系統目錄重構計畫`
- `Fix: 修正元件卸載時未清除計時器的問題`
- `Docs: 更新 README 中的技能管理說明`
