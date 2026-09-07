# Frozen Rabbit Tome

> **"Secret gathering tips from the rabbit."** Frozen Rabbit Tome is a Final Fantasy XIV gatherer toolkit for recommended gathering strategies, rotation simulation, and collectable decision support.

[![FFXIV](https://img.shields.io/badge/Final%20Fantasy%20XIV-FFXIV-blue.svg)](https://na.finalfantasyxiv.com/)
[![Vue](https://img.shields.io/badge/Vue-3-green.svg)](https://vuejs.org/)
[![Teamcraft](https://img.shields.io/badge/Data-Teamcraft-green.svg)](https://ffxivteamcraft.com/)
[![XIVAPI](https://img.shields.io/badge/Data-XIVAPI-orange.svg)](https://xivapi.com/)

## Overview

**Frozen Rabbit Tome** helps FFXIV Miner and Botanist players reason through gathering actions when GP, durability, gathering rate, boon rate, and collectability all start pulling in different directions.

Instead of asking you to compare every possible action branch by hand, the Tome lets you enter your character stats and node conditions, then calculates recommended strategies within the currently supported model. When you already have a plan in mind, the Experiment tools can simulate it, summarize the result, and help you compare tradeoffs with a little less spreadsheet smoke.

Live site: [https://tome.frozenrabbit.com/](https://tome.frozenrabbit.com/)

Deployment and domain cutover: [domain migration checklist](docs/domain-migration.md).

## Core Features

### Tome Solver
- **Regular gathering recommendations**: Calculates recommended action sequences from your level, Gathering, Perception, GP, item data, durability, and node bonuses.
- **Collectable policy guidance**: Supports collectable gathering as a decision tree / policy table, because collectables often depend on the current in-game state rather than one fixed linear rotation.
- **Goal modes**: Lets you choose whether recommendations should lean toward expected value, higher ceiling, or safer floor.
- **Expert check mode**: Shows formulas, probability distributions, and search details when you want to inspect the reasoning path.

### Experiment Tools
- **Custom rotation simulation**: Build your own regular gathering action sequence and calculate expected yield, min / max outcomes, GP usage, and risk.
- **Collectable strategy analysis**: Test collectable strategy rules and inspect reward tiers, score expectations, and state-dependent choices.
- **Report copying**: Copy a compact result summary for sharing, note-taking, or comparing several approaches side by side.

### Library and Database
- **Tome Library**: Save solved Tome setups and load them back later with their item, stats, bonuses, and recommendation context.
- **Experiment Database**: Save simulation setups and analysis results for repeat checks.
- **Favorite Items**: Keep commonly used gathering items close at hand without locking them to one gear profile or one solved result.

### Gear and Comfort
- **Gear stat profiles**: Store multiple gatherer stat sets, including level, Gathering, Perception, GP, food, and collectable relic tool settings.
- **Localized item and action names**: Search and read supported data in multiple languages, with English fallback when needed.
- **Light / dark mode**: Uses the same Frozen Rabbit visual language as the sister project, with soft green accents and a quieter reading surface.

## Current Scope

Frozen Rabbit Tome is currently in early alpha. The supported actions and items are based on Final Fantasy XIV Patch 7.5 data, and the solver output should be treated as a **recommended strategy within the supported model**, not an absolute answer for every possible in-game situation.

Current known boundaries:
- Focuses on Miner and Botanist. Fisher is outside the current model.
- Crystal / shard / cluster gathering is hidden by default and not part of the stable solver flow yet.
- Some actions with uncertain formulas or very large search expansion, such as Brazen Prospector / Brazen Woodsman and Collector's High Standard, are intentionally outside the current solver search.
- Collectable recommendations are not macro output; they are policy guidance for choosing the next action from the current state.

## Language Support

Frozen Rabbit Tome provides localized interface text and game terminology for:
- Traditional Chinese
- Simplified Chinese
- English
- Japanese

## Tech Stack

- **Frontend**: Vue 3 + Vite
- **Styling**: Tailwind CSS / Vanilla CSS
- **State Management**: Vue Composition API
- **Internationalization**: Vue I18n
- **UI / Icons**: PrimeVue + PrimeIcons
- **Testing**: Vitest + Playwright

## Local Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run test:unit
npm run test:e2e
```

## Credits and Open Source Notice

This project is supported by data and tooling from community projects:
- **Teamcraft**: Gatherable items, collectable rewards, and action display data.
- **XIVAPI**: Gathering tables, collectable checks, and icon API support.

Final Fantasy XIV is owned by Square Enix. This project is a fan-made community tool and is not affiliated with or endorsed by Square Enix.

---

### FAQ

**Q: Does the Tome Solver output the best possible answer?**

**A:** It recommends a strategy based on the currently supported model, your selected goal, and your input conditions. For deeper comparison, use the Experiment tools to simulate your own approaches too.

**Q: Why freeze the rabbit? Can I roast it instead?**

**A: No.**

---

*Made with love for the FFXIV community.*

---

## 繁體中文

# 冷凍兔肉的秘笈 | Frozen Rabbit Tome

> **「兔肉不私藏的好秘笈」** - 為《Final Fantasy XIV》（FFXIV）大地使者設計的採集策略推薦、模擬與分析工具。

[![FFXIV](https://img.shields.io/badge/Final%20Fantasy%20XIV-FFXIV-blue.svg)](https://na.finalfantasyxiv.com/)
[![Vue](https://img.shields.io/badge/Vue-3-green.svg)](https://vuejs.org/)
[![Teamcraft](https://img.shields.io/badge/Data-Teamcraft-green.svg)](https://ffxivteamcraft.com/)
[![XIVAPI](https://img.shields.io/badge/Data-XIVAPI-orange.svg)](https://xivapi.com/)

## 專案簡介

**冷凍兔肉的秘笈** 是一個專為 FFXIV 採掘師與園藝師打造的採集策略工具。當 GP、耐久、採集成功率、額外採集率與收藏價值交錯在一起時，秘笈可以協助你在目前支援的模型內推算推薦手法，讓複雜的採集判斷變得比較好入口。

如果你已經有想測試的手法，也可以到實驗區自行組合技能，讓系統替你模擬結果、整理期望值與風險，方便比較不同流派的取捨。

網站連結：[https://tome.frozenrabbit.com/](https://tome.frozenrabbit.com/)

部署與網域切換：[網域遷移說明](docs/domain-migration.md)。

## 核心功能

### 秘笈求解器 (Tome Solver)
- **一般採集推薦**：根據等級、獲得力、鑑別力、GP、物品資料、耐久與採集點獎勵，計算推薦採集手法。
- **收藏品策略指引**：收藏品採集支援判斷表 / policy tree，因為收藏品常常需要依照當下狀態選擇下一步，而不是固定照一條 rotation 走到底。
- **求解目標模式**：可依期望值、較高上限或較保守下限調整推薦傾向。
- **專家檢查模式**：需要核對公式、機率分布或搜尋過程時，可以開啟更詳細的檢查資訊。

### 實驗工具
- **指定手法模擬**：自行建立一般採集技能串，分析期望獲得量、最大 / 最小結果、GP 使用與風險。
- **收藏品策略分析**：測試收藏品策略規則，檢視獎勵檔位、分數期望與不同狀態下的行動選擇。
- **報告複製**：快速複製分析摘要，方便分享、記錄或並排比較多組手法。

### 藏書庫與數據庫
- **秘笈藏書庫**：儲存求解過的秘笈設定，之後可帶著物品、數值、獎勵條件與推薦脈絡重新載入。
- **實驗數據庫**：保存模擬設定與分析結果，方便反覆檢查。
- **最愛的物品**：收藏常用採集物品；它只保存物品本身，不會把裝備數值或求解結果綁死。

### 裝備與舒適度
- **裝備數值設定檔**：可保存多組大地使者數值，包含等級、獲得力、鑑別力、GP、食物與收藏品遺物效果。
- **多語系物品與技能名稱**：支援多語系搜尋與顯示，缺少翻譯時會使用英文 fallback。
- **明亮 / 黑暗模式**：承襲 Frozen Rabbit 姊妹站的柔和綠色與沉穩介面語彙，讓長時間查表也比較舒服。

## 目前支援範圍

冷凍兔肉的秘笈目前仍在超先行測試階段。技能與物品資料以 Final Fantasy XIV 7.5 版本內容為基礎；求解器輸出應視為「在目前支援模型與輸入條件下的推薦策略」，不是所有遊戲情境中的絕對答案。

目前已知邊界：
- 主要支援採掘師與園藝師；漁師不在目前模型中。
- 水晶、碎晶、晶簇採集預設隱藏，尚未納入穩定求解流程。
- 大膽提煉、強化洞察等公式尚未完整確認或搜尋空間過大的技能，暫時不放進求解器探索範圍。
- 收藏品推薦不是巨集輸出，而是依當前狀態判斷下一步的策略指引。

## 多語系支援

秘笈提供以下語系的介面與遊戲術語支援：
- 繁體中文 (Traditional Chinese)
- 簡體中文 (Simplified Chinese)
- English
- 日本語 (Japanese)

## 技術架構

- **Frontend**: Vue 3 + Vite
- **Styling**: Tailwind CSS / Vanilla CSS
- **State Management**: Vue Composition API
- **Internationalization**: Vue I18n
- **UI / Icons**: PrimeVue + PrimeIcons
- **Testing**: Vitest + Playwright

## 本機開發

```bash
npm install
npm run dev
```

常用指令：

```bash
npm run build
npm run test:unit
npm run test:e2e
```

## 致謝與開源聲明

本專案的資料與技術獲得以下社群專案支持：
- **Teamcraft**：提供採集物品、收藏品獎勵與技能顯示資料。
- **XIVAPI**：提供採集資料表、收藏品判定與圖示 API 支援。

Final Fantasy XIV 版權歸 Square Enix 所有。本專案為玩家自製社群工具，並非 Square Enix 官方專案，也未受到官方背書。

---

### 常見問題

**Q: 秘笈求解器輸出的是最佳解嗎？**

**A:** 它會根據目前支援模型、你選擇的目標與輸入條件推薦策略。若想深入比較，也很推薦把自己的手法帶到實驗區一起模擬看看。

**Q: 為甚麼要把兔肉冷凍起來，可以烤來吃嗎？**

**A: 不可以。**

---

*Made with love for the FFXIV community.*
