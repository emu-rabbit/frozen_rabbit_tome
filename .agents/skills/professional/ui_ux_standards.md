# UI/UX 與視覺規範 (UI/UX Standards)

## 概述
本技能旨在確保專案的前端介面不僅具備良好的程式架構，同時在視覺與互動上也符合高品質的設計準則。

## 觸發條件
- 建立或修改前端元件 (Components) 時。
- 調整樣式 (CSS)、佈局 (Layout) 或色彩系統時。
- 設計新的使用者互動流程時。

## 核心規則
### 前端架構 (Frontend)
- **元件小型化**：元件應保持小型且高度可重用。
- **關注點分離**：明確分離 UI 呈現與業務邏輯（Logic）。
- **樣式一致性**：使用專案定義的 CSS 變數或設計系統，禁止使用 ad-hoc 的隨機樣式。
- **扁平結構**：避免過深的元件巢狀結構，減少層級複雜度。
- **退場機制**：若使用 `setTimeout`, `setInterval` 或訂閱監聽，必須在元件卸載時正確清除。

### 設計美學 (Design)
- **配色系統**：嚴格遵守專案定義的調色盤，維持視覺一致性。
- **間距規範**：使用統一的間距（Spacing）單位（如 4px/8px 倍數）。
- **視覺層級**：透過字體大小、顏色深淺與陰影建立清晰的資訊優先級。
- **留白美感**：避免畫面擁擠，確保足夠的空白區域（Negative Space）。
- **易用性與協調**：關鍵要素必須易於視覺抓取（Focus），但不可與整體設計格格不入。

### Vue Scoped CSS 與暗黑模式 (Dark Mode)
- **優先使用既有 Tailwind `dark:` class**：若樣式可直接寫在 template 上，優先使用專案既有的 `dark:bg-*`、`dark:text-*`、`dark:border-*` 等 class，這是本專案目前最穩定的暗黑模式寫法。
- **Scoped CSS 的 `:global` 必須包住完整 selector**：在 Vue SFC 的 `<style scoped>` 中，不可寫 `:global(.dark) .foo` 或 `:global(html.dark) .foo`。這類寫法可能被編譯成只套用在 `.dark` / `html.dark` 根節點本身，例如 `.dark { ... }`，導致目標元件沒有暗黑樣式，甚至污染整個暗黑模式根節點。正確寫法是 `:global(.dark .foo)` 或 `:global(html.dark .foo)`。
- **避免錯誤的根節點覆寫**：若 build 後 CSS 出現 `.dark { color/background/border/box-shadow: ... }`，通常代表 scoped dark selector 寫錯。必須修正為完整 global selector，避免暗黑模式下 hover、focus、儲存成功等動畫反饋顏色套到根節點，造成整體畫面色彩異常。
- **暗黑模式反饋色要降低亮度**：hover、focus ring、儲存成功、完成狀態等反饋在暗黑模式下不可直接沿用亮色模式的高飽和背景與陰影。應降低 opacity、使用較深的背景疊色，並保持文字對比足夠，避免看起來過亮或螢光感太重。
- **修正後必須驗證編譯結果**：涉及 scoped CSS、暗黑模式或互動反饋時，除了執行 `npm run build`，也應檢查 build 後 CSS 是否產生預期 selector（例如 `html.dark .tome-card`），必要時用瀏覽器 computed style 驗證實際背景、邊框、文字與陰影顏色。

## 執行步驟
1. 設計元件時，先列出其所需的 Props 與狀態，並判斷是否可拆分為更小的子元件。
2. 在調整 CSS 時，優先查找全域變數而非直接寫死數值。
3. 實作互動（如計時器）時，第一時間寫好 `onUnmounted` 或對應的清除邏輯。

## 範例
- **正確**：將 API 請求邏輯放在 Hook 中，元件僅負責渲染數據。
- **正確**：使用 `var(--primary-color)` 而非 `#ff0000`。
- **錯誤**：在單一 Vue/React 檔案中寫了 500 行代碼，混合了大量的 API 調用與樣式調整。

## 注意事項
- 在追求視覺美感時，不可犧牲網頁無障礙性 (Accessibility)。
- 元件重用前，請先確認是否會導致過度耦合。
