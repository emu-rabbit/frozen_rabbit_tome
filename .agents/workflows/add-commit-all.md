---
description: 將所有變更 add 並以 Pascal-case 規範 commit 至 git。描述部分必須使用繁體中文。
---

# Git 提交工作流 (Git Commit Workflow)

## 概述
本工作流用於快速提交變更，同時確保 Commit Message 符合專案的命名與語言規範。

## 執行步驟

請 Agent 依照以下步驟執行：

1. **分析變更**：主動巡檢所有已修改或新增的檔案，並摘要變更重點。
2. **模型版本檢查**：若變更涉及求解器、模擬器、分析器、策略 codec、公式、action model、objective scoring、reward / tier 判定、模型相關重構，或會改變使用者可觀察演算結果的內容，必須確認 `src/config/modelVersions.ts` 已同步更新對應 model version。即使重構宣稱不改行為，也必須 bump，因為無法保證重構沒有改壞模型。若沒有更新，一律停止，不得 commit；除非使用者非常明確要求「即使未更新模型版本也提交」。一般的 `commit`、`add and commit all`、`提交` 不算豁免，Agent 必須先詢問使用者要 bump 哪個版本或是否明確覆寫此規則。
3. **生成訊息**：根據變更內容生成符合以下規範的 Commit Message：
    - **Header**：使用 Pascal-case（如 `Feat:`, `Fix:`, `Docs:`, `Refactor:`, `Chore:`）。
    - **內容描述**：必須使用**繁體中文**。
4. **加入暫存區**：自動將所有變更（含 Untracked 檔案）加入暫存區。
5. **執行提交**：執行 git commit 指令。

// turbo
```powershell
git add . ; git commit -m "{{COMMIT_MESSAGE}}"
```

## 核心規則
- **Pascal-case Header**：Header 的首字母必須大寫。
- **繁體中文描述**：嚴格遵守專案的 `language_policy.md`，內容部分不可使用英文或簡體中文。
- **精準摘要**：Message 應精確反映變更，避免如 "update files" 等模糊描述。
- **確認機制**：若變更涉及重大架構調整，應在提交前向使用者確認。
- **模型版本硬約束**：涉及模型內容或模型相關重構的提交必須同步更新 `src/config/modelVersions.ts` 的對應版本；未更新時不可 commit，需先詢問使用者。

## 範例
- `Feat: 建立技能系統目錄重構計畫`
- `Fix: 修正元件卸載時未清除計時器的問題`
- `Docs: 更新 README 中的技能管理說明`
