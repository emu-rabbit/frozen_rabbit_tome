# 收藏品採集求解系統設計筆記

本文件整理 2026-05-10 針對 `frozen_rabbit_tome` 收藏品採集求解系統的研究結論。目標是讓後續 Agent 可以只讀本文件，再搭配既有 `.agents` 核心規範與程式碼，理解並實作收藏品求解系統。

## 2026-05-10 實測修正與命名勘誤

本節優先級高於本文較早期草案敘述。後續 Agent 實作收藏品第一版求解器時，請先讀本節與 `.agents/skills/business/collectable_solver_v1_implementation.md`。

### 名稱對照

| 遊戲內繁中/現象 | Teamcraft 名稱 | 實作含義 |
| :--- | :--- | :--- |
| 價值提升效果 / 價值提升機率 | Collector's Intuition / IntuitionRate | 本次提煉類技能收藏價值提升量變高。最大值 case 面板為 40%，價值矚目後為 70%。 |
| 洞察 Buff | Collector's Standard | 下一次 `Brazen` / `Meticulous` 變強。第一版排除 `Brazen`，但可納入一般洞察對 `Meticulous` 的影響。 |
| 強化洞察 | Collector's High Standard | Lv100 偶爾升級版。發生率未知，第一版求解器排除。 |

重要：`IntuitionRate` 不是「洞察 Buff 發生率」。它對應本次是否觸發「價值提升效果」。價值提升不一定給洞察 Buff，兩者必須拆成兩個隨機事件。

### 第一版已確認可用模型

最大值 case 實測與 Teamcraft 對照如下：

| 狀態 | 技能 | 未觸發價值提升 | 觸發價值提升 | 備註 |
| :--- | :--- | ---: | ---: | :--- |
| 無洞察 | 提煉 | +200 | +300 | 使用 `Scour`。 |
| 無洞察 | 慎重提煉 | +150 | +250 | 慎重不耗耐久率最大值 case 為 25%。 |
| 洞察 / Collector's Standard | 慎重提煉 | +200 | +300 | 第一版可納入。 |
| 集中檢查 | 提煉 | +450 | +550 | 使用者依遊戲經驗確認。 |
| 集中檢查 | 慎重提煉 | +400 | +550 | 使用者依遊戲經驗確認。 |
| 集中檢查 + 洞察 | 慎重提煉 | +450 | +550 | 使用者依遊戲經驗確認。 |

`價值矚目 / Collector's Focus` 已確認：

- 消耗 100 GP。
- 將價值提升機率乘以 1.75 並向下取整；最大值 case 40% 變 70%。
- 只會在下一次提煉類技能後消耗；施放其他 GP Buff 不會消耗。

`預備碰觸 / Priming Touch` 已確認：

- 消耗 100 GP。
- 將慎重不耗耐久率翻倍；最大值 case 25% 變 50%。
- 不改變收藏價值提升量，也不改變價值提升機率。
- 只會在下一次提煉類技能後消耗；施放其他 GP Buff 不會消耗。

`Collector's Standard / 洞察 Buff` 近似機率採 Teamcraft `Gathering Math`：

- Lv55 收藏品點：0%。
- 一般非限時收藏品點：25%。
- 未滿等級上限未知點：25%。
- 精選點：20%。
- 滿等未知 / 傳說點：13%。

限制：

- 剛開節點不能立即觸發，必須先使用收藏品技能。
- 收藏價值達 1000 或耐久歸 0 時不能再觸發。
- 裝備與等級不影響 `Collector's Standard` 機率。

### 第一版固定排除

- `Brazen / 大膽提煉`：隨機分布、檔位、取整順序仍未知。
- `Collector's High Standard / 強化洞察`：發生率未知；少量手測無法建立可靠期望值模型。可在模擬器作為手動狀態或 experimental probability，不納入第一版求解器最佳化。

## 尚待解決問題

以下問題尚未有足夠可信資料，請後續先向使用者或專家確認，再進入正式實作。若沒有確認，實作時必須以保守 TODO、feature flag 或明確未支援狀態處理，不可自行猜測。

### 1. 大膽提煉隨機分布

使用者確認狀態（2026-05-10）：

- 目前暫時沒有可信答案。
- 後續 Agent 不可自行假設分布、檔位或機率。
- 第一版實作應先禁用大膽提煉，或只在明確標示的 experimental mode 中接受使用者提供的分布表。

技能：

- 採掘師：**大膽提煉** / Brazen Prospector
- 園藝師：**大膽提煉** / Brazen Woodsman

已知描述：

- 收藏價值上升量為 **提煉的 50% 到 150%**。
- 會消耗 1 點耐久。
- GP 消耗為 0。

待確認：

- 50% 到 150% 是連續均勻、離散均勻，還是固定若干檔位。
- 若為離散檔位，檔位有哪些，例如 50/60/.../150 或 50/75/100/125/150。
- 各檔位機率是否均等。
- 結果是否每次都 floor，或先算倍率再套其他加成後 floor。
- 大膽提煉是否會觸發「洞察 / 收藏家的直覺」，以及若觸發時公式順序如何。

### 2. 強化洞察完整公式

使用者附圖顯示 Lv100 trait **強化洞察**。繁中說明大意：

- 觸發洞察時，偶爾會觸發效果更強的強化洞察。
- 強化洞察效果：大幅提升收藏價值上升量，固定為最大值。
- 使慎重提煉不消耗耐久的機率提升 40%。
- 習得條件：100 級。
- 適用職業：採掘師。

使用者確認狀態（2026-05-10）：

- 園藝師也有同效果 trait。
- 繁中譯名同樣是 **強化洞察**。
- 園藝師版本圖示與採掘師版本不太一樣，後續載入 action/trait icon 時需依職業分開對應。

待確認：

- 園藝師與採掘師的 **強化洞察** action/trait id 與 icon 對應。
- 強化洞察的觸發機率公式。
- 強化洞察的「固定為最大值」對應哪個數值：
  - 是一般洞察的加成量固定最大？
  - 還是該次提煉總收藏價值提升量固定最大？
  - 是否影響大膽提煉的倍率結果？
- 強化洞察對慎重提煉不耗耐久率的 +40% 是百分點加法，或倍率。
- 強化洞察與 **預備碰觸** 的疊加規則。技能說明提到預備碰觸不受強化洞察所提升的機率影響，因此需精確確認公式順序。

### 3. 洞察 / 收藏家的直覺命名與 UI 用語

英文資料常稱 **Intuition**，wiki 稱 **Collector's Intuition**，繁中遊戲 UI 可能顯示為 **洞察** 或相關狀態名稱。

使用者確認狀態（2026-05-10）：

- 遊戲內繁中正式狀態名稱是 **洞察**。
- 本專案 UI 應依使用者選擇的語系顯示對應官方譯名，不應固定顯示繁中或英文。
- 洞察至少在目前使用者遊戲內觀察中不是可見 trait，因此不應依賴 trait 資料顯示。
- 若 Teamcraft action/status dict 無法穩定取得各語系名稱，需建立本地 i18n key 與名稱表，作為收藏品求解器的內部狀態顯示資料。

待確認：

- 各語系官方譯名，特別是英文、日文、簡中正式 UI 名稱。
- 使用者確認（2026-05-10）：上述語系官方名稱目前暫時不知道。實作時可先建立 i18n key，但未查證前不要把 fallback 文字標示為官方譯名。

### 4. 老主顧 RewardCurrency 代碼語意

`SatisfactionSupplyReward.csv` 中 `RewardCurrency` 常見值包含 2、4、6、7。已確認可取得數量，但 UI 顯示需要穩定對應到具體獎勵名稱。

使用者確認狀態（2026-05-10）：

- 老主顧 reward model 只需考慮金幣、經驗值、大地紫票、大地橘票。
- 製作職票據與其他貨幣不納入大地使者收藏品求解評分。
- 若同一 reward row 給兩種貨幣，實際遊戲中可能有條件限制；但本專案未來會讓玩家自行選擇要用哪個貨幣當評分標準，因此第一版先不判斷該貨幣是否真的可取得，只要依 `RewardCurrency` 對應表計算即可。
- 後續需透過實際老主顧資料與 wiki 對照，建立 `RewardCurrency` 到「大地紫票 / 大地橘票 / 忽略」的穩定 mapping。

待對照樣本：

- `SatisfactionNpc[1]`：Zhloe Aliapoh。
- `SatisfactionSupply[1.1]`：item `17557`，英文名 `Dated Radz-at-Han Coin`。
- `SatisfactionSupply[1.1].Reward = 2`，對應 `SatisfactionSupplyReward[2]`：
  - `RewardCurrency = 4`，Low/Mid/High = `94 / 117 / 140`。
  - `RewardCurrency = 7`，Low/Mid/High = `82 / 100 / 116`。
  - Gil Low/Mid/High = `670 / 840 / 1000`。
- 使用者依 wiki 對照確認：此樣本中較多的 `RewardCurrency = 4` 是 **大地紫票**，較少的 `RewardCurrency = 7` 是 **大地橘票**。

已確認 mapping：

- `RewardCurrency = 2`：巧匠紫票，本專案大地使者求解忽略。
- `RewardCurrency = 4`：大地紫票。
- `RewardCurrency = 6`：巧匠橘票，本專案大地使者求解忽略。
- `RewardCurrency = 7`：大地橘票。

待確認：

- 無。第一版不判斷 `MinLevelForSecondReward` 對第二獎勵的取得限制。

### 5. Teamcraft / xivapi 資料差異與更新策略

目前確認 Teamcraft JSON 和 xivapi datamining CSV 都有可用資料，但本專案既有資料來源混用：

- Teamcraft JSON 用於 items、icons、item-level 等。
- xivapi datamining CSV 用於 GatheringItem、GatheringPoint 等。
- XIVAPI endpoint 用於 `IsCollectable` 查詢。

使用者決策（2026-05-10）：

- 收藏品 reward table 應優先選擇「需要拉取檔案數較少、較不會載入本專案用不到資料」的資料來源。
- 資料載入採 **runtime fetch**。
- fetch 後必須先剪枝成收藏品求解器實際需要的結構，再放入 RAM cache；避免長時間保留過肥原始資料。
- 若 Teamcraft JSON 已整理好且足以支援需求，就僅使用 Teamcraft JSON，不需要額外拉 xivapi CSV 驗證。
- 驗證優先級很低。若未來真的需要驗證，可另外寫本地腳本協助開發者手動跑 Teamcraft JSON 與 datamining CSV 對照。
- 本專案是個人規模工具，資料短暫錯誤或 downtime 不會造成大量損失，因此不要為資料驗證與備援設計過度複雜的管線。

待決策：

- 逐一確認各收藏品類型最少需要拉哪些檔案，例如純收藏品、薩雷安、珠串、老主顧、精選是否都能由 Teamcraft JSON 滿足。

## 專案背景與現有狀態

`frozen_rabbit_tome` 是 FFXIV 採掘師與園藝師採集策略最佳化工具。一般採集目前已完成「期望產量最大化」求解，收藏品與水晶採集系統目前只保留入口。

相關程式位置：

- `src/utils/rotationSolver.ts`
  - 一般採集 DP + memo 求解器。
  - 狀態包含 GP、耐久、全節點 buff、下一次採集 buff、理智同興等。
  - 回傳線性 `rotation`。
- `src/utils/gatheringMath.ts`
  - 成功率、Boon 機率、高產/豐收公式。
  - 尚未實作收藏品公式。
- `src/types/game.ts`
  - `GatherableItem` 已有 `isCollectable?: boolean` 與 `isCrystalGathering?: boolean`。
  - `SolverRequest` / `SolverResponse` 目前只服務一般採集。
- `src/services/gameData.ts`
  - `searchGatherables()` 目前透過 XIVAPI `Item?ids=...&columns=ID,IsCollectable` 判定收藏品。
  - 水晶類用固定 item id set 判斷。
  - `SOLVER_ACTION_IDS` 目前只包含一般採集技能，不含收藏品技能。
- `src/views/Solver.vue`
  - `activeItem.isCollectable` 時顯示「收藏品系統仍在施工中」。
  - `activeItem.isCrystalGathering` 時顯示「水晶採集系統仍在施工中」。
  - 一般採集結果顯示線性 rotation，並提供巨集預覽。

收藏品求解不能照一般採集輸出單一序列。它需要輸出「決策策略」，例如：

- 若收藏價值 >= 1000：收藏品採集。
- 若收藏價值 < 1000 且耐久足夠：慎重提煉。
- 若洞察觸發：轉往高標分支。
- 若慎重提煉未消耗耐久：繼續補價值。

因此資料結構、求解器輸出與 UI 都要獨立設計。

## 收藏品系統分類

使用者目前將大地收藏品分為以下類型：

1. **純粹的收藏品繳納**
   - 通常用於換紫票/橘票。
   - 可用收藏價值對應票據數量作為評分。
2. **薩雷安魔法大學交易**
   - 複合獎勵：經驗值、金幣、票據。
   - 資料表可取得門檻與獎勵。
3. **珠串萬貨大街交易**
   - 複合獎勵：經驗值、金幣、票據。
   - 資料表可取得門檻與獎勵。
4. **精選**
   - 不是紫票/橘票型評分。
   - 後續應獨立設計 reward model。
5. **老主顧交易**
   - 複合獎勵：老主顧好感度、金幣、紫票、橘票，以及可能的經驗值。
   - 資料表可取得門檻與獎勵。
   - 好感度通常三檔相同，不建議作為求解目標。

## 資料來源總覽

### Teamcraft JSON

目前專案既有 `gameData.ts` 使用 Teamcraft JSON base URL：

```ts
https://raw.githubusercontent.com/ffxiv-teamcraft/ffxiv-teamcraft/{branch}/libs/data/src/lib/json
```

與收藏品相關的 Teamcraft JSON：

- `collectables.json`
  - 以 item id 為 key。
  - 已整理純收藏品繳納資料。
  - 包含 `base`、`mid`、`high` 三檔，每檔含 `rating`、`exp`、`scrip`。
  - 包含 `reward`，例如紫票/橘票 item id。
- `collectables-page-data.json`
  - 頁面展示用資料，內容較肥，但可作對照。
- `collectables-shops.json`
  - 商店分類與 shop item id。
- `collectables-shop-item-group.json`
  - 商店 item group 名稱。
- `scrip-index.json`
  - item id 對應票據 item id。
- `reduction.json` / `reverse-reduction.json`
  - 精選資料入口。
- `satisfaction-thresholds.json`
  - 老主顧或滿意度相關門檻資料，但目前主要仍建議從 xivapi CSV 組。

Teamcraft `collectables.json` 範例結構：

```json
{
  "12713": {
    "id": 14,
    "type": "CollectablesShopItem",
    "rewardType": 1,
    "collectable": 1,
    "level": 50,
    "levelMin": 50,
    "levelMax": 51,
    "group": 8,
    "shopId": 14,
    "reward": 33914,
    "base": {
      "quantity": 1,
      "rating": 49,
      "exp": 66,
      "scrip": 6
    },
    "mid": {
      "quantity": 1,
      "rating": 81,
      "exp": 72,
      "scrip": 7
    },
    "high": {
      "quantity": 1,
      "rating": 114,
      "exp": 79,
      "scrip": 11
    }
  }
}
```

### xivapi datamining CSV

目前專案既有 `gameData.ts` 已使用 xivapi datamining CSV：

```ts
https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/en
```

純收藏品繳納：

- `CollectablesShop.csv`
  - 商店分類。
  - `RewardType` 可區分票據或物品獎勵類。
- `CollectablesShopItem.csv`
  - 欄位：`Item`、`LevelMin`、`LevelMax`、`CollectablesShopRefine`、`CollectablesShopRewardScrip`、`CollectablesShopItemGroup`。
- `CollectablesShopRefine.csv`
  - 欄位：`LowCollectability`、`MidCollectability`、`HighCollectability`。
- `CollectablesShopRewardScrip.csv`
  - 欄位：`Currency`、`LowReward`、`MidReward`、`HighReward`、`ExpRatioLow`、`ExpRatioMid`、`ExpRatioHigh`。
- `CollectablesShopRewardItem.csv`
  - 非票據獎勵類使用。

薩雷安魔法大學交易：

- `SharlayanCraftWorks.csv`
  - 分類說明與 NPC。
  - Row 3 是大地使者 Faculty of Anthropology，接受採掘師與園藝師。
- `SharlayanCraftWorksSupply.csv`
  - 每列含 4 個 item slot。
  - 欄位模式：
    - `Item[n].ItemId`
    - `Item[n].XPReward`
    - `Item[n].CollectabilityMid`
    - `Item[n].CollectabilityHigh`
    - `Item[n].GilReward`
    - `Item[n].Level`
    - `Item[n].HighXPMultiplier`
    - `Item[n].HighGilMultiplier`
    - `Item[n].ScripReward`
    - `Item[n].HighScripMultiplier`
  - 圖片中 Lv80 文化系資料可對上 row：
    - `XPReward = 437416`
    - `GilReward = 213`
    - `ScripReward = 100`
    - 高標 multiplier = 150，因此高標為 656124 / 319 / 150。

珠串萬貨大街交易：

- `BankaCraftWorks.csv`
  - 分類說明與 NPC。
  - Row 3 是 Shunye's Apothecary，接受採掘師與園藝師。
- `BankaCraftWorksSupply.csv`
  - 每列含 4 個 item slot。
  - 欄位模式：
    - `Item[n].ItemId`
    - `Item[n].XPReward`
    - `Item[n].Collectability`
    - `Item[n].GilReward`
    - `Item[n].Level`
    - `Item[n].HighXPMultiplier`
    - `Item[n].HighGilMultiplier`
    - `Item[n].ScripReward`
    - `Item[n].HighScripMultiplier`
  - `Collectability` 是對 `CollectablesRefine.csv` 的 row id。
  - 透過 XIVAPI v2 可解析出 `CollectabilityLow`、`CollectabilityMid`、`CollectabilityHigh`。

老主顧交易：

- `SatisfactionNpc.csv`
  - NPC、每週繳納次數、解鎖等級、供貨 index。
  - 欄位包含多個 `SatisfactionNpcParams[n]`，每個 rank 對應不同 `SupplyIndex`。
- `SatisfactionSupply.csv`
  - 欄位：
    - `Item`
    - `CollectabilityLow`
    - `CollectabilityMid`
    - `CollectabilityHigh`
    - `Reward`
    - `Slot`
    - `ProbabilityPercent`
    - `IsBonus`
  - `Reward` 指向 `SatisfactionSupplyReward.csv` row。
- `SatisfactionSupplyReward.csv`
  - 欄位：
    - `SatisfactionSupplyRewardData[0].RewardCurrency`
    - `SatisfactionSupplyRewardData[0].QuantityLow`
    - `SatisfactionSupplyRewardData[0].QuantityMid`
    - `SatisfactionSupplyRewardData[0].QuantityHigh`
    - `SatisfactionSupplyRewardData[1].RewardCurrency`
    - `SatisfactionSupplyRewardData[1].QuantityLow`
    - `SatisfactionSupplyRewardData[1].QuantityMid`
    - `SatisfactionSupplyRewardData[1].QuantityHigh`
    - `SatisfactionLow`
    - `SatisfactionMid`
    - `SatisfactionHigh`
    - `GilLow`
    - `GilMid`
    - `GilHigh`
    - `BonusMultiplier`
    - `MinLevelForSecondReward`
- `SatisfactionSupplyRewardExp.csv`
  - 欄位：
    - `PercentOfLevelLow`
    - `PercentOfLevelMid`
    - `PercentOfLevelHigh`
  - 用於換算老主顧經驗獎勵。

精選：

- `GathererReductionReward.csv`
  - datamining 的精選獎勵表。
- Teamcraft `reduction.json` / `reverse-reduction.json`
  - 較適合前端直接讀。
  - 本階段先不要納入紫票/橘票評分。

### XIVAPI v2

XIVAPI v2 可用於 schema 化讀取 sheet row，例如：

```txt
https://v2.xivapi.com/api/sheet/BankaCraftWorksSupply/0
https://v2.xivapi.com/api/sheet/SatisfactionSupplyReward/1
```

優點：

- 可展開 linked sheet，欄位語意比 CSV 清楚。
- 適合研究與驗證。

缺點：

- Runtime 依賴 API 穩定性與 CORS。
- 資料量大時不適合逐筆查。

建議：

- 實作時優先使用 Teamcraft JSON 或 datamining CSV 的批次資料。
- XIVAPI v2 只作開發驗證或 debug 對照，不作主要 runtime 依賴。

## 收藏品技能與動作

### 技能列表

採掘師與園藝師的收藏品技能效果相同，部分技能名稱相同，部分職業名稱不同。

| 類型 | 採掘師 | 園藝師 | 英文 | GP | 耐久 | 說明 |
| :--- | :--- | :--- | :--- | ---: | ---: | :--- |
| 採集 | 收藏品採集 | 收藏品採集 | Collect | 0 | -1 | 以目前收藏價值採集 1 個收藏品 |
| 提煉 | 提煉 | 提煉 | Scour | 0 | -1 | 收藏價值上升，基礎值 150 到 200 |
| 提煉 | 大膽提煉 | 大膽提煉 | Brazen Prospector / Brazen Woodsman | 0 | -1 | 提煉 50% 到 150%，分布待確認 |
| 提煉 | 慎重提煉 | 慎重提煉 | Meticulous Prospector / Meticulous Woodsman | 0 | -1 或 0 | 提煉 75%，有機率不消耗耐久 |
| Buff | 集中檢查 | 集中檢查 | Scrutiny | 200 | 0 | 下一次提煉技能增加收藏價值提升量 |
| Buff | 價值矚目 | 價值矚目 | Collector's Focus | 100 | 0 | 下一次提煉類技能提高「價值提升機率」；不是直接提高洞察 Buff / Collector's Standard 機率 |
| Buff | 預備碰觸 | 預備碰觸 | Priming Touch | 100 | 0 | 下一次慎重提煉不消耗耐久率翻倍 |
| Proc | 價值提升效果 | 價值提升效果 | Collector's Intuition | 0 | 0 | 隨提煉類技能觸發，增加本次收藏價值提升量 |
| Buff | 洞察 | 洞察 | Collector's Standard | 0 | 0 | 隨收藏品技能近似機率觸發，使下一次大膽/慎重提煉變強 |
| Buff | 強化洞察 | 強化洞察 | Collector's High Standard | 0 | 0 | Lv100 升級版，發生率未知，第一版排除 |

GP 消耗可從 `Action.csv` 的 `PrimaryCostValue` 取得。

### Action ID

目前已知 action id：

- `240`：收藏品採集 / Collect
- `22182`：提煉 / Scour
- `22183`：採掘師大膽提煉 / Brazen Prospector
- `22187`：園藝師大膽提煉 / Brazen Woodsman
- `22184`：採掘師慎重提煉 / Meticulous Prospector
- `22188`：園藝師慎重提煉 / Meticulous Woodsman
- `22185`：採掘師集中檢查 / Scrutiny
- `22189`：園藝師集中檢查 / Scrutiny
- `21205`：價值矚目 / Collector's Focus
- `34871`：預備碰觸 / Priming Touch

後續需將這些 id 加入 action icon/name 載入範圍。現有 `SOLVER_ACTION_IDS` 與 `actionIcons.ts` 不含這些收藏品技能。

## 收藏品公式

### 重要修正：公式使用屬性

本專案目前 `.agents/skills/business/gathering_math_formulas.md` 寫「收藏品純化機制」時使用「當前鑑別力 / 基礎鑑別力」。但 PDF `How to Craft like a Machine: Otis Edition` 第 11-12 頁顯示，收藏品公式需依函式使用不同 STAT：

- **提煉 / Scour**：使用獲得力與基礎獲得力。
- **價值提升率 / IntuitionRate**：使用獲得力與基礎獲得力。注意：這不是 `Collector's Standard / 洞察 Buff` 機率。
- **慎重提煉不耗耐久率 / MeticulousRate**：使用獲得力與基礎獲得力。
- **集中檢查 / Scrutiny**：使用鑑別力與基礎鑑別力。

後續應更新 skill 文件與 `gatheringMath.ts` 實作，避免把所有收藏品公式都用鑑別力。

### Score

通用分數：

```txt
Score = floor(100 * STAT / ITEMLEVEL[ILVL, STAT])
ActionScore = min(95, Score)
RateScore = min(100, Score)
```

本專案資料中，`ITEMLEVEL[ILVL, Gathering]` 與 `ITEMLEVEL[ILVL, Perception]` 可沿用一般採集用的 `baseValues.Gathering`、`baseValues.Perception`。

### 提煉

以獲得力計算 `ActionScore`。

```txt
Scour66 = 150
Scour85 = floor((ActionScore - 66) * 40 / 19 + Scour66)
Scour95 = ActionScore - 85 + Scour85
```

分段實作：

```ts
function calculateScourValue(gathering, baseGathering) {
  const score = Math.min(95, Math.floor(100 * gathering / baseGathering));
  if (score <= 66) return 150;
  if (score <= 85) return Math.floor((score - 66) * 40 / 19 + 150);
  return score - 85 + 190;
}
```

最高 200，最低 150。

### 集中檢查

以鑑別力計算 `ActionScore`。

```txt
Scrutiny66 = 90
Scrutiny85 = floor((ActionScore - 66) * 25 / 19 + Scrutiny66)
Scrutiny95 = ActionScore - 85 + Scrutiny85

WithScrutiny = floor(Scour * ScrutinyResult / 100 + Scour)
```

注意：

- `ScrutinyResult` 是 90 到 125。
- 不是直接加固定值，而是以 Scour 為基礎做倍率加成。
- 集中檢查作用於下一次提煉類技能，使用後應清除狀態。

實作方向：

```ts
function calculateScrutinyMultiplier(perception, basePerception) {
  const score = Math.min(95, Math.floor(100 * perception / basePerception));
  if (score <= 66) return 90;
  if (score <= 85) return Math.floor((score - 66) * 25 / 19 + 90);
  return score - 85 + 115;
}

function applyScrutiny(scourValue, scrutinyMultiplier) {
  return Math.floor(scourValue * scrutinyMultiplier / 100 + scourValue);
}
```

### 價值提升效果 / Collector's Intuition

注意：本段早期曾以「洞察」稱呼 `Collector's Intuition`，容易與繁中遊戲狀態 **洞察 / Collector's Standard** 混淆。後續實作請稱為「價值提升效果」或 `valueIncreaseProc`。

價值提升發動時，於目前結果再加 `Scour * 50%`。

PDF 表示公式：

```txt
Intuition = floor(Scour * 50 / 100 + currentResult)
```

注意：

- 價值提升在集中檢查之後套用。
- 若集中檢查與價值提升同時存在，先算集中檢查後的結果，再加 `floor?` 公式中使用 Scour 的 50%。
- PDF 文字說 Intuition will multiply the Scour result by 1.5 and add Scrutiny bonus as appropriate。實作時可用「base Scour bonus」追蹤，避免重複乘錯。

建議實作：

```ts
function applyIntuition(currentValue, scourValue) {
  return Math.floor(scourValue * 50 / 100 + currentValue);
}
```

強化洞察 / Collector's High Standard 是否改變此函式不納入第一版。

### 價值提升率 / IntuitionRate

以獲得力計算 `RateScore`。

```txt
IntuitionRate66 = 10
IntuitionRate85 = floor((RateScore - 66) * 10 / 19 + IntuitionRate66)
IntuitionRate100 = floor((RateScore - 85) * 20 / 15 + IntuitionRate85)
```

實作方向：

```ts
function calculateIntuitionRate(gathering, baseGathering) {
  const score = Math.min(100, Math.floor(100 * gathering / baseGathering));
  if (score <= 66) return 10;
  if (score <= 85) return Math.floor((score - 66) * 10 / 19 + 10);
  return Math.floor((score - 85) * 20 / 15 + 20);
}
```

最高約 40。遊戲 UI 會顯示為「價值提升機率」。

### 價值矚目

PDF 表示：

```txt
CollectorsFocus = IntuitionRateResult * 175 / 100
```

也就是將目前價值提升率乘以 1.75。

實作方向：

```ts
function applyCollectorsFocus(intuitionRate) {
  return Math.floor(intuitionRate * 175 / 100);
}
```

注意：

- 是否 floor 需確認。PDF 公式未明確標 floor，但遊戲機率通常以整數百分比顯示。建議先保守 floor，並在 debug 顯示原始計算。
- 上限可能是 70%，特殊工具可到 100%，需確認強化洞察或特殊工具相關規則。
- 價值矚目作用於下一次提煉技能，使用後應清除狀態。

使用者確認狀態（2026-05-10）：

- 2026-05-10 使用者實測：最大值 case 從 40% 變 70%，與 `Floor(IntuitionRate * 175 / 100)` 相符。
- 價值矚目只會在下一次提煉類技能後消耗；施放其他 GP Buff 不會消耗。

### 慎重提煉收藏價值

已知描述：

- 提升量為提煉的 75%。
- 有機率不消耗耐久。

實作方向：

```ts
function calculateMeticulousValue(scourValue) {
  return Math.floor(scourValue * 75 / 100);
}
```

需確認：

- 使用者確認（2026-05-10）：慎重提煉會受集中檢查與洞察影響。
- 若受集中檢查，應先以慎重提煉的基礎值還是 Scour 原值帶入 scrutiny？需確認。直覺上應以該次 action 的基礎 collectible gain 作 current result，再加 Scour-based bonus，但 PDF 說 Meticulous and Brazen both use Scour internally，需測試或查資料。

### 慎重提煉不耗耐久率

以獲得力計算 `RateScore`。

```txt
MeticulousRate66 = 5
MeticulousRate85 = floor((RateScore - 66) * 5 / 19 + MeticulousRate66)
MeticulousRate100 = (RateScore - 85) + MeticulousRate85
```

實作方向：

```ts
function calculateMeticulousProcRate(gathering, baseGathering) {
  const score = Math.min(100, Math.floor(100 * gathering / baseGathering));
  if (score <= 66) return 5;
  if (score <= 85) return Math.floor((score - 66) * 5 / 19 + 5);
  return score - 85 + 10;
}
```

本地舊 skill 寫最高 20%，這與 score 100 時 `100 - 85 + 10 = 25` 可能有衝突。注意：舊 skill 使用 `ScourScore = min(95, ...)` 導致最高 20，但 PDF 對 rate 使用 `RateScore = min(100, ...)`，最高應可到 25。此點需與遊戲內或專家確認。

### 預備碰觸

技能說明：

- 下一次使用慎重提煉時，慎重提煉不消耗耐久的機率翻倍。
- 此技能對採集地點特殊效果或強化洞察所提升的機率無效。

建議狀態：

- `primingTouchActive: boolean`

公式待確認：

- 是否只倍乘基礎 `MeticulousRate`。
- 若節點 bonus 或強化洞察另加不耗耐久率，應在倍乘後再加，或分開處理。

使用者確認狀態（2026-05-10）：

- 預備碰觸與節點 bonus、強化洞察的不耗耐久率疊加順序目前暫時沒有可靠答案。
- 在找到可靠公式與模型前，不要用暫定模型實作預備碰觸的倍率疊加。
- 後續需由使用者或熟悉機制者補充可靠公式後再納入求解器。

歷史草案（不可作為正式實作依據）：

```txt
effectiveMeticulousRate =
  min(100, baseMeticulousRate * (primingTouchActive ? 2 : 1) + nonPrimingBonus)
```

其中 `nonPrimingBonus` 需等強化洞察與節點效果確認。因使用者已要求不要在未知時採用暫定模型，正式實作前必須重新驗證此公式。

### 大膽提煉

目前不要實作完整最優模型，除非使用者補資料。

暫定可做兩種處理：

1. 第一版先禁用大膽提煉，並在 debug 說明「大膽提煉隨機分布待確認」。
2. 或提供 experimental mode，使用使用者提供的分布表。

建議分布資料結構：

```ts
interface BrazenDistributionEntry {
  multiplierPercent: number;
  probability: number;
}
```

實作時將大膽提煉建成多 outcome 分支。

## Reward Model

收藏品求解應先把收藏價值映射到 reward vector，再依使用者選擇目標轉換成 scalar score。

### Reward vector

建議型別：

```ts
interface CollectableRewardVector {
  exp: number;
  gil: number;
  scrip: number;
  satisfaction: number;
  items: Record<number, number>;
}
```

### 評分目標

```ts
type CollectableObjective =
  | { kind: 'scrip' }
  | { kind: 'exp' }
  | { kind: 'gil' }
  | { kind: 'item'; itemId: number }
  | { kind: 'custom'; weights: CollectableRewardWeights };

interface CollectableRewardWeights {
  exp?: number;
  gil?: number;
  scrip?: number;
  satisfaction?: number;
  items?: Record<number, number>;
}
```

建議預設：

- 純收藏品繳納：`scrip`
- 薩雷安魔法大學：`scrip`，但可切 `exp` / `gil`
- 珠串萬貨大街：`scrip`，但可切 `exp` / `gil`
- 老主顧：`scrip`，但可切 `gil` / `exp`
- 精選：暫不使用此 reward model，獨立設計

### 不建議好感度作為目標

老主顧的 `SatisfactionLow` / `SatisfactionMid` / `SatisfactionHigh` 多數三檔相同，例如：

```txt
30 / 30 / 30
80 / 80 / 80
130 / 130 / 130
```

這與使用者認知一致：好感度通常不受收藏價值檔位影響。若三檔相同，將好感度作為最佳化目標沒有意義。

建議：

- UI 顯示好感度作為參考。
- 若某 row 三檔好感度完全相同，不提供「好感度最大化」選項。
- 若未來資料出現三檔不同，可動態顯示。

### 門檻映射規則

一般三檔 reward：

```ts
function rewardTier(collectability, thresholds) {
  if (collectability >= thresholds.high && thresholds.high > 0) return 'high';
  if (collectability >= thresholds.mid) return 'mid';
  if (collectability >= thresholds.low) return 'low';
  return 'none';
}
```

對於只有兩檔的資料：

- `high = 0` 時，不應視為所有值都 high。
- 應只使用 low/mid。
- 薩雷安與珠串可能用 `mid/high` 命名，但 UI 可顯示成「低標 / 高標」或「可交 / 高標」。

### 複合獎勵換算

薩雷安與珠串：

```ts
lowReward = {
  exp: XPReward,
  gil: GilReward,
  scrip: ScripReward
}

highReward = {
  exp: floor(XPReward * HighXPMultiplier / 100),
  gil: floor(GilReward * HighGilMultiplier / 100),
  scrip: floor(ScripReward * HighScripMultiplier / 100)
}
```

取整規則：

- `213 * 1.5 = 319.5`，顯示 319，因此金幣使用 floor。
- `437416 * 1.5 = 656124`，整除。
- `100 * 1.5 = 150`。
- 使用者確認（2026-05-10）：經驗值與票據若遇到小數時是否也使用 floor，目前未知。
- 後續實作前若要精準處理經驗值與票據，需找非整除樣本驗證；不能只因金幣使用 floor 就推論所有 reward 都 floor。

老主顧：

```ts
lowReward = {
  currencies: [
    { currency: RewardCurrency0, quantity: QuantityLow0 },
    { currency: RewardCurrency1, quantity: QuantityLow1 }
  ],
  satisfaction: SatisfactionLow,
  gil: GilLow
}
```

經驗值需搭配 `SatisfactionSupplyRewardExp.csv` 與玩家等級或供貨等級換算，需後續深入確認。

## 求解器設計

### 為什麼不能輸出單一 rotation

收藏品動作有多個隨機分支：

- 慎重提煉可能不消耗耐久。
- 洞察可能觸發。
- 價值矚目改變洞察觸發率。
- 強化洞察可能觸發。
- 大膽提煉有隨機倍率。

因此最佳策略不是固定序列，而是 policy：

```txt
若收藏價值 >= X：收藏品採集
若收藏價值 < X 且耐久 > 1：施展某技能
若某隨機效果觸發：進入分支 A
若未觸發：進入分支 B
```

### 建議檔案拆分

不要把收藏品邏輯塞進 `rotationSolver.ts`。

建議新增：

- `src/utils/collectableMath.ts`
  - 收藏品公式。
  - 可與 `gatheringMath.ts` 整合，但初期獨立較清楚。
- `src/utils/collectableSolver.ts`
  - 收藏品 DP / policy 求解器。
- `src/workers/collectableSolver.worker.ts`
  - 收藏品求解 worker。
- `src/services/collectableRewards.ts`
  - reward table 載入與 itemId 對應。
- `src/types/collectable.ts` 或擴充 `src/types/game.ts`
  - 收藏品專用 request/response/policy 型別。

### Solver state

建議狀態：

```ts
interface CollectableSearchState {
  gp: number;
  integrity: number;
  collectability: number;
  scrutinyActive: boolean;
  collectorsFocusActive: boolean;
  primingTouchActive: boolean;
  hasCollected: boolean;
}
```

若納入強化洞察：

```ts
interface CollectableSearchState {
  enhancedIntuitionAvailable: boolean; // 或由 level >= 100 推導
  enhancedIntuitionActive?: boolean;   // 若它是狀態，不是即時 proc
}
```

若納入多次收藏品採集：

- 使用者確認（2026-05-10）：`Collect` 採集後，收藏價值會維持，不會重置。
- 同一節點內可以在採集後繼續提煉，但通常不需要；較好的策略通常是先提煉到目標價值，再用剩餘耐久連續採集多個同價值收藏品。
- 範例：若前面的提煉流程花 2 點耐久並達到最高價值，剩餘 4 點耐久時，可連續採集 4 個最高價值收藏品。
- 若未來納入石工、理智等恢復耐久技能，則可能在後續採集更多同價值收藏品，或視狀態再提煉。

### Action options

```ts
type CollectableActionKind =
  | 'collect'
  | 'scour'
  | 'brazen'
  | 'meticulous'
  | 'scrutiny'
  | 'collectorsFocus'
  | 'primingTouch';
```

可施放條件：

- `collect`
  - `integrity > 0`
  - 若 `collectability` 未達最低門檻也可採，但 reward 為 0；求解器通常不會選，除非要清空或無其他選擇。
- `scour`
  - `integrity > 0`
  - GP 0
  - 消耗耐久 1
- `brazen`
  - `integrity > 0`
  - GP 0
  - 消耗耐久 1
  - 第一版可禁用。
- `meticulous`
  - `integrity > 0`
  - GP 0
  - 隨機消耗或不消耗耐久。
- `scrutiny`
  - `gp >= 200`
  - `!scrutinyActive`
  - 通常作用於下一次提煉。
- `collectorsFocus`
  - `gp >= 100`
  - `!collectorsFocusActive`
  - 通常作用於下一次提煉。
- `primingTouch`
  - `gp >= 100`
  - `!primingTouchActive`
  - 下一次慎重提煉。

### Result 與 policy

一般採集目前回傳 `rotation: string[]`。收藏品建議回傳 policy tree。

```ts
interface CollectableSolverResult {
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  policy: CollectablePolicyNode;
  debug?: CollectableSolverDebugInfo;
}

interface CollectablePolicyNode {
  id: string;
  state: CollectableStateSummary;
  recommendedAction: CollectableActionSummary;
  expectedScore: number;
  expectedReward: CollectableRewardVector;
  branches: CollectablePolicyBranch[];
}

interface CollectablePolicyBranch {
  label: string;
  condition: string;
  probability: number;
  outcome: CollectableOutcomeSummary;
  next?: CollectablePolicyNode;
}
```

### Memoization key

```ts
function buildCollectableMemoKey(state) {
  return [
    state.gp,
    state.integrity,
    state.collectability,
    state.scrutinyActive ? 1 : 0,
    state.collectorsFocusActive ? 1 : 0,
    state.primingTouchActive ? 1 : 0
  ].join('|');
}
```

若 collectability 可能非常多值，狀態數仍可接受，因為耐久通常 4 到 6，動作數有限。若大膽提煉引入大量隨機檔位，需觀察狀態數並可能壓縮。

### 終止條件

```ts
if (state.integrity <= 0) {
  return zeroRewardResult;
}
```

使用者確認（2026-05-10）：

- 耐久為 0 時會直接結束採集，不能再使用 `Collect`。
- 耐久為 0 時也沒有施展石工、理智等恢復耐久技能的機會。
- 因此求解器必須在 `integrity <= 0` 時立即終止，不可補做任何 action。

注意：

- 收藏品採集沒有額外獲得率狀態，不會發生額外採集。
- 收藏品仍有採集成功率；影響採集成功率的技能與狀態仍可在收藏品採集過程中生效。
- `Collect` 的 reward 期望值應乘上採集成功率；若未來加入成功率技能，需納入策略搜尋。

### Collect action

Collect 將目前 `collectability` 映射成 reward。

```ts
function collect(state) {
  const reward = rewardTable.rewardFor(state.collectability);
  const next = solve({
    ...state,
    integrity: state.integrity - 1,
    collectability: state.collectability,
    scrutinyActive: false,
    collectorsFocusActive: false,
    primingTouchActive: false,
    hasCollected: true
  });
  return addReward(reward, next);
}
```

使用者確認（2026-05-10）：Collect 後收藏價值維持，因此不應重置為 0。求解器應允許連續採集同價值收藏品；通常最佳策略會在達標後直接連續 Collect，除非未來加入恢復耐久技能或其他特殊條件使繼續提煉有價值。

### 提煉類 action outcome

Scour：

```ts
const baseGain = calculateScourValue(...);
const outcomes = applyCollectableGainWithProcs(state, baseGain, actionKind);
```

Meticulous：

```ts
const baseGain = floor(scourValue * 75 / 100);
const noProc = nextState({ integrity: state.integrity - 1 });
const proc = nextState({ integrity: state.integrity });
expected = procRate * solve(proc) + (1 - procRate) * solve(noProc);
```

價值提升與洞察 outcome（舊草案，需依 v1 文件修正）：

注意：以下早期草案把 `IntuitionRate` 和洞察 Buff 混在同一個 outcome。後續實作請以 `.agents/skills/business/collectable_solver_v1_implementation.md` 為準，將「價值提升 / Collector's Intuition」與「洞察 Buff / Collector's Standard」拆成兩個獨立隨機事件。

- 每次提煉類技能應同時有價值提升觸發與未觸發分支。
- 每次收藏品技能結束後，若符合限制，另有 `Collector's Standard / 洞察 Buff` 觸發與未觸發分支。
- 若 `collectorsFocusActive`，本次 value increase rate = focus rate。
- 使用後清除 `collectorsFocusActive`。

建議先建立一個共用函式：

```ts
function buildRefineOutcomes(state, baseGain, options) {
  const gainAfterScrutiny = state.scrutinyActive
    ? applyScrutiny(baseGain, scrutinyMultiplier)
    : baseGain;

  const intuitionGain = applyIntuition(gainAfterScrutiny, scourValue);
  const intuitionRate = state.collectorsFocusActive
    ? applyCollectorsFocus(baseIntuitionRate)
    : baseIntuitionRate;

  return [
    { probability: 1 - intuitionRate, collectabilityGain: gainAfterScrutiny },
    { probability: intuitionRate, collectabilityGain: intuitionGain }
  ];
}
```

但注意：`applyIntuition` 的第一參數應是 `currentValue`，第二參數應是原始 Scour 值還是 action base gain，需專家確認。

### Tie breaker

一般採集有 `rotationPreferenceScore()`。收藏品也需要等價策略偏好：

建議偏好：

- 同分時，較少 GP 消耗優先。
- 同分時，較少操作步數優先。
- 同分時，避免使用隨機性大的大膽提煉。
- 同分時，較早 Collect 達標優先，減少玩家判斷負擔。
- 同分時，策略樹節點較少者優先。

### Debug

收藏品 debug 應列出：

- base Gathering / Perception。
- Scour score 與 Scour value。
- Scrutiny multiplier。
- Intuition rate。
- Collector's Focus rate。
- Meticulous proc rate。
- Reward table 門檻與每檔獎勵。
- 搜尋狀態數、memo hits、分支數。
- 最優性說明。
- 未納入項目，例如大膽提煉分布、強化洞察。

## UIUX 設計

### 核心原則

收藏品求解結果是「決策表」，不是一般採集的橫向技能序列。手機版尤其不適合展示完整樹狀圖。

設計目標：

- 第一眼看到「現在該按什麼」。
- 第二眼看到「如果收藏價值落在哪個範圍，下一步怎麼做」。
- 完整策略樹收進可展開詳情。
- 不提供巨集功能，因為收藏品依賴隨機分支與玩家即時判斷。

### 求解器入口

目前 `Solver.vue` 在收藏品顯示施工中。後續應改成：

- 若 `activeItem.isCollectable`：
  - 顯示收藏品求解器。
- 若 `activeItem.isCrystalGathering`：
  - 仍顯示水晶採集施工中或水晶求解器。
- 否則：
  - 顯示一般採集求解器。

### 輸入區

沿用一般採集：

- 物品標題卡
- 等級、獲得力、鑑別力、GP
- 食物
- 起始 GP
- 節點基礎耐久

收藏品新增：

- 採集類型 badge：
  - 純收藏品繳納
  - 薩雷安魔法大學
  - 珠串萬貨大街
  - 老主顧
  - 精選
- 評分目標 segmented control：
  - 票據
  - 經驗
  - 金幣
  - 自訂
- 若老主顧：
  - 顯示好感度，但若三檔相同不允許選為目標。
- 若資料表缺失：
  - 顯示「找不到此物品的收藏品獎勵表，暫無法求解」。

### 結果摘要

結果頂部：

```txt
建議策略
期望票據：162.4
最高可能：187
最低可交機率：98.3%
高標機率：72.1%
```

依目標切換文字：

- 票據：期望票據
- 經驗：期望經驗
- 金幣：期望金幣

### 主要判斷卡

手機優先呈現：

```txt
現在建議
GP 730 / 耐久 4 / 收藏價值 0
先施展：集中檢查

接下來看收藏價值：
>= 1000：收藏品採集
850 - 999：慎重提煉
< 850 且 GP >= 200：集中檢查 -> 提煉
耐久只剩 1：依目前門檻收藏
```

注意：

- 不要嘗試在主畫面畫大型樹。
- 每條規則應是一張扁平 row，左側條件，右側推薦技能。
- 技能用 icon + 名稱。
- 隨機效果用小 badge，例如「洞察觸發」「慎重未耗耐久」。

### 完整決策樹

放在「詳細策略」accordion / dialog 中。

建議呈現：

- 第一層顯示推薦 action。
- 子分支顯示 outcome 與 probability。
- 每個節點可展開。
- 手機版只顯示一條垂直線，不做橫向樹。

範例：

```txt
集中檢查
└─ 提煉
   ├─ 洞察觸發 32%：收藏價值 430
   │  └─ 慎重提煉
   └─ 未觸發 68%：收藏價值 310
      └─ 價值矚目
```

### 巨集

收藏品求解器不提供巨集：

- 不顯示「預覽巨集」按鈕。
- 可以保留「儲存秘笈」。
- 儲存內容需是 policy，不是 linear rotation。

### Tome Library

現有 `StoredTome` 只支援一般採集 rotation。後續需要擴充：

```ts
type StoredTomeKind = 'regular' | 'collectable' | 'crystal';

interface StoredCollectableTome {
  kind: 'collectable';
  itemId: number;
  stats: PlayerStats;
  temporaryGp: number;
  food: FoodSelection;
  objective: CollectableObjective;
  rewardTableSummary: CollectableRewardTableSummary;
  policy: StoredCollectablePolicy;
  createdAt: string;
}
```

書庫卡片：

- 一般採集：顯示 rotation preview。
- 收藏品：顯示「判斷表 preview」。
- 不顯示巨集按鈕，改顯示「查看策略」或「載回求解器」。

## 實作階段建議

### Phase 1：資料與公式基礎

1. 建立收藏品公式函式與單元測試。
2. 修正 `.agents/skills/business/gathering_math_formulas.md` 中收藏品使用屬性的錯誤。
3. 建立 action id mapping 與 icon/name 載入。
4. 建立 reward table service，至少支援純收藏品繳納。
5. 先禁用大膽提煉與強化洞察，debug 顯示未納入。

### Phase 2：純收藏品求解

1. 新增 `collectableSolver.ts`。
2. 建立 DP + memo policy 求解。
3. 支援：
   - 收藏品採集
   - 提煉
   - 慎重提煉
   - 集中檢查
   - 價值矚目
   - 預備碰觸
   - 一般洞察
4. 結果以 policy tree 回傳。
5. UI 顯示判斷表。

### Phase 3：複合獎勵

1. 支援薩雷安魔法大學 reward table。
2. 支援珠串萬貨大街 reward table。
3. 支援老主顧 reward table。
4. UI 加入評分目標切換。
5. 老主顧顯示好感度但不預設為目標。

### Phase 4：補齊隨機與 Lv100

1. 使用者補大膽提煉分布後，加入大膽提煉。
2. 補強化洞察公式與 trait 判定。
3. 補節點特殊效果與強化洞察、預備碰觸的疊加順序。
4. 增加 debug 分布圖。

### Phase 5：精選

1. 研究 `GathererReductionReward.csv` 與 Teamcraft `reduction.json`。
2. 設計精選 reward model。
3. 評分目標不再是票據，而是靈砂/素材/期望價值。

## 測試策略

### 公式測試

至少覆蓋：

- Score 66、67、85、86、95、100 邊界。
- Scour value 150、190、200。
- Scrutiny multiplier 90、115、125。
- Intuition rate 10、20、40。
- Collector's Focus rate。
- Meticulous proc rate 邊界。
- 預備碰觸翻倍。

### Reward table 測試

至少覆蓋：

- 純收藏品低/中/高三檔。
- `high = 0` 的兩檔表。
- 薩雷安高標 multiplier floor。
- 珠串透過 `CollectablesRefine` 關聯門檻。
- 老主顧好感度三檔相同時不作為 objective。
- RewardCurrency 多獎勵。

### Solver 測試

至少覆蓋：

- 沒有 GP 時仍可用 0 GP 提煉策略。
- GP 足夠時會考慮集中檢查/價值矚目/預備碰觸。
- 慎重提煉不耗耐久分支被納入期望值。
- 同分 tie breaker 選較簡單策略。
- reward objective 切換會改變策略。

### UI 測試

至少覆蓋：

- 收藏品不再顯示施工中。
- 一般採集不受影響。
- 手機版判斷表不橫向 overflow。
- 不顯示巨集按鈕。
- 老主顧顯示好感度但不作為預設求解目標。
- 多語系 key 完整。

## 參考資料

本輪研究用到的資料來源：

- Teamcraft Gathering Math guide
  - `https://guides.ffxivteamcraft.com/guide/gathering-math`
- 使用者提供 PDF
  - `C:\Users\User\Downloads\How to Craft like a Machine_ Otis Edition.pdf`
  - 第 11-12 頁含 Gathering Collectibles 公式。
- Teamcraft JSON
  - `https://github.com/ffxiv-teamcraft/ffxiv-teamcraft/tree/staging/libs/data/src/lib/json`
- xivapi datamining CSV
  - `https://github.com/xivapi/ffxiv-datamining/tree/master/csv/en`
- XIVAPI v2 sheets
  - `https://v2.xivapi.com/docs/guides/sheets/`

## 給後續 Agent 的短結論

收藏品求解系統的核心不是「線性技能序列」，而是「依收藏價值與隨機 proc 結果決策的 policy tree」。第一版應以可靠資料做窄範圍 MVP：先支援純收藏品繳納、Scour、Meticulous、Scrutiny、Collector's Focus、Priming Touch 與一般洞察；暫時排除大膽提煉與強化洞察。等使用者補齊大膽提煉分布與強化洞察公式後，再擴充完整模型。
