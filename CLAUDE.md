# frozen_rabbit_tome — Claude Agent 入口

本文件是 Claude Code 的自動載入入口。開始任何工作前請先閱讀本文件。

---

## 專案簡介

**frozen_rabbit_tome** 是 Final Fantasy XIV 大地使者（採掘師、園藝師）的採集策略工具。
核心目標：根據玩家屬性、GP、採集次數、節點特性與技能效果，協助玩家規劃採集手法。

**品牌**：Frozen Rabbit（冷凍兔肉）— 語氣如友善且專業的朋友：親切、可靠、方便上手。

### 兩大系統

| 系統 | 路由 | 定位 |
|------|------|------|
| **秘笈（Solver）** | `/solver` | 使用者輸入條件，系統輸出「推薦手法」 |
| **實驗（Simulator）** | `/simulator` | 使用者輸入手法，系統模擬結果與分析 |

> **重要**：不可宣稱輸出為「最佳」、「最優」、「唯一正解」。一律使用「推薦」、「建議」、「模擬結果」等保守語氣。

---

## 語言規範

- 預設使用**繁體中文**回覆使用者、撰寫文件、撰寫任務說明
- 技術關鍵字、程式碼識別字、套件名稱、無通用譯名的專有名詞可保留英文
- 禁止使用簡體中文

---

## 技術棧

- **框架**：Vue 3 + TypeScript + Vite
- **UI**：PrimeVue v4 + Tailwind CSS 3
- **路由**：Vue Router 4
- **多語系**：Vue I18n（繁中 tw / 簡中 cn / 日文 ja / 英文 en）
- **狀態**：@vueuse/core（composables + localStorage）
- **測試**：Vitest（單元）、Playwright（E2E）
- **運算**：Web Worker（solver.worker.ts 於背景執行求解）

---

## 三大設計準則

1. **資料正確性**：演算邏輯必須嚴格對應遊戲機制；公式有疑問時須停下來詢問開發者，不得自行猜測
2. **以人為本的 UX**：核心流程（輸入 → 得到結果）須流暢無干擾；深度功能不應阻礙主線操作
3. **輔助功能與舒適度**：維持 I18n 四語系、Light/Dark Mode、RWD（禁止 overflow、跑版）

---

## 固定行為規範

- 修改程式碼時遵循既有專案風格，保持變更聚焦，不主動重構無關 legacy code
- 前端實作需重視元件小型化、關注點分離、無障礙性、RWD 與一致設計系統
- 新增使用者可見文案時，改用 `recommendation`、`suggested`、`simulation`、`analysis` 等詞，避免 `best`、`optimal`
- 視覺風格參考姊妹專案 `frozen_rabbit_workshop`（主色 `#52a890`，深色背景 `slate-950`）

---

## 必讀文件（每次工作前）

詳細規範在 `.agents/skills/` 目錄，每次工作前必須閱讀下列核心文件：

1. `.agents/skills/core/language_policy.md` — 繁體中文語言規範
2. `.agents/skills/core/global_standards.md` — 思考邏輯與回應風格
3. `.agents/skills/mission/project_mission.md` — 專案目標與三大設計準則
4. `.agents/skills/mission/product_architecture.md` — 秘笈與實驗的分工邊界
5. `.agents/skills/mission/brand_identity.md` — Frozen Rabbit 品牌語氣與視覺
6. `.agents/skills/mission/reference_project.md` — 姊妹專案視覺同步規範

---

## 任務型補充文件

| 任務類型 | 需額外閱讀 |
|----------|-----------|
| 程式碼撰寫、重構、測試、Code Review | `.agents/skills/professional/development_standards.md` |
| 前端元件、UI、CSS、RWD、視覺設計 | `.agents/skills/professional/ui_ux_standards.md` |
| FFXIV 採集機制、公式、技能、rotation | `.agents/skills/business/ffxiv_gathering_knowledge.md`、`ffxiv_gathering_skills.md`、`gathering_math_formulas.md` |
| 收藏品求解器實作 | `.agents/skills/business/collectable_solver_design.md`、`collectable_solver_v1_implementation.md` |
| Git 提交 | `.agents/workflows/add-commit-all.md` |

---

## 讀檔編碼注意事項

- 讀取任何 `.agents/`、skill、workflow 或 Markdown 文件時，請務必使用 **UTF-8** 編碼
- Windows PowerShell 請使用 `Get-Content -Encoding UTF8 <path>`
- 若讀取結果出現 `?` 或亂碼，立即以 UTF-8 重新讀取，不要依亂碼推論
