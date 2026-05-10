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

## 5. 收藏品提煉機制 (Collectables)

> 2026-05-10 實測與 Teamcraft 對照修正：
> 收藏品公式不可全部使用鑑別力。`Scour`、價值提升率、慎重不耗耐久率使用 **獲得力 / 基礎獲得力**；`Scrutiny` 使用 **鑑別力 / 基礎鑑別力**。
> Teamcraft 文件中的 `IntuitionRate` 對應遊戲 UI 的「價值提升機率」，不是繁中狀態「洞察」Buff。繁中「洞察」Buff 對應 Teamcraft 的 `Collector's Standard`。

### 通用分數
- `Score = Floor(100 * 當前屬性 / 基礎值)`
- `ActionScore = Min(95, Score)`
- `RateScore = Min(100, Score)`

### 提煉基礎值 (Scour Value)
`Scour` 使用 **獲得力** 計算 `ActionScore`。

- `ActionScore <= 66`：150
- `66 < ActionScore <= 85`：`Floor((ActionScore - 66) * 40 / 19 + 150)` (最高 190)
- `85 < ActionScore <= 95`：`ActionScore - 85 + 190` (最高 200)

### 集中檢查 (Scrutiny)
`Scrutiny` 使用 **鑑別力** 計算 `ActionScore`，結果為 90 到 125 的倍率基礎。依 Teamcraft 公式，`Scrutiny` 的額外加成使用 `Scour` 值計算，再加到本次提煉 action 的基礎提升量上。

- `ActionScore <= 66`：90
- `66 < ActionScore <= 85`：`Floor((ActionScore - 66) * 25 / 19 + 90)`
- `85 < ActionScore <= 95`：`ActionScore - 85 + 115`
- `ScrutinyBonus = Floor(Scour * ScrutinyResult / 100)`
- `Scour + Scrutiny = Scour + ScrutinyBonus`
- `Meticulous + Scrutiny = Floor(Scour * 75 / 100) + ScrutinyBonus`
- `Meticulous + Collector's Standard + Scrutiny = Scour + ScrutinyBonus`
- 價值提升效果另加 `Floor(Scour * 50 / 100)`；最大值 case 中 `Scrutiny + Meticulous` 為 `400 / 500`，不是 `400 / 550`。

### 價值提升率 (Collector's Intuition / IntuitionRate)
`IntuitionRate` 使用 **獲得力** 計算 `RateScore`，遊戲繁中 UI 顯示為「價值提升機率」。

- `RateScore <= 66`：10%
- `66 < RateScore <= 85`：`Floor((RateScore - 66) * 10 / 19 + 10)` (%)
- `85 < RateScore <= 100`：`Floor((RateScore - 85) * 20 / 15 + 20)` (%)，最高 40%
- `Collector's Focus / 價值矚目`：`Floor(IntuitionRate * 175 / 100)`，最大值 case 40% 會變 70%。

### 慎重提煉 (Meticulous)
- 收藏價值基礎提升量：`Floor(Scour * 75 / 100)`。
- 不消耗耐久率使用 **獲得力** 計算 `RateScore`。
- `RateScore <= 66`：5%
- `66 < RateScore <= 85`：`Floor((RateScore - 66) * 5 / 19 + 5)` (%)
- `85 < RateScore <= 100`：`(RateScore - 85) + 10` (%)，最高 25%
- `Priming Touch / 預備碰觸`：目前實測為只將慎重不耗耐久率翻倍；最大值 case 25% 變 50%。強化洞察相關疊加不納入第一版。

### 一般洞察 Buff (Collector's Standard)
繁中遊戲 UI 的 **洞察** Buff 對應 Teamcraft 的 `Collector's Standard`，不是 `Collector's Intuition`。

- 這是使用收藏品技能時可能發生的隱藏 proc。
- 觸發後會使下一次 `Brazen` / `Meticulous` 提升到接近 `Scour` 的基準。
- 第一版排除 `Brazen`，但可納入 `Meticulous`：最大值 case 實測為慎重 `+200`，價值提升時 `+300`。
- 觸發限制：
  - 剛開節點不能立即觸發，必須先使用一次收藏品技能。
  - 收藏價值達 1000 時不能觸發。
  - 節點耐久歸 0 時不能觸發。
  - 裝備與等級不影響此機率。
- Teamcraft 近似機率：
  - 節點等級為 55 的收藏品點：0%。
  - 一般非限時收藏品點：25%。
  - 未滿等級上限的未知點：25%。
  - 精選點 (Ephemeral)：20%。
  - 滿等未知 / 傳說點：13%。
- Teamcraft 備註：Lv55 收藏品點無法觸發此效果是不一致的特殊情況，不應推定為通用規則。
- `Collector's High Standard / 強化洞察` 目前所知不多，第一版 solver 不納入。

## 6. 其他關鍵數值
- **再起 (Revisit - 7.0 新特性)**：
    - 普通採集點：5%
    - 限時採集點：8%
- **洞察 (Collector's Standard)**：
    - 詳細條件與節點類型機率見「一般洞察 Buff」段落。
- **昇華率 (Sublime Rate)**：針對 Prime 物品，上限 25%，門檻極高 (獲得力分數需達 95~110)。

---
**Agent 參考注意：**
- 本專案所有演算必須遵循上述分段函數，嚴禁使用簡單的線性假設。
- 分母「基礎值」是計算一切的關鍵，若資料庫中缺損此值，演算將無法進行。
