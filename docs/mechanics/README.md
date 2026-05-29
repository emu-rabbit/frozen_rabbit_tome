# 機制層現況文件

本資料夾記錄 `frozen_rabbit_tome` 目前程式碼實際採用的採集模型。內容是從 `src/` 與 `assembly/` 的現行實作反推，目的不是整理遊戲攻略，也不是把舊 skill 或規劃文件重新敘述一遍。

這些文件的使用方式：

- 查模型目前怎麼算：先讀對應的 `regular-gathering.md` 或 `collectable-gathering.md`。
- 查疑似與遊戲不一致的地方：先確認文件描述，再回到列出的 source 檔比對。
- 改公式、技能效果、狀態轉移、求解排序或 WASM core 時：文件應同步更新，並依 repo 規則判斷是否需要 bump `src/config/modelVersions.ts`。

## 文件索引

- [一般採集機制層](./regular-gathering.md)
- [收藏品採集機制層](./collectable-gathering.md)

## 讀取來源

本輪整理主要依據：

- `src/utils/gatheringMath.ts`
- `src/utils/regularGatheringMechanics.ts`
- `src/utils/rotationSolver.ts`
- `src/utils/rotationSimulator.ts`
- `src/utils/regularGatheringWasmSolver.ts`
- `assembly/regularGatheringSolverCore.ts`
- `src/utils/collectableMath.ts`
- `src/utils/collectableMechanics.ts`
- `src/utils/collectableSolver.ts`
- `src/utils/collectableWasmSolver.ts`
- `src/utils/collectableWasmPolicy.ts`
- `src/utils/collectableStrategyTree.ts`
- `src/utils/collectableStrategyAnalysis.ts`
- `assembly/collectableSolverCore.ts`
- `src/services/collectableActions.ts`
- `src/utils/collectableObjectivePresets.ts`
- `src/types/game.ts`
- `src/types/collectable.ts`
- `src/config/inputLimits.ts`

## 文件邊界

- 這裡描述「目前模型行為」，不保證等於 FFXIV 遊戲實際行為。
- 若文件中的行為與遊戲內容不同，優先視為模型校正線索，而不是文件錯誤。
- 若 TypeScript mechanics、TypeScript fallback、AssemblyScript WASM core 之間出現差異，應先以使用者可見的正式路徑確認；目前一般採集與收藏品秘笈皆為 WASM-first，實驗與 policy materialization 仍大量使用 TypeScript mechanics。
