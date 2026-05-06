# FFXIV 採集底層公式與數值規範 (Gathering Math & Formulas)

## 1. 核心機制：Glv 與 基礎值 (Base Values)
本專案的演算基礎建立在「基礎值」之上。每個採集物品都有一個隱藏的 **Glv (Gathering Item Level)**，對應一組基礎屬性要求。
- **基礎獲得力 (Base Gathering)**：決定成功率的分母。
- **基礎鑑別力 (Base Perception)**：決定獲得力加成率與收藏價值的基礎。
- **公式邏輯**：多數公式採用 `Floor(100 * 當前屬性 / 基礎值)` 作為計算分數 (Score)。

## 2. 成功率公式 (Gathering Success Rate)
成功率 (Gather%) 採分段函數計算，分數 (Score) = `Floor(100 * 當前獲得力 / 基礎獲得力)`。

### 基礎成功率對照 (無等級差)
- **Score = 0**：0%
- **Score 1 ~ 10**：1%
- **Score 11 ~ 20**：`2 + (Score - 11) * 2` (%)
- **Score 21 ~ 40**：`Floor(20 + (Score - 20) * 1.6)` (%)
- **Score 41 ~ 43**：`52 + (Score - 40) * 2` (%)
- **Score 44**：*特殊值*，僅在有等級差時存在 (58% ± 等級修正)。
- **Score 45**：60%
- **Score 46 ~ 63**：`60 + Floor((Score - 45) * 5 / 9)` (%)
- **Score 64 ~ 75**：`72 + (Score - 64) * 2` (%)
- **Score 76 ~ 79**：`94 + (Score - 75) * 1` (%)
- **Score >= 80**：100% (上限)

### 等級修正 (Level Modifiers)
計算完基礎成功率後，直接進行加減（對百分比整數）：
- **玩家等級 > 物品等級**：每高 1 級 +1% (最高 +5%)。
- **玩家等級 < 物品等級**：每低 1 級 -5% (最高 -25%)。


## 3. 獲得力加成率 (Gatherer's Boon Chance)
加成率最高為 **60%**，採分段線性計算。
- **加成率分數 (BoonScore)**：`Min(150, Floor(100 * 當前鑑別力 / 基礎鑑別力))`
- **計算機率 (BoonRate)**：
    - `BoonScore >= 100`：`(BoonScore - 100) / 50 * 25 + 35` (%)
    - `BoonScore >= 80`：`(BoonScore - 80) / 20 * 20 + 15` (%)
    - `BoonScore >= 70`：`(BoonScore - 70) / 10 * 5 + 10` (%)
    - `BoonScore >= 60`：`(BoonScore - 60) / 10 * 10` (%)
    - `BoonScore < 60`：0%

## 4. 高產/豐收 (Bountiful Yield / Harvest)
技能提供的額外獲得量 (+1 / +2 / +3) 門檻：
- **獲得量 +1**：基礎效果。
- **獲得量 +2**：當前獲得力 >= `Floor(基礎獲得力 * 0.9)`。
- **獲得量 +3**：當前獲得力 >= `Floor(基礎獲得力 * 1.1)`。

## 5. 收藏品純化機制 (Collectables Scour)
純化數值基於 **純化分數 (ScourScore)**：`Min(95, Floor(100 * 當前鑑別力 / 基礎鑑別力))`。

### 基礎純化值 (Scour Value)
- `ScourScore <= 66`：150
- `66 < ScourScore <= 85`：`Floor((ScourScore - 66) * 40 / 19 + 150)` (最高 190)
- `85 < ScourScore <= 95`：`ScourScore - 85 + 190` (最高 200)

### 慎重純化 (Meticulous Chance)
不消耗耐久的機率：
- `ScourScore <= 66`：5%
- `66 < ScourScore <= 85`：`Floor((ScourScore - 66) * 5 / 19 + 5)` (%)
- `85 < ScourScore <= 95`：`(ScourScore - 85) + 10` (%) (最高 20%)

## 6. 其他關鍵數值
- **再起 (Revisit - 7.0 新特性)**：
    - 普通採集點：5%
    - 限時採集點：8%
- **收藏家的標準 (Collector's Standard)**：
    - 普通點：25% / 精選點：20% / 傳說或未知點：13%。
- **昇華率 (Sublime Rate)**：針對 Prime 物品，上限 25%，門檻極高 (獲得力分數需達 95~110)。

---
**Agent 參考注意：**
- 本專案所有演算必須遵循上述分段函數，嚴禁使用簡單的線性假設。
- 分母「基礎值」是計算一切的關鍵，若資料庫中缺損此值，演算將無法進行。
