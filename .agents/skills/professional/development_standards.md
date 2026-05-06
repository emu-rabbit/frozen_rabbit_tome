# 開發實作規範 (Development Standards)

## 概述
本技能定義了本專案的開發基準。包含程式碼的編寫習慣、邏輯組織以及測試的最低要求。

## 觸發條件
- 撰寫、修改或重構任何程式碼時。
- 撰寫單元測試或整合測試時。
- 進行 Code Review 或分析現有程式碼架構時。

## 核心規則
### 程式碼撰寫 (Coding)
- **命名一致性**：變數與函式使用 `camelCase`，類別與介面使用 `PascalCase`。
- **單一責任 (SRP)**：每個函式應保持簡短且僅專注於完成一件事情。
- **減少巢狀**：優先使用 `early return` 邏輯。
- **防禦性編程**：必須明確處理錯誤（try/catch 或 Result 模式），禁止忽視 Error。
- **非同步安全**：正確使用 `async/await`，嚴禁出現未處理（unhandled）的 Promise。
- **簡單邏輯**：避免使用過於晦澀或複雜的邏輯技巧，以易讀性為重。

### 測試品質 (Testing)
- **邊界覆蓋**：測試必須包含極端值與邊界條件 (Edge Cases)。
- **失敗測試**：必須驗證系統在失敗情境下（Failure Cases）的反應。
- **語意化命名**：測試名稱需清楚描述測試的情境與預期結果。
- **最小化 Mock**：避免不必要的 Mock，優先使用真實邏輯或簡易 Stub 以維持測試真實性。

## 執行步驟
1. 撰寫程式碼前，先規劃函式的輸入輸出與錯誤處理機制。
2. 完成實作後，檢查是否存在過深的巢狀結構並進行重構。
3. 為該功能撰寫包含成功與失敗情境的測試。

## 範例
- **正確 (Early Return)**：
  ```typescript
  function process(data) {
    if (!data) return;
    // 執行主要邏輯
  }
  ```
- **正確 (Error Handling)**：
  ```typescript
  try {
    const result = await fetchData();
  } catch (error) {
    logger.error("擷取資料失敗", error);
  }
  ```

## 注意事項
- 在處理 Legacy Code（舊有程式碼）時，若發現不符合此規範，請先完成其他工作，最後將此狀況回報，得到使用者明確的同意後才可以修改舊有程式碼。
