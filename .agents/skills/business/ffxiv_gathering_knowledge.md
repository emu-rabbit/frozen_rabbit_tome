# FFXIV 採集機制知識庫 (FFXIV Gathering Mechanics)

## 1. 職業定義 (Disciples of the Land)
本工具主要針對以下兩類採集職業（大地使者）：

| 語系 | 採掘師 (Miner) | 園藝師 (Botanist) | 漁師 (Fisher) |
| :--- | :--- | :--- | :--- |
| **繁體中文 (TW)** | **採掘師** | **園藝師** | 漁師 |
| **簡體中文 (CN)** | 采矿工 | 园艺工 | 捕鱼人 |
| **英文 (EN)** | Miner | Botanist | Fisher |
| **日文 (JA)** | 採掘師 | 園芸師 | 漁師 |

- **採掘師 / 採礦工**：採集礦石、寶石、岩石。
- **園藝師 / 園藝工**：採集植物、木材、食材。
- *(註：漁師 的機制與上述兩者差異較大，本階段暫不列入核心演算範圍。)*

## 2. 玩家核心屬性 (Player Attributes)

| 語系 | 獲得力 (Gathering) | 鑑別力 (Perception) | 採集力 (GP) |
| :--- | :--- | :--- | :--- |
| **繁體中文 (TW)** | **獲得力** | **鑑別力** | **GP** |
| **簡體中文 (CN)** | 获得力 | 鉴别力 | GP |
| **英文 (EN)** | Gathering | Perception | GP |
| **日文 (JA)** | 獲得力 | 識質力 | GP |

- **獲得力 (Gathering)**：
    - 影響採集的成功率 (Success Rate)，上限為 100%。
    - 若數值低於節點要求，成功率會大幅下降甚至為 0%。
    - 影響節點「獲得數增加 (Yield +)」特性的觸發門檻。
- **鑑別力 (Perception)**：
    - 影響 **「獲得數加成 (Gatherer's Boon)」** 的發動機率。
    - **獲得數加成 (Boon)**：發動時會使單次採集獲得量 +1。基礎發動率上限為 60%（可透過技能提升）。
    - 影響收藏品 (Collectables) 的「收藏價值 (Collectability)」提升量。
    - *(註：6.0 版本後採集素材不再有 HQ 概念，鑑別力轉為影響數量加成。)*
- **採集力 (GP, Gathering Points)**：
    - 施展採集技能所需的資源。
    - 每 3 秒自然回復 5 點（採集狀態下不自然回復，但每次成功採集會回復 1 點以上）。
    - 透過藥品（如高級強心藥劑 Hi-Cordial）可快速回補。

## 3. 採集點分類 (Node Types)
- **常規採集點 (Regular Nodes)**：常駐於地圖上，採集完畢後在其他點採集即可重新刷新。
- **限時採集點 (Timed Nodes)**：
    - **未知採集點 (Unspoiled Nodes)**：在特定艾歐澤亞時間 (ET) 出現。
    - **傳說採集點 (Legendary Nodes)**：需要閱讀對應的「傳承錄」後才能看見，通常產出高難易度配方素材。
- **精選採集點 (Ephemeral Nodes)**：特定時間內可反覆採集，主要用於「精選 (Aetherial Reduction)」以獲取靈砂。

## 4. 節點核心機制 (Node Mechanics)
- **採集次數 / 耐久 (Integrity / Gathering Attempts)**：
    - 每個節點可進行採集的基本次數（通常為 4 ~ 6 次）。
    - 某些技能可以回復次數或防止消耗。
- **節點特性 (Node Traits / Bonuses)**：
    - 當玩家數值達到特定門檻時觸發。
    - 常見獎勵：採集次數 +1/+2、獲得量 +1/+2/+3、獲得力加成發動率 +% 等。

## 5. 技能邏輯分類 (Action Categories)
演算推薦策略或分析指定手法時，需考慮以下技能的 GP/效果權衡：
- **增加獲得量類**：如「豐富餽贈 (Bountiful Yield)」，增加單次獲得量。
- **增加採集次數類**：如「石工之理 / 農夫之智 (Ageless Words / Solid Reason)」，回復 1 次採集次數。
- **提升加成機率類**：提升 Gatherer's Boon 的發動機率。
- **保底成功率類**：確保成功率達 100%。
- **收藏品專用類**：提升收藏價值但不消耗次數，或消耗次數換取高價值。

## 6. 核心演算目標 (Recommendation / Simulation Goal)
在一次節點採集中，透過分配有限的 **GP** 與 **採集次數**，在考慮玩家 **屬性門檻** 與 **節點特性** 的情況下，計算出：
> **秘笈：在目前支援模型與輸入條件下，推薦總獲得量期望值或收藏收益較高的技能組合。**
> **實驗：模擬並分析使用者指定技能手法的結果、風險與限制。**

對外文案不可宣稱「最佳」、「最優」或「唯一正解」；若需要描述排序，請使用「推薦」、「較高期望」、「依目前模型推算」等語氣。

## 7. 收藏品分類與 reward 資料現況

大地使者收藏品不可只用 `IsCollectable=true` 判斷後直接套同一套 reward model。後續維護時請先判斷玩法分類，再決定秘笈是否支援。

目前分類理解：

- **純收藏品繳納**：可由 Teamcraft `collectables.json` 建立三檔門檻與票據 reward。
- **老主顧**：可由 datamining `SatisfactionSupply.csv` 與 `SatisfactionSupplyReward.csv` 建立門檻、金幣與大地票據；`RewardCurrency = 4` 對應大地紫票，`RewardCurrency = 7` 對應大地橘票。若同一 row 有兩種貨幣，目前依求解目標取可用 reward，不判斷實際遊戲條件限制。
- **薩雷安魔法大學**：可由 `SharlayanCraftWorksSupply.csv` 建立兩檔 reward table。
- **珠串萬貨街**：可由 `BankaCraftWorksSupply.csv` 搭配 `CollectablesRefine.csv` 建立 reward table。
- **精選**：需要獨立 reward model，通常與 reduction 結果、素材與隨機獎勵有關，目前不可沿用一般 scrip/exp/gil reward table。
- **宇宙探索 / Stellar Mission**：採集收藏品可分類，但不支援目前收藏品秘笈求解。宇宙探索有專用採集技能、宇宙工具或特殊裝備效果，且 mission score、銀星/金星門檻與 reward 欄位語意尚未完整確認。

資料來源與維護原則：

- Runtime 載入後應先剪枝成 `CollectableRewardTable` 所需結構，再放入 RAM cache。
- 若 Teamcraft JSON 已能支援需求，不必額外以 XIVAPI CSV 做重型交叉驗證。
- 補充 CSV 失敗時應有可理解的錯誤或 fallback，不可讓純收藏品 Teamcraft reward 一起失效。
- 不要把宇宙探索的 `WKSItemInfo.csv` 全集直接當作採集收藏品任務目標；它包含非採集收藏品與非評分目標物。

---
**Agent 參考注意：**
1. FFXIV 6.0 (Endwalker) 後已取消 HQ 採集物，全面改為「獲得力加成 (Gatherer's Boon)」。
2. 資料更新頻率：每當遊戲大版本更新 (如 7.0 Dawntrail)，屬性門檻與技能效果可能微調。
