# Shikhu 回饋收斂待辦

本文件整理與 Shikhu 討論後收斂出的後續方向。此文件是給未來 Agent 接手時使用的產品與技術脈絡，不代表所有項目都應立即實作。執行前仍需依任務類型讀取 `.agents/skills/` 內的核心、業務與專業規範；若任務牽涉求解器 WASM、memo capacity 或 debug/export 驗證，另讀 `.agents/skills/business/algorithm_verification.md`。

## 超簡要檢視區

### 主待辦

1. **Frontier 實驗區**
   - 用於尚未完全確認資料的機制，例如 Brazen probability distribution 與 Collector's High Standard proc rate。
   - 允許使用者手動輸入未知參數，以便實驗接近 endgame rotation 的模型。
   - 2026-05-29 已由使用者遊戲畫面確認 High Standard 的效果模型；後續又確認 Brazen 最後再 `floor`，且 `Collect` 會消耗洞察 / 強化洞察。仍未知的是 High Standard 觸發率，以及 Brazen bucket 分布。
   - 2026-05-31 已修正 Shikhu 回饋的三個 Frontier 缺口（commit `6bb8551`）：High Standard 從同一個 `Collector's Standard` / 洞察 proc pool 扣除、High Standard 輸入框上限限制為總洞察池、策略 UI 的 `Meticulous` 不耗耐久率摘要使用共用 Frontier mechanics、英文 UI 改用 `Collector's Intuition` / `Intuition rate`。
   - Frontier 模型版本已同步 bump：`dawntrailCollectableSimulator` / `dawntrailCollectableAnalyzer` 由 `v2` 到 `v3`。
   - 已收斂的第一階段實作計畫見 `.agents/roadmaps/frontier-collectable-implementation-plan.md`。

2. **報表比較功能**
   - JSON 匯出 / 匯入第一版已落地，後續可在此基礎上做兩份分析報表比較。
   - 優先考慮同類型比較，例如 regular vs regular、collectable vs collectable。

### 次要待辦

- **JSON 匯入後的差異說明**：匯入舊 JSON 或舊快照時，若保存時模型版本與目前模型版本不同，UI 應更清楚區分「保存時結果」與「目前版本重新計算結果」。

### 低優先備註

- **策略編輯器可用性**：未來可研究 rule group、fallback action、策略模板或類 nested logic 的輕量替代，但不要貿然引入複雜巢狀 UI。
- **版本差異管理**：Evercold 後繁中服與國際服可能出現技能版本差異，長期需要 scenario-aware 的 solver / simulator / analyzer model versioning。
- **第三方驗證匯入**：藏書庫與實驗資料庫目前以保存卡片為目標；若要做比較器或第三方驗證工具，仍可直接使用完整 JSON，不必先剪枝成卡片。

## 詳細內容

## 1. JSON 匯出與匯入閉環（已落地第一版）

### 背景

一般採集秘笈、收藏品秘笈、一般採集實驗與收藏品實驗的 JSON 匯出格式已建立，匯入第一版也已接到藏書庫與實驗資料庫。後續 Agent 不應再把「JSON 再匯入」當成尚未開始的大待辦；維護時應從既有 parser、projection 與保存流程延伸。

產品語意上，下載 JSON 應被視為完整交換檔，而不是本地持久儲存格式。下載按鈕不需要分成簡易版 / 完整版；使用者無腦下載時應得到可攜、可匯入、可比較、可供第三方驗證與 bug report 使用的完整資料包。本地藏書庫與實驗資料庫則是輕量管理索引，匯入保存時應從完整 JSON 投影成對應卡片。

### 已落地範圍

- `src/utils/tomeJsonImport.ts` 支援辨識 `tome.regular`、`tome.collectable`、`experiment.regular`、`experiment.collectable`。
- 藏書庫與實驗資料庫都有 JSON 匯入入口，並會依來源情境提示是否匯入到另一個資料庫比較合理。
- 匯入會重建玩家數值、食物、採集點設定、物品、objective / scoring preference、一般採集 rotation 與收藏品 strategy rules。
- 藏書庫匯入會投影成 Tome card；實驗資料庫匯入會投影成 Experiment card，不會原封不動把完整 JSON 塞進 localStorage。
- 匯入錯誤、schema 不支援與缺欄位已有 typed error 與使用者可讀提示。

### 後續維護重點

- 匯入功能目前以 `schemaVersion: 1` 的官方匯出 JSON 為主，不必為手寫或舊版不完整 JSON 建立寬鬆相容。
- 不應直接信任匯入內容覆蓋使用者既有儲存資料；保存到藏書庫或實驗資料庫仍應由使用者確認。
- 若匯入的 JSON 包含分析結果，畫面可先顯示原結果；若使用者修改輸入，則應要求重新求解或重新分析。
- 匯入流程應避免把收藏品秘笈誤呈現為固定 linear rotation；收藏品仍應維持 policy / strategy 心智模型。
- 完整 JSON 可以包含 `strategyCodec`、debug summary、搜尋統計、公式中間值與已知限制；但藏書庫 localStorage 不應預設保存完整 debug 或巢狀 policy tree。
- 收藏品秘笈若要保存推薦策略，應只保存無損策略表 / `strategyCodec`，且標示它是保存當下的求解快照，不是目前版本的唯一真相。
- 比較器 / 第三方驗證工具若要直接使用完整 JSON，可以另設入口，不必先投影成藏書庫或實驗資料庫卡片。

## 2. Frontier 實驗區

### 背景

目前正式收藏品求解器排除 `Brazen` 與 `Collector's High Standard`，原因是 Brazen 分布與 High Standard 觸發率尚未完全確認。Shikhu 表示 endgame 現行 rotation 會用到這些機制；2026-05-29 使用者提供遊戲畫面確認 `Brazen under Collector's High Standard` 為 guaranteed `Scour * 150%`，最大值 case 顯示為 `300`。後續使用者確認 Brazen 取整順序為最後再 `floor`，且 `Collect / 收藏品採集` 會消耗洞察 / 強化洞察。

2026-05-31 狀態更新：本段早期只寫「High Standard 觸發率未知」已不足以描述目前 Frontier 需要修正的狀態。High Standard 的實際觸發率仍待實證或由使用者假設輸入，但 Shikhu 回饋指出它不是獨立追加 proc，而是從一般 `Collector's Standard` / 洞察 proc pool 中分出去。此修正已於 commit `6bb8551` 落地：`probabilityProfile.standardProcRatePercent` 代表總洞察池，`highStandardProcRatePercent` 代表其中屬於 High Standard 的 percentage points，最後一般 Standard 機率為 `max(0, standardProcRatePercent - highStandardProcRatePercent)`；High Standard 輸入框上限也會限制在目前總洞察池內。因使用者可見分析結果可能改變，`src/config/modelVersions.ts` 的 `dawntrailCollectableSimulator` / `dawntrailCollectableAnalyzer` 已 bump 到 `v3`。

### User Story

作為高階玩家或研究者，我希望能手動輸入尚未確認的 proc rate 或分布，並在 Frontier 區測試接近 endgame 實際手法的模型，而不是等待所有資料完全確認。Frontier 應延續既有收藏品實驗模型，只在 `Brazen` 與 `Collector's High Standard` 這兩個差異點上加入研究假設。

### 初步範圍

- Brazen probability distribution。
- Collector's High Standard proc rate。2026-05-31 補充已落地：High Standard rate 會從一般 Standard proc pool 扣除，不可當成額外機率。
- 已確認 Brazen 取整順序為最後再 `floor`。
- 已確認 `Collect / 收藏品採集` 會消耗洞察 / 強化洞察。
- 策略 UI 的狀態摘要已反映 Frontier-only 狀態：High Standard active 時，`Meticulous` 不耗耐久率使用共用 helper 套用額外 +40 percentage points；混合狀態會自然顯示區間。
- 英文 UI 術語已改用官方 `Collector's Intuition` / `Intuition rate`，避免再以 `value increase` 或 `collectability increase` 作為使用者可見英文名稱。內部函式或 legacy key 可暫留。
- 第一版不納入 `Revisit`，只做單點採集分析。
- Frontier study 使用獨立 Frontier Studies，不進 Experiment Database。
- UI 完整度比照現有實驗台：建立、分析、儲存、再次開啟、JSON 匯出 / 匯入。
- 可能允許使用者選擇節點類型或手動覆蓋 proc rate；若實作時發現其他缺資料的收藏品機制，需先詢問使用者。

### 已討論取捨

- Frontier 區不能把未確認資料包裝成正式求解器結果。
- UI 必須明確標示「研究 / 實驗 / 未確認」。
- 正式秘笈仍應保守，不納入缺乏機率的機制。
- Frontier 的產品入口、schema、版本與儲存區應獨立；但 `Brazen` / `High Standard` 以外的已知收藏品邏輯應沿用既有模型，避免平行實作漂移。
- 這對 Evercold 之後也可能有價值，因為新資料收集需要時間。

### 2026-05-31 維護結論：Frontier mechanics 不應多套手刻

本次 Shikhu 回饋暴露一個維護風險：Frontier engine、strategy tree、策略 UI summary / applied preview 若各自重算機率或狀態效果，容易出現「engine 行為正確，但 UI 卡片摘要錯誤」的漂移。例如修正前 engine 已在 `High Standard + Meticulous` 時套用不耗耐久率 `+40 percentage points`，但策略 UI 的狀態範圍卡只看 `Priming Touch` 與基礎 `Meticulous` rate，因此混有 High Standard 節點時仍可能只顯示 25%。

已於 commit `6bb8551` 抽出小型純函式 mechanics layer，讓 engine 與 UI summary 呼叫同一份邏輯；後續若繼續擴充 Frontier，仍應避免在 Vue summary 或 tree adapter 裡重新手刻公式。現行優先 helper：

- `getFrontierIntuitionRates(profile)`：統一 Standard / High Standard proc pool 與一般 Standard 剩餘機率。
- `getFrontierMeticulousSaveRatePercent(state, context)`：統一基礎 rate、`Priming Touch`、`High Standard +40` 與 clamp。
- 未來仍可視需要新增 `getFrontierRefineGainBranches(action, state, context)` 或等價 helper，統一 `Scour`、`Meticulous`、`Brazen`、`Scrutiny` 與 `Intuition` 分支描述。

UI summary 的職責應是對目前節點集合呼叫共用 helper 後聚合成範圍或標籤，例如 `25%~65%`；不應自行判斷 High Standard、Priming Touch 或未來 Frontier-only 狀態。正式收藏品與 Frontier 可共用已確認公式與狀態轉移 helper，Frontier 只保留 `Brazen` 分布、High Standard 假設與使用者輸入 probability profile 這些差異層。

## 次要待辦 A：新增兩個報表比較功能

### 背景

Shikhu 提到一般採集模擬器 / 分析器可用於研究，例如比較 spiritbond rotation 與 normal rotation 的產出差異。這延伸成一個更通用的需求：比較兩份分析報表。

### User Story

作為想比較兩種手法的玩家，我希望能把兩份分析報表並排比較，快速看出期望值、最小值、最大值、分布與資源消耗差異。

### 可能比較內容

- expected yield / expected score。
- min / max outcome 與機率。
- outcome distribution 差異。
- GP 使用量。
- 耐久使用量。
- 採集成功或失敗風險。
- tier counts / reward vector。
- Revisit 影響前後差異。

### 取捨

- 一開始可以只支援「同類型報表」比較，例如 regular vs regular、collectable vs collectable。
- 跨系統比較容易語意混亂，應延後。
- 報表比較可沿用目前已建立的 JSON / report schema，但仍需另外設計比較 UI 與差異摘要。

## 低優先備註 A：策略編輯器可用性

### 背景

Shikhu 提出一個想法：與其重複寫多條條件，例如收藏價值滿後先 Solid Reason、再 Wise、最後 Collect，也許一個 strategy 可以包含多個 action 或 if/else 邏輯。

### 目前判斷

此方向在演算法或策略描述上合理，但 UI/UX 風險高。巢狀邏輯在手機版尤其容易變難用，也容易增加一般使用者負擔。

### 未來可研究但低優先的替代方向

- rule group。
- fallback action。
- strategy template。
- 「滿收藏價值後收尾」這類預設策略片段。
- 類 logic gate 的扁平化 UI。

### 重要取捨

不要直接實作完整巢狀條件編輯器，除非已有清楚的互動設計與手機版驗證。

## 低優先備註 B：版本差異管理

### 背景

目前繁中服與國際服都在 7.x，採集技能相容性高。但 Evercold 後可能產生版本差距，使技能效果、公式或資料來源需要版本化。

### 已落地第一版（2026-05-25）

- `src/config/modelVersions.ts` 是目前 scenario-aware model version 的唯一來源。
- JSON 匯出已在 `manifest` 相鄰區塊輸出 `modelVersions`。
- 求解器、模擬器、分析器結果與本地保存快照會保留對應 `modelVersions` 供內部辨識。
- `AGENTS.md`、`.agents/workflows/add-commit-all.md`、產品架構與演算法驗證文件已加入提交硬約束：涉及模型內容或模型相關重構但未 bump 對應 model version 時，Agent 不得 commit，除非使用者明確要求不更新版本也提交。

### 後續可能方向

- UI 讓使用者知道目前採用哪個遊戲版本模型，且在匯入舊 JSON 或舊快照時能說明「保存時結果」與「目前版本重新計算結果」的差異。

### 版本粒度取捨

- 不建議第一版把 `formulaVersion`、`actionModelVersion`、`gameDataVersion` 都做成第一層必填欄位。這些內部板號維護成本高，而且只要它們影響使用者可觀察結果，就應反映到對應的 solver / simulator / analyzer model version。
- 公式、技能模型、資料來源或 server region 可先放在 release note、debug manifest 或未來擴充欄位；不要建立看似精細但沒有同步流程的假版本資訊。
- 版本更新單位應以「同一份輸入在新版模型下輸出是否可能不同」或「模型相關實作是否被修改 / 重構」為主要判準；模型重構不可用「預期不改行為」免除 bump。

### 目前取捨

第一版版本識別與 JSON 匯入閉環已完成；剩餘重點是不把它膨脹成假精細版本系統，並在舊快照比較 UI、差異提示與報表比較功能中正確使用這些 `modelVersions`。
