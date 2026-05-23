const FLAG_SCRUTINY: i32 = 1 << 0;
const FLAG_FOCUS: i32 = 1 << 1;
const FLAG_PRIMING: i32 = 1 << 2;
const FLAG_STANDARD: i32 = 1 << 3;
const FLAG_HAS_USED: i32 = 1 << 4;
const FLAG_HAS_COLLECTED: i32 = 1 << 5;
const FLAG_SUCCESS_I: i32 = 1 << 6;
const FLAG_SUCCESS_II: i32 = 1 << 7;
const FLAG_SUCCESS_III: i32 = 1 << 8;
const FLAG_WISE: i32 = 1 << 9;

const COLLECTABILITY_CAP: i32 = 1000;
const REGULAR_REVISIT_CHANCE: f64 = 0.05;
const TIMED_REVISIT_CHANCE: f64 = 0.08;
const EV_EPSILON: f64 = 0.0000001;
const EMPTY_KEY: i64 = 0;
const MEMO_LOAD_LIMIT_PERCENT: i32 = 85;
const OBJECTIVE_EXPECTED: i32 = 0;
const OBJECTIVE_MIN: i32 = 1;
const OBJECTIVE_MAX: i32 = 2;
const ACTION_COLLECT: i32 = 0;
const ACTION_SCOUR: i32 = 1;
const ACTION_METICULOUS: i32 = 2;
const ACTION_SCRUTINY: i32 = 3;
const ACTION_FOCUS: i32 = 4;
const ACTION_PRIMING: i32 = 5;
const ACTION_SUCCESS_I: i32 = 6;
const ACTION_SUCCESS_II: i32 = 7;
const ACTION_SUCCESS_III: i32 = 8;
const ACTION_NEXT_COLLECT_SUCCESS: i32 = 9;
const ACTION_RESTORE: i32 = 10;
const ACTION_WISE: i32 = 11;

let level: i32 = 100;
let maxGp: i32 = 930;
let maxIntegrity: i32 = 4;
let objectiveMode: i32 = OBJECTIVE_EXPECTED;
let baseSuccessRate: i32 = 100;
let scourValue: i32 = 150;
let valueIncreaseRate: i32 = 10;
let focusedValueIncreaseRate: i32 = 17;
let meticulousRate: i32 = 5;
let primedMeticulousRate: i32 = 10;
let scrutinyMultiplier: i32 = 90;
let standardProcRate: f64 = 0.25;
let timedNode: bool = false;

let lowCollectability: i32 = 600;
let lowScore: f64 = 16;
let midCollectability: i32 = 800;
let midScore: f64 = 18;
let highCollectability: i32 = 1000;
let highScore: f64 = 22;

let keys = new StaticArray<i64>(1);
let objectiveScores = new StaticArray<f64>(1);
let expectedScores = new StaticArray<f64>(1);
let gpSpents = new StaticArray<f64>(1);
let actionCounts = new StaticArray<f64>(1);
let nodeCounts = new StaticArray<f64>(1);
let collectSuccessDepths = new StaticArray<i32>(1);
let nextCollectSuccessDepths = new StaticArray<i32>(1);
let wiseToTheWorldDepths = new StaticArray<i32>(1);
let restorePreferenceScores = new StaticArray<f64>(1);
let preferredRestoreCounts = new StaticArray<i32>(1);
let bestActions = new StaticArray<i32>(1);
let used = new StaticArray<u8>(1);
let capacity: i32 = 1;
let mask: i32 = 0;
let failed: bool = false;
let memoSize: i32 = 0;

let statesSolved: i64 = 0;
let memoHits: i64 = 0;
let actionsEvaluated: i64 = 0;
let candidateComparisons: i64 = 0;
let terminalStates: i64 = 0;
let branchCount: i64 = 0;

let candidateObjectiveScore: f64 = 0.0;
let candidateExpectedScore: f64 = 0.0;
let candidateGpSpent: f64 = 0.0;
let candidateActionCount: f64 = 0.0;
let candidateNodeCount: f64 = 1.0;
let candidateCollectSuccessDepth: i32 = -1;
let candidateNextCollectSuccessDepth: i32 = -1;
let candidateWiseToTheWorldDepth: i32 = -1;
let candidateRestorePreferenceScore: f64 = 0.0;
let candidatePreferredRestoreCount: i32 = 0;

function minI32(left: i32, right: i32): i32 {
  return left < right ? left : right;
}

function maxI32(left: i32, right: i32): i32 {
  return left > right ? left : right;
}

function resetMemo(nextCapacity: i32): void {
  if (capacity != nextCapacity) {
    capacity = nextCapacity;
    mask = capacity - 1;
    keys = new StaticArray<i64>(capacity);
    objectiveScores = new StaticArray<f64>(capacity);
    expectedScores = new StaticArray<f64>(capacity);
    gpSpents = new StaticArray<f64>(capacity);
    actionCounts = new StaticArray<f64>(capacity);
    nodeCounts = new StaticArray<f64>(capacity);
    collectSuccessDepths = new StaticArray<i32>(capacity);
    nextCollectSuccessDepths = new StaticArray<i32>(capacity);
    wiseToTheWorldDepths = new StaticArray<i32>(capacity);
    restorePreferenceScores = new StaticArray<f64>(capacity);
    preferredRestoreCounts = new StaticArray<i32>(capacity);
    bestActions = new StaticArray<i32>(capacity);
    used = new StaticArray<u8>(capacity);
  } else {
    for (let index = 0; index < capacity; index++) {
      unchecked(used[index] = 0);
    }
  }
  failed = false;
  memoSize = 0;
  statesSolved = 0;
  memoHits = 0;
  actionsEvaluated = 0;
  candidateComparisons = 0;
  terminalStates = 0;
  branchCount = 0;
}

function calculateScore(currentStat: i32, baseValue: i32): i32 {
  if (baseValue <= 0) return 0;
  return <i32>Math.floor(<f64>(100 * currentStat) / <f64>baseValue);
}

function calculateSuccessRate(gathering: i32, baseGathering: i32, playerLevel: i32, itemLevel: i32): i32 {
  const score = calculateScore(gathering, baseGathering);
  let rate: i32;

  if (score <= 0) rate = 0;
  else if (score <= 10) rate = 1;
  else if (score <= 20) rate = 2 + (score - 11) * 2;
  else if (score <= 40) rate = <i32>Math.floor(20 + <f64>(score - 20) * 1.6);
  else if (score <= 43) rate = 52 + (score - 40) * 2;
  else if (score == 44) rate = 58;
  else if (score == 45) rate = 60;
  else if (score <= 63) rate = 60 + <i32>Math.floor(<f64>((score - 45) * 5) / 9.0);
  else if (score <= 75) rate = 72 + (score - 64) * 2;
  else if (score <= 79) rate = 94 + (score - 75);
  else rate = 100;

  if (itemLevel > 0 && rate > 0 && rate < 100) {
    const levelDifference = playerLevel - itemLevel;
    if (levelDifference > 0) rate += minI32(5, levelDifference);
    else if (levelDifference < 0) rate -= minI32(25, -levelDifference * 5);
  }

  if (rate < 0) return 0;
  if (rate > 100) return 100;
  return rate;
}

function collectableActionScore(currentStat: i32, baseValue: i32): i32 {
  return minI32(95, calculateScore(currentStat, baseValue));
}

function collectableRateScore(currentStat: i32, baseValue: i32): i32 {
  return minI32(100, calculateScore(currentStat, baseValue));
}

function calculateScourValue(gathering: i32, baseGathering: i32): i32 {
  const score = collectableActionScore(gathering, baseGathering);
  if (score <= 66) return 150;
  if (score <= 85) return <i32>Math.floor(<f64>((score - 66) * 40) / 19.0 + 150.0);
  return score - 85 + 190;
}

function calculateValueRate(gathering: i32, baseGathering: i32): i32 {
  const score = collectableRateScore(gathering, baseGathering);
  if (score <= 66) return 10;
  if (score <= 85) return <i32>Math.floor(<f64>((score - 66) * 10) / 19.0 + 10.0);
  return <i32>Math.floor(<f64>((score - 85) * 20) / 15.0 + 20.0);
}

function calculateFocusedRate(rate: i32): i32 {
  return minI32(100, <i32>Math.floor(<f64>(rate * 175) / 100.0));
}

function calculateMeticulousRate(gathering: i32, baseGathering: i32): i32 {
  const score = collectableRateScore(gathering, baseGathering);
  if (score <= 66) return 5;
  if (score <= 85) return <i32>Math.floor(<f64>((score - 66) * 5) / 19.0 + 5.0);
  return score - 85 + 10;
}

function calculateScrutinyMultiplier(perception: i32, basePerception: i32): i32 {
  const score = collectableActionScore(perception, basePerception);
  if (score <= 66) return 90;
  if (score <= 85) return <i32>Math.floor(<f64>((score - 66) * 25) / 19.0 + 90.0);
  return score - 85 + 115;
}

function scoreCollectability(collectability: i32): f64 {
  if (highCollectability > 0 && collectability >= highCollectability) return highScore;
  if (collectability >= midCollectability) return midScore;
  if (collectability >= lowCollectability) return lowScore;
  return 0.0;
}

function packKey(gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): i64 {
  let key = <i64>(gp & 4095);
  key |= <i64>(integrity & 15) << 12;
  key |= <i64>(collectability & 1023) << 16;
  key |= <i64>(flags & 1023) << 26;
  key |= <i64>(successBonus & 127) << 36;
  key |= <i64>(nextBonus & 31) << 43;
  return key + 1;
}

function hashKey(key: i64): i32 {
  let x = <u64>key;
  x ^= x >> 33;
  x *= 0xff51afd7ed558ccd;
  x ^= x >> 33;
  x *= 0xc4ceb9fe1a85ec53;
  x ^= x >> 33;
  return <i32>x & mask;
}

function memoGet(key: i64): f64 {
  const index = memoFindIndex(key);
  if (index < 0) return NaN;
  memoHits += 1;
  return unchecked(objectiveScores[index]);
}

function memoFindIndex(key: i64): i32 {
  let index = hashKey(key);
  const startIndex = index;
  while (unchecked(used[index]) != 0) {
    if (unchecked(keys[index]) == key) {
      return index;
    }
    index = (index + 1) & mask;
    if (index == startIndex) return -1;
  }
  return -1;
}

function memoSet(
  key: i64,
  objectiveScore: f64,
  expectedScore: f64,
  gpSpent: f64,
  actionCount: f64,
  nodeCount: f64,
  collectSuccessDepth: i32,
  nextCollectSuccessDepth: i32,
  wiseToTheWorldDepth: i32,
  restorePreferenceScore: f64,
  preferredRestoreCount: i32,
  bestAction: i32
): void {
  if ((memoSize + 1) * 100 >= capacity * MEMO_LOAD_LIMIT_PERCENT) {
    failed = true;
    abort('Collectable WASM memo table capacity exceeded.', 'collectableSolverCore.ts', 0, 0);
  }

  let index = hashKey(key);
  const startIndex = index;
  while (unchecked(used[index]) != 0) {
    if (unchecked(keys[index]) == key) {
      unchecked(objectiveScores[index] = objectiveScore);
      unchecked(expectedScores[index] = expectedScore);
      unchecked(gpSpents[index] = gpSpent);
      unchecked(actionCounts[index] = actionCount);
      unchecked(nodeCounts[index] = nodeCount);
      unchecked(collectSuccessDepths[index] = collectSuccessDepth);
      unchecked(nextCollectSuccessDepths[index] = nextCollectSuccessDepth);
      unchecked(wiseToTheWorldDepths[index] = wiseToTheWorldDepth);
      unchecked(restorePreferenceScores[index] = restorePreferenceScore);
      unchecked(preferredRestoreCounts[index] = preferredRestoreCount);
      unchecked(bestActions[index] = bestAction);
      return;
    }
    index = (index + 1) & mask;
    if (index == startIndex) {
      failed = true;
      abort('Collectable WASM memo table is full.', 'collectableSolverCore.ts', 0, 0);
    }
  }
  unchecked(used[index] = 1);
  memoSize += 1;
  unchecked(keys[index] = key);
  unchecked(objectiveScores[index] = objectiveScore);
  unchecked(expectedScores[index] = expectedScore);
  unchecked(gpSpents[index] = gpSpent);
  unchecked(actionCounts[index] = actionCount);
  unchecked(nodeCounts[index] = nodeCount);
  unchecked(collectSuccessDepths[index] = collectSuccessDepth);
  unchecked(nextCollectSuccessDepths[index] = nextCollectSuccessDepth);
  unchecked(wiseToTheWorldDepths[index] = wiseToTheWorldDepth);
  unchecked(restorePreferenceScores[index] = restorePreferenceScore);
  unchecked(preferredRestoreCounts[index] = preferredRestoreCount);
  unchecked(bestActions[index] = bestAction);
}

function canRaiseCollectSuccess(successBonus: i32): bool {
  return baseSuccessRate > 1 && baseSuccessRate + successBonus < 100;
}

function canUse(action: i32, gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): bool {
  if (action == 0) return integrity > 0;
  if (action == 1 || action == 2) return integrity > 0 && collectability < COLLECTABILITY_CAP;
  if (action == 3) return gp >= 200 && collectability < COLLECTABILITY_CAP && (flags & FLAG_SCRUTINY) == 0;
  if (action == 4) return level >= 85 && gp >= 100 && collectability < COLLECTABILITY_CAP && (flags & FLAG_FOCUS) == 0;
  if (action == 5) return level >= 95 && gp >= 100 && collectability < COLLECTABILITY_CAP && (flags & FLAG_PRIMING) == 0;
  if (action == 6) return gp >= 50 && (flags & FLAG_SUCCESS_I) == 0 && canRaiseCollectSuccess(successBonus);
  if (action == 7) return gp >= 100 && (flags & FLAG_SUCCESS_II) == 0 && canRaiseCollectSuccess(successBonus);
  if (action == 8) return gp >= 250 && (flags & FLAG_SUCCESS_III) == 0 && canRaiseCollectSuccess(successBonus);
  if (action == 9) return gp >= 50 && nextBonus == 0 && canRaiseCollectSuccess(successBonus);
  if (action == 10) return gp >= 300 && integrity < maxIntegrity;
  if (action == 11) return level >= 90 && (flags & FLAG_WISE) != 0 && integrity < maxIntegrity;
  return false;
}

function actionGpCost(action: i32): f64 {
  if (action == ACTION_SCRUTINY) return 200.0;
  if (action == ACTION_FOCUS) return 100.0;
  if (action == ACTION_PRIMING) return 100.0;
  if (action == ACTION_SUCCESS_I) return 50.0;
  if (action == ACTION_SUCCESS_II) return 100.0;
  if (action == ACTION_SUCCESS_III) return 250.0;
  if (action == ACTION_NEXT_COLLECT_SUCCESS) return 50.0;
  if (action == ACTION_RESTORE) return 300.0;
  return 0.0;
}

function habitPreferenceScore(
  restorePreferenceScore: f64,
  collectSuccessDepth: i32,
  nextCollectSuccessDepth: i32,
  wiseToTheWorldDepth: i32
): f64 {
  let score = restorePreferenceScore;
  if (collectSuccessDepth >= 0) {
    score += 1500.0 - <f64>collectSuccessDepth * 50.0;
  }
  if (nextCollectSuccessDepth >= 0) {
    score += 1000.0 - <f64>nextCollectSuccessDepth * 50.0;
  }
  if (wiseToTheWorldDepth >= 0) {
    score += 800.0 - <f64>wiseToTheWorldDepth * 40.0;
  }
  return score;
}

function preferredResult(
  candidateObjective: f64,
  candidateGpSpent: f64,
  candidateCollectDepth: i32,
  candidateNextDepth: i32,
  candidateWiseDepth: i32,
  candidateRestoreScore: f64,
  candidateActionCount: f64,
  candidateNodeCount: f64,
  currentObjective: f64,
  currentGpSpent: f64,
  currentCollectDepth: i32,
  currentNextDepth: i32,
  currentWiseDepth: i32,
  currentRestoreScore: f64,
  currentActionCount: f64,
  currentNodeCount: f64
): bool {
  if (candidateObjective > currentObjective + EV_EPSILON) return true;
  if (candidateObjective < currentObjective - EV_EPSILON) return false;
  if (candidateGpSpent != currentGpSpent) return candidateGpSpent < currentGpSpent;
  if (candidateActionCount != currentActionCount) return candidateActionCount < currentActionCount;
  if (candidateNodeCount != currentNodeCount) return candidateNodeCount < currentNodeCount;

  const candidateHabit = habitPreferenceScore(candidateRestoreScore, candidateCollectDepth, candidateNextDepth, candidateWiseDepth);
  const currentHabit = habitPreferenceScore(currentRestoreScore, currentCollectDepth, currentNextDepth, currentWiseDepth);
  return candidateHabit > currentHabit;
}

function childIndex(gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): i32 {
  if (integrity <= 0) return -1;
  return memoFindIndex(packKey(gp, integrity, collectability, flags, successBonus, nextBonus));
}

function childObjectiveScore(index: i32): f64 {
  return index >= 0 ? unchecked(objectiveScores[index]) : 0.0;
}

function childExpectedScore(index: i32): f64 {
  return index >= 0 ? unchecked(expectedScores[index]) : 0.0;
}

function childGpSpent(index: i32): f64 {
  return index >= 0 ? unchecked(gpSpents[index]) : 0.0;
}

function childActionCount(index: i32): f64 {
  return index >= 0 ? unchecked(actionCounts[index]) : 0.0;
}

function childNodeCount(index: i32): f64 {
  return index >= 0 ? unchecked(nodeCounts[index]) : 1.0;
}

function childCollectDepth(index: i32): i32 {
  return index >= 0 ? unchecked(collectSuccessDepths[index]) : -1;
}

function childNextDepth(index: i32): i32 {
  return index >= 0 ? unchecked(nextCollectSuccessDepths[index]) : -1;
}

function childWiseDepth(index: i32): i32 {
  return index >= 0 ? unchecked(wiseToTheWorldDepths[index]) : -1;
}

function childRestoreScore(index: i32): f64 {
  return index >= 0 ? unchecked(restorePreferenceScores[index]) : 0.0;
}

function childPreferredRestoreCount(index: i32): i32 {
  return index >= 0 ? unchecked(preferredRestoreCounts[index]) : 0;
}

function combineObjective(current: f64, branchScore: f64, probability: f64): f64 {
  if (objectiveMode == OBJECTIVE_EXPECTED) return current + branchScore * probability;
  if (objectiveMode == OBJECTIVE_MAX) return branchScore > current ? branchScore : current;
  return branchScore < current ? branchScore : current;
}

function initialObjective(): f64 {
  if (objectiveMode == OBJECTIVE_MAX) return -1.0e100;
  if (objectiveMode == OBJECTIVE_MIN) return 1.0e100;
  return 0.0;
}

function resetCandidate(action: i32, integrity: i32): void {
  candidateObjectiveScore = initialObjective();
  candidateExpectedScore = 0.0;
  candidateGpSpent = actionGpCost(action);
  candidateActionCount = 1.0;
  candidateNodeCount = 1.0;
  candidateCollectSuccessDepth = -1;
  candidateNextCollectSuccessDepth = -1;
  candidateWiseToTheWorldDepth = -1;
  candidateRestorePreferenceScore = 0.0;
  candidatePreferredRestoreCount = 0;

  if (action == ACTION_RESTORE) {
    const missingIntegrity = maxIntegrity - integrity;
    const preferredMissingIntegrity = level >= 90 ? 2 : 1;
    if (missingIntegrity >= preferredMissingIntegrity) {
      candidateRestorePreferenceScore = 500.0;
      candidatePreferredRestoreCount = 1;
    } else {
      candidateRestorePreferenceScore = -500.0;
    }
  }
}

function minDepth(current: i32, next: i32): i32 {
  if (next < 0) return current;
  if (current < 0 || next < current) return next;
  return current;
}

function addBranch(
  probability: f64,
  immediateScore: f64,
  gp: i32,
  integrity: i32,
  collectability: i32,
  flags: i32,
  successBonus: i32,
  nextBonus: i32
): void {
  if (probability <= 0.0) return;

  branchCount += 1;
  const savedObjectiveScore = candidateObjectiveScore;
  const savedExpectedScore = candidateExpectedScore;
  const savedGpSpent = candidateGpSpent;
  const savedActionCount = candidateActionCount;
  const savedNodeCount = candidateNodeCount;
  const savedCollectSuccessDepth = candidateCollectSuccessDepth;
  const savedNextCollectSuccessDepth = candidateNextCollectSuccessDepth;
  const savedWiseToTheWorldDepth = candidateWiseToTheWorldDepth;
  const savedRestorePreferenceScore = candidateRestorePreferenceScore;
  const savedPreferredRestoreCount = candidatePreferredRestoreCount;
  const objectiveScore = solve(gp, integrity, collectability, flags, successBonus, nextBonus);
  const index = childIndex(gp, integrity, collectability, flags, successBonus, nextBonus);
  const totalObjectiveScore = immediateScore + objectiveScore;
  candidateObjectiveScore = savedObjectiveScore;
  candidateExpectedScore = savedExpectedScore;
  candidateGpSpent = savedGpSpent;
  candidateActionCount = savedActionCount;
  candidateNodeCount = savedNodeCount;
  candidateCollectSuccessDepth = savedCollectSuccessDepth;
  candidateNextCollectSuccessDepth = savedNextCollectSuccessDepth;
  candidateWiseToTheWorldDepth = savedWiseToTheWorldDepth;
  candidateRestorePreferenceScore = savedRestorePreferenceScore;
  candidatePreferredRestoreCount = savedPreferredRestoreCount;
  candidateObjectiveScore = combineObjective(candidateObjectiveScore, totalObjectiveScore, probability);
  candidateExpectedScore += (immediateScore + childExpectedScore(index)) * probability;
  candidateGpSpent += childGpSpent(index) * probability;
  candidateActionCount += childActionCount(index) * probability;
  candidateNodeCount += childNodeCount(index);
  candidateCollectSuccessDepth = minDepth(candidateCollectSuccessDepth, childCollectDepth(index));
  candidateNextCollectSuccessDepth = minDepth(candidateNextCollectSuccessDepth, childNextDepth(index));
  candidateWiseToTheWorldDepth = minDepth(candidateWiseToTheWorldDepth, childWiseDepth(index));
  candidateRestorePreferenceScore += childRestoreScore(index) - <f64>childPreferredRestoreCount(index) * 20.0;
  candidatePreferredRestoreCount += childPreferredRestoreCount(index);
}

function finalizeCandidateDepths(action: i32): void {
  if (action == ACTION_SUCCESS_I || action == ACTION_SUCCESS_II || action == ACTION_SUCCESS_III) {
    candidateCollectSuccessDepth = 0;
  } else if (candidateCollectSuccessDepth >= 0) {
    candidateCollectSuccessDepth += 1;
  }

  if (action == ACTION_NEXT_COLLECT_SUCCESS) {
    candidateNextCollectSuccessDepth = 0;
  } else if (candidateNextCollectSuccessDepth >= 0) {
    candidateNextCollectSuccessDepth += 1;
  }

  if (action == ACTION_WISE) {
    candidateWiseToTheWorldDepth = 0;
  } else if (candidateWiseToTheWorldDepth >= 0) {
    candidateWiseToTheWorldDepth += 1;
  }
}

function evaluateCandidate(action: i32, gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): void {
  resetCandidate(action, integrity);

  if (action == ACTION_COLLECT) {
    const successRate = <f64>minI32(100, maxI32(0, baseSuccessRate + successBonus + nextBonus)) / 100.0;
    const nextFlags = flags | FLAG_HAS_USED | FLAG_HAS_COLLECTED;
    const successGp = minI32(maxGp, gp + (level >= 70 ? 6 : 5));
    addBranch(successRate, scoreCollectability(collectability), successGp, integrity - 1, collectability, nextFlags, successBonus, 0);
    addBranch(1.0 - successRate, 0.0, gp, integrity - 1, collectability, nextFlags, successBonus, 0);
    finalizeCandidateDepths(action);
    return;
  }

  if (action == ACTION_SCOUR || action == ACTION_METICULOUS) {
    const valueRate = <f64>(((flags & FLAG_FOCUS) != 0) ? focusedValueIncreaseRate : valueIncreaseRate) / 100.0;
    const saveRate = <f64>(((flags & FLAG_PRIMING) != 0) ? primedMeticulousRate : meticulousRate) / 100.0;

    for (let valueIndex = 0; valueIndex < 2; valueIndex++) {
      const valueIncrease = valueIndex == 1;
      const valueProbability = valueIncrease ? valueRate : 1.0 - valueRate;
      if (valueProbability <= 0.0) continue;

      const durabilityOptions = action == ACTION_METICULOUS ? 2 : 1;
      for (let durabilityIndex = 0; durabilityIndex < durabilityOptions; durabilityIndex++) {
        const integrityCost = action == ACTION_METICULOUS && durabilityIndex == 0 ? 0 : 1;
        const durabilityProbability = action == ACTION_METICULOUS
          ? (durabilityIndex == 0 ? saveRate : 1.0 - saveRate)
          : 1.0;
        if (durabilityProbability <= 0.0) continue;

        const gain = refineGain(action, flags, valueIncrease);
        const nextCollectability = minI32(COLLECTABILITY_CAP, collectability + gain);
        const nextIntegrity = integrity - integrityCost;
        let nextFlags = flags | FLAG_HAS_USED;
        nextFlags &= ~FLAG_SCRUTINY;
        nextFlags &= ~FLAG_FOCUS;
        if (action == ACTION_METICULOUS) {
          nextFlags &= ~FLAG_PRIMING;
          nextFlags &= ~FLAG_STANDARD;
        }

        const baseProbability = valueProbability * durabilityProbability;
        const canProcStandard = nextIntegrity > 0
          && nextCollectability < COLLECTABILITY_CAP
          && (nextFlags & FLAG_STANDARD) == 0
          && standardProcRate > 0.0;

        if (canProcStandard) {
          addBranch(
            baseProbability * standardProcRate,
            0.0,
            gp,
            nextIntegrity,
            nextCollectability,
            nextFlags | FLAG_STANDARD,
            successBonus,
            nextBonus
          );
          addBranch(
            baseProbability * (1.0 - standardProcRate),
            0.0,
            gp,
            nextIntegrity,
            nextCollectability,
            nextFlags,
            successBonus,
            nextBonus
          );
        } else {
          addBranch(baseProbability, 0.0, gp, nextIntegrity, nextCollectability, nextFlags, successBonus, nextBonus);
        }
      }
    }
    finalizeCandidateDepths(action);
    return;
  }

  if (action == ACTION_SCRUTINY) {
    addBranch(1.0, 0.0, gp - 200, integrity, collectability, flags | FLAG_SCRUTINY, successBonus, nextBonus);
  } else if (action == ACTION_FOCUS) {
    addBranch(1.0, 0.0, gp - 100, integrity, collectability, flags | FLAG_FOCUS, successBonus, nextBonus);
  } else if (action == ACTION_PRIMING) {
    addBranch(1.0, 0.0, gp - 100, integrity, collectability, flags | FLAG_PRIMING, successBonus, nextBonus);
  } else if (action == ACTION_SUCCESS_I) {
    addBranch(1.0, 0.0, gp - 50, integrity, collectability, flags | FLAG_SUCCESS_I, successBonus + 5, nextBonus);
  } else if (action == ACTION_SUCCESS_II) {
    addBranch(1.0, 0.0, gp - 100, integrity, collectability, flags | FLAG_SUCCESS_II, successBonus + 15, nextBonus);
  } else if (action == ACTION_SUCCESS_III) {
    addBranch(1.0, 0.0, gp - 250, integrity, collectability, flags | FLAG_SUCCESS_III, successBonus + 50, nextBonus);
  } else if (action == ACTION_NEXT_COLLECT_SUCCESS) {
    addBranch(1.0, 0.0, gp - 50, integrity, collectability, flags, successBonus, 15);
  } else if (action == ACTION_RESTORE) {
    const nextGp = gp - 300;
    const nextIntegrity = minI32(maxIntegrity, integrity + 1);
    if (level < 90) {
      addBranch(1.0, 0.0, nextGp, nextIntegrity, collectability, flags, successBonus, nextBonus);
    } else {
      addBranch(0.5, 0.0, nextGp, nextIntegrity, collectability, flags | FLAG_WISE, successBonus, nextBonus);
      addBranch(0.5, 0.0, nextGp, nextIntegrity, collectability, flags, successBonus, nextBonus);
    }
  } else if (action == ACTION_WISE) {
    addBranch(1.0, 0.0, gp, minI32(maxIntegrity, integrity + 1), collectability, flags & ~FLAG_WISE, successBonus, nextBonus);
  }

  finalizeCandidateDepths(action);
}

function applyCollect(gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): f64 {
  const successRate = <f64>minI32(100, maxI32(0, baseSuccessRate + successBonus + nextBonus)) / 100.0;
  const nextFlags = (flags | FLAG_HAS_USED | FLAG_HAS_COLLECTED) & ~0;
  const successGp = minI32(maxGp, gp + (level >= 70 ? 6 : 5));
  let total = 0.0;

  if (successRate > 0.0) {
    branchCount += 1;
    total += successRate * (scoreCollectability(collectability) + solve(successGp, integrity - 1, collectability, nextFlags, successBonus, 0));
  }
  if (successRate < 1.0) {
    branchCount += 1;
    total += (1.0 - successRate) * solve(gp, integrity - 1, collectability, nextFlags, successBonus, 0);
  }

  return total;
}

function refineGain(action: i32, flags: i32, valueIncrease: bool): i32 {
  const scrutinyBonus = (flags & FLAG_SCRUTINY) != 0
    ? <i32>Math.floor(<f64>(scourValue * scrutinyMultiplier) / 100.0)
    : 0;
  const valueBonus = valueIncrease ? <i32>Math.floor(<f64>(scourValue * 50) / 100.0) : 0;
  if (action == 1) return scourValue + scrutinyBonus + valueBonus;
  const baseGain = (flags & FLAG_STANDARD) != 0
    ? scourValue
    : <i32>Math.floor(<f64>(scourValue * 75) / 100.0);
  return baseGain + scrutinyBonus + valueBonus;
}

function applyRefine(action: i32, gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): f64 {
  const valueRate = <f64>(((flags & FLAG_FOCUS) != 0) ? focusedValueIncreaseRate : valueIncreaseRate) / 100.0;
  const saveRate = <f64>(((flags & FLAG_PRIMING) != 0) ? primedMeticulousRate : meticulousRate) / 100.0;
  let total = 0.0;

  for (let valueIndex = 0; valueIndex < 2; valueIndex++) {
    const valueIncrease = valueIndex == 1;
    const valueProbability = valueIncrease ? valueRate : 1.0 - valueRate;
    if (valueProbability <= 0.0) continue;

    const durabilityOptions = action == 2 ? 2 : 1;
    for (let durabilityIndex = 0; durabilityIndex < durabilityOptions; durabilityIndex++) {
      const integrityCost = action == 2 && durabilityIndex == 0 ? 0 : 1;
      const durabilityProbability = action == 2
        ? (durabilityIndex == 0 ? saveRate : 1.0 - saveRate)
        : 1.0;
      if (durabilityProbability <= 0.0) continue;

      const gain = refineGain(action, flags, valueIncrease);
      const nextCollectability = minI32(COLLECTABILITY_CAP, collectability + gain);
      const nextIntegrity = integrity - integrityCost;
      let nextFlags = flags | FLAG_HAS_USED;
      nextFlags &= ~FLAG_SCRUTINY;
      nextFlags &= ~FLAG_FOCUS;
      if (action == 2) {
        nextFlags &= ~FLAG_PRIMING;
        nextFlags &= ~FLAG_STANDARD;
      }
      const baseProbability = valueProbability * durabilityProbability;
      const canProcStandard = nextIntegrity > 0
        && nextCollectability < COLLECTABILITY_CAP
        && (nextFlags & FLAG_STANDARD) == 0
        && standardProcRate > 0.0;

      if (canProcStandard) {
        branchCount += 2;
        total += baseProbability * standardProcRate
          * solve(gp, nextIntegrity, nextCollectability, nextFlags | FLAG_STANDARD, successBonus, nextBonus);
        total += baseProbability * (1.0 - standardProcRate)
          * solve(gp, nextIntegrity, nextCollectability, nextFlags, successBonus, nextBonus);
      } else {
        branchCount += 1;
        total += baseProbability * solve(gp, nextIntegrity, nextCollectability, nextFlags, successBonus, nextBonus);
      }
    }
  }

  return total;
}

function applyBuff(action: i32, gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): f64 {
  if (action == 3) return solve(gp - 200, integrity, collectability, flags | FLAG_SCRUTINY, successBonus, nextBonus);
  if (action == 4) return solve(gp - 100, integrity, collectability, flags | FLAG_FOCUS, successBonus, nextBonus);
  if (action == 5) return solve(gp - 100, integrity, collectability, flags | FLAG_PRIMING, successBonus, nextBonus);
  if (action == 6) return solve(gp - 50, integrity, collectability, flags | FLAG_SUCCESS_I, successBonus + 5, nextBonus);
  if (action == 7) return solve(gp - 100, integrity, collectability, flags | FLAG_SUCCESS_II, successBonus + 15, nextBonus);
  if (action == 8) return solve(gp - 250, integrity, collectability, flags | FLAG_SUCCESS_III, successBonus + 50, nextBonus);
  if (action == 9) return solve(gp - 50, integrity, collectability, flags, successBonus, 15);
  return 0.0;
}

function applyRestore(gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): f64 {
  const nextGp = gp - 300;
  const nextIntegrity = minI32(maxIntegrity, integrity + 1);
  if (level < 90) {
    branchCount += 1;
    return solve(nextGp, nextIntegrity, collectability, flags, successBonus, nextBonus);
  }
  branchCount += 2;
  return 0.5 * solve(nextGp, nextIntegrity, collectability, flags | FLAG_WISE, successBonus, nextBonus)
    + 0.5 * solve(nextGp, nextIntegrity, collectability, flags, successBonus, nextBonus);
}

function applyWise(gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): f64 {
  branchCount += 1;
  return solve(gp, minI32(maxIntegrity, integrity + 1), collectability, flags & ~FLAG_WISE, successBonus, nextBonus);
}

function evaluateAction(action: i32, gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): f64 {
  if (action == 0) return applyCollect(gp, integrity, collectability, flags, successBonus, nextBonus);
  if (action == 1 || action == 2) return applyRefine(action, gp, integrity, collectability, flags, successBonus, nextBonus);
  if (action >= 3 && action <= 9) return applyBuff(action, gp, integrity, collectability, flags, successBonus, nextBonus);
  if (action == 10) return applyRestore(gp, integrity, collectability, flags, successBonus, nextBonus);
  if (action == 11) return applyWise(gp, integrity, collectability, flags, successBonus, nextBonus);
  return 0.0;
}

function solve(gp: i32, integrity: i32, collectability: i32, flags: i32, successBonus: i32, nextBonus: i32): f64 {
  if (integrity <= 0) {
    terminalStates += 1;
    return 0.0;
  }

  const key = packKey(gp, integrity, collectability, flags, successBonus, nextBonus);
  const cached = memoGet(key);
  if (!isNaN(cached)) return cached;

  statesSolved += 1;

  if ((flags & FLAG_WISE) != 0 && integrity < maxIntegrity && canUse(11, gp, integrity, collectability, flags, successBonus, nextBonus)) {
    actionsEvaluated += 1;
    candidateComparisons += 1;
    evaluateCandidate(ACTION_WISE, gp, integrity, collectability, flags, successBonus, nextBonus);
    memoSet(
      key,
      candidateObjectiveScore,
      candidateExpectedScore,
      candidateGpSpent,
      candidateActionCount,
      candidateNodeCount,
      candidateCollectSuccessDepth,
      candidateNextCollectSuccessDepth,
      candidateWiseToTheWorldDepth,
      candidateRestorePreferenceScore,
      candidatePreferredRestoreCount,
      ACTION_WISE
    );
    return candidateObjectiveScore;
  }

  let bestObjectiveScore = 0.0;
  let bestExpectedScore = 0.0;
  let bestGpSpent = 0.0;
  let bestActionCount = 0.0;
  let bestNodeCount = 1.0;
  let bestCollectSuccessDepth = -1;
  let bestNextCollectSuccessDepth = -1;
  let bestWiseToTheWorldDepth = -1;
  let bestRestorePreferenceScore = 0.0;
  let bestPreferredRestoreCount = 0;
  let bestAction = -1;

  if (canUse(ACTION_COLLECT, gp, integrity, collectability, flags, successBonus, nextBonus)) {
    evaluateCandidate(ACTION_COLLECT, gp, integrity, collectability, flags, successBonus, nextBonus);
    bestObjectiveScore = candidateObjectiveScore;
    bestExpectedScore = candidateExpectedScore;
    bestGpSpent = candidateGpSpent;
    bestActionCount = candidateActionCount;
    bestNodeCount = candidateNodeCount;
    bestCollectSuccessDepth = candidateCollectSuccessDepth;
    bestNextCollectSuccessDepth = candidateNextCollectSuccessDepth;
    bestWiseToTheWorldDepth = candidateWiseToTheWorldDepth;
    bestRestorePreferenceScore = candidateRestorePreferenceScore;
    bestPreferredRestoreCount = candidatePreferredRestoreCount;
    bestAction = ACTION_COLLECT;
  }

  for (let action = ACTION_SCRUTINY; action <= ACTION_PRIMING; action++) {
    if (!canUse(action, gp, integrity, collectability, flags, successBonus, nextBonus)) continue;
    actionsEvaluated += 1;
    candidateComparisons += 1;
    evaluateCandidate(action, gp, integrity, collectability, flags, successBonus, nextBonus);
    if (preferredResult(
      candidateObjectiveScore,
      candidateGpSpent,
      candidateCollectSuccessDepth,
      candidateNextCollectSuccessDepth,
      candidateWiseToTheWorldDepth,
      candidateRestorePreferenceScore,
      candidateActionCount,
      candidateNodeCount,
      bestObjectiveScore,
      bestGpSpent,
      bestCollectSuccessDepth,
      bestNextCollectSuccessDepth,
      bestWiseToTheWorldDepth,
      bestRestorePreferenceScore,
      bestActionCount,
      bestNodeCount
    )) {
      bestObjectiveScore = candidateObjectiveScore;
      bestExpectedScore = candidateExpectedScore;
      bestGpSpent = candidateGpSpent;
      bestActionCount = candidateActionCount;
      bestNodeCount = candidateNodeCount;
      bestCollectSuccessDepth = candidateCollectSuccessDepth;
      bestNextCollectSuccessDepth = candidateNextCollectSuccessDepth;
      bestWiseToTheWorldDepth = candidateWiseToTheWorldDepth;
      bestRestorePreferenceScore = candidateRestorePreferenceScore;
      bestPreferredRestoreCount = candidatePreferredRestoreCount;
      bestAction = action;
    }
  }

  if ((flags & FLAG_HAS_COLLECTED) == 0 && baseSuccessRate + successBonus < 100) {
    for (let orderIndex = 0; orderIndex < 4; orderIndex++) {
      const action = orderIndex == 0
        ? ACTION_SUCCESS_III
        : (orderIndex == 1 ? ACTION_SUCCESS_II : (orderIndex == 2 ? ACTION_SUCCESS_I : ACTION_NEXT_COLLECT_SUCCESS));
      if (!canUse(action, gp, integrity, collectability, flags, successBonus, nextBonus)) continue;
      actionsEvaluated += 1;
      candidateComparisons += 1;
      evaluateCandidate(action, gp, integrity, collectability, flags, successBonus, nextBonus);
      if (preferredResult(
        candidateObjectiveScore,
        candidateGpSpent,
        candidateCollectSuccessDepth,
        candidateNextCollectSuccessDepth,
        candidateWiseToTheWorldDepth,
        candidateRestorePreferenceScore,
        candidateActionCount,
        candidateNodeCount,
        bestObjectiveScore,
        bestGpSpent,
        bestCollectSuccessDepth,
        bestNextCollectSuccessDepth,
        bestWiseToTheWorldDepth,
        bestRestorePreferenceScore,
        bestActionCount,
        bestNodeCount
      )) {
        bestObjectiveScore = candidateObjectiveScore;
        bestExpectedScore = candidateExpectedScore;
        bestGpSpent = candidateGpSpent;
        bestActionCount = candidateActionCount;
        bestNodeCount = candidateNodeCount;
        bestCollectSuccessDepth = candidateCollectSuccessDepth;
        bestNextCollectSuccessDepth = candidateNextCollectSuccessDepth;
        bestWiseToTheWorldDepth = candidateWiseToTheWorldDepth;
        bestRestorePreferenceScore = candidateRestorePreferenceScore;
        bestPreferredRestoreCount = candidatePreferredRestoreCount;
        bestAction = action;
      }
    }
  }

  for (let orderIndex = 0; orderIndex < 3; orderIndex++) {
    const action = orderIndex == 0
      ? ACTION_RESTORE
      : (orderIndex == 1 ? ACTION_SCOUR : ACTION_METICULOUS);
    if (!canUse(action, gp, integrity, collectability, flags, successBonus, nextBonus)) continue;
    actionsEvaluated += 1;
    candidateComparisons += 1;
    evaluateCandidate(action, gp, integrity, collectability, flags, successBonus, nextBonus);
    if (preferredResult(
      candidateObjectiveScore,
      candidateGpSpent,
      candidateCollectSuccessDepth,
      candidateNextCollectSuccessDepth,
      candidateWiseToTheWorldDepth,
      candidateRestorePreferenceScore,
      candidateActionCount,
      candidateNodeCount,
      bestObjectiveScore,
      bestGpSpent,
      bestCollectSuccessDepth,
      bestNextCollectSuccessDepth,
      bestWiseToTheWorldDepth,
      bestRestorePreferenceScore,
      bestActionCount,
      bestNodeCount
    )) {
      bestObjectiveScore = candidateObjectiveScore;
      bestExpectedScore = candidateExpectedScore;
      bestGpSpent = candidateGpSpent;
      bestActionCount = candidateActionCount;
      bestNodeCount = candidateNodeCount;
      bestCollectSuccessDepth = candidateCollectSuccessDepth;
      bestNextCollectSuccessDepth = candidateNextCollectSuccessDepth;
      bestWiseToTheWorldDepth = candidateWiseToTheWorldDepth;
      bestRestorePreferenceScore = candidateRestorePreferenceScore;
      bestPreferredRestoreCount = candidatePreferredRestoreCount;
      bestAction = action;
    }
  }

  memoSet(
    key,
    bestObjectiveScore,
    bestExpectedScore,
    bestGpSpent,
    bestActionCount,
    bestNodeCount,
    bestCollectSuccessDepth,
    bestNextCollectSuccessDepth,
    bestWiseToTheWorldDepth,
    bestRestorePreferenceScore,
    bestPreferredRestoreCount,
    bestAction
  );
  return bestObjectiveScore;
}

export function solveExpected(
  playerLevel: i32,
  gathering: i32,
  perception: i32,
  playerGp: i32,
  baseGathering: i32,
  basePerception: i32,
  itemLevel: i32,
  integrity: i32,
  temporaryGp: i32,
  isTimedNode: i32,
  lowThreshold: i32,
  lowRewardScore: f64,
  midThreshold: i32,
  midRewardScore: f64,
  highThreshold: i32,
  highRewardScore: f64,
  hasRelicToolBonus: i32,
  memoCapacityPower: i32
): f64 {
  level = playerLevel;
  maxGp = playerGp;
  maxIntegrity = integrity;
  timedNode = isTimedNode != 0;
  objectiveMode = OBJECTIVE_EXPECTED;
  baseSuccessRate = calculateSuccessRate(gathering, baseGathering, playerLevel, itemLevel);
  scourValue = calculateScourValue(gathering, baseGathering);
  valueIncreaseRate = calculateValueRate(gathering, baseGathering);
  if (hasRelicToolBonus != 0) valueIncreaseRate = minI32(100, valueIncreaseRate + 20);
  focusedValueIncreaseRate = calculateFocusedRate(valueIncreaseRate);
  meticulousRate = calculateMeticulousRate(gathering, baseGathering);
  primedMeticulousRate = minI32(100, meticulousRate * 2);
  scrutinyMultiplier = calculateScrutinyMultiplier(perception, basePerception);
  standardProcRate = itemLevel == 55 ? 0.0 : (timedNode ? 0.13 : 0.25);
  lowCollectability = lowThreshold;
  lowScore = lowRewardScore;
  midCollectability = midThreshold;
  midScore = midRewardScore;
  highCollectability = highThreshold;
  highScore = highRewardScore;

  const memoCapacity = 1 << memoCapacityPower;
  resetMemo(memoCapacity);

  const initialGp = minI32(playerGp, temporaryGp);
  const primary = solve(initialGp, maxIntegrity, 0, 0, 0, 0);

  if (playerLevel < 91) return primary;
  const revisitChance = timedNode ? TIMED_REVISIT_CHANCE : REGULAR_REVISIT_CHANCE;
  if (initialGp >= playerGp) return primary + revisitChance * primary;

  resetMemo(memoCapacity);
  const fullGp = solve(playerGp, maxIntegrity, 0, 0, 0, 0);
  return primary + revisitChance * fullGp;
}

export function solvePlanExpected(
  playerLevel: i32,
  gathering: i32,
  perception: i32,
  playerGp: i32,
  baseGathering: i32,
  basePerception: i32,
  itemLevel: i32,
  integrity: i32,
  temporaryGp: i32,
  isTimedNode: i32,
  lowThreshold: i32,
  lowRewardScore: f64,
  midThreshold: i32,
  midRewardScore: f64,
  highThreshold: i32,
  highRewardScore: f64,
  hasRelicToolBonus: i32,
  memoCapacityPower: i32
): f64 {
  level = playerLevel;
  maxGp = playerGp;
  maxIntegrity = integrity;
  timedNode = isTimedNode != 0;
  objectiveMode = OBJECTIVE_EXPECTED;
  baseSuccessRate = calculateSuccessRate(gathering, baseGathering, playerLevel, itemLevel);
  scourValue = calculateScourValue(gathering, baseGathering);
  valueIncreaseRate = calculateValueRate(gathering, baseGathering);
  if (hasRelicToolBonus != 0) valueIncreaseRate = minI32(100, valueIncreaseRate + 20);
  focusedValueIncreaseRate = calculateFocusedRate(valueIncreaseRate);
  meticulousRate = calculateMeticulousRate(gathering, baseGathering);
  primedMeticulousRate = minI32(100, meticulousRate * 2);
  scrutinyMultiplier = calculateScrutinyMultiplier(perception, basePerception);
  standardProcRate = itemLevel == 55 ? 0.0 : (timedNode ? 0.13 : 0.25);
  lowCollectability = lowThreshold;
  lowScore = lowRewardScore;
  midCollectability = midThreshold;
  midScore = midRewardScore;
  highCollectability = highThreshold;
  highScore = highRewardScore;

  resetMemo(1 << memoCapacityPower);
  return solve(minI32(playerGp, temporaryGp), maxIntegrity, 0, 0, 0, 0);
}

export function solvePlanObjective(
  playerLevel: i32,
  gathering: i32,
  perception: i32,
  playerGp: i32,
  baseGathering: i32,
  basePerception: i32,
  itemLevel: i32,
  integrity: i32,
  temporaryGp: i32,
  isTimedNode: i32,
  lowThreshold: i32,
  lowRewardScore: f64,
  midThreshold: i32,
  midRewardScore: f64,
  highThreshold: i32,
  highRewardScore: f64,
  hasRelicToolBonus: i32,
  memoCapacityPower: i32,
  mode: i32
): f64 {
  level = playerLevel;
  maxGp = playerGp;
  maxIntegrity = integrity;
  timedNode = isTimedNode != 0;
  objectiveMode = mode;
  baseSuccessRate = calculateSuccessRate(gathering, baseGathering, playerLevel, itemLevel);
  scourValue = calculateScourValue(gathering, baseGathering);
  valueIncreaseRate = calculateValueRate(gathering, baseGathering);
  if (hasRelicToolBonus != 0) valueIncreaseRate = minI32(100, valueIncreaseRate + 20);
  focusedValueIncreaseRate = calculateFocusedRate(valueIncreaseRate);
  meticulousRate = calculateMeticulousRate(gathering, baseGathering);
  primedMeticulousRate = minI32(100, meticulousRate * 2);
  scrutinyMultiplier = calculateScrutinyMultiplier(perception, basePerception);
  standardProcRate = itemLevel == 55 ? 0.0 : (timedNode ? 0.13 : 0.25);
  lowCollectability = lowThreshold;
  lowScore = lowRewardScore;
  midCollectability = midThreshold;
  midScore = midRewardScore;
  highCollectability = highThreshold;
  highScore = highRewardScore;

  resetMemo(1 << memoCapacityPower);
  return solve(minI32(playerGp, temporaryGp), maxIntegrity, 0, 0, 0, 0);
}

export function getStatesSolved(): i64 {
  return statesSolved;
}

export function getMemoHits(): i64 {
  return memoHits;
}

export function getActionsEvaluated(): i64 {
  return actionsEvaluated;
}

export function getCandidateComparisons(): i64 {
  return candidateComparisons;
}

export function getTerminalStates(): i64 {
  return terminalStates;
}

export function getBranchCount(): i64 {
  return branchCount;
}

export function getFailed(): i32 {
  return failed ? 1 : 0;
}

export function getBaseSuccessRate(): i32 {
  return baseSuccessRate;
}

export function getScourValue(): i32 {
  return scourValue;
}

export function getScoreForState(
  gp: i32,
  integrity: i32,
  collectability: i32,
  flags: i32,
  successBonus: i32,
  nextBonus: i32
): f64 {
  if (integrity <= 0) return 0.0;
  const index = memoFindIndex(packKey(gp, integrity, collectability, flags, successBonus, nextBonus));
  return index >= 0 ? unchecked(objectiveScores[index]) : NaN;
}

export function getExpectedScoreForState(
  gp: i32,
  integrity: i32,
  collectability: i32,
  flags: i32,
  successBonus: i32,
  nextBonus: i32
): f64 {
  if (integrity <= 0) return 0.0;
  const index = memoFindIndex(packKey(gp, integrity, collectability, flags, successBonus, nextBonus));
  return index >= 0 ? unchecked(expectedScores[index]) : NaN;
}

export function getBestActionForState(
  gp: i32,
  integrity: i32,
  collectability: i32,
  flags: i32,
  successBonus: i32,
  nextBonus: i32
): i32 {
  if (integrity <= 0) return -1;
  const index = memoFindIndex(packKey(gp, integrity, collectability, flags, successBonus, nextBonus));
  return index >= 0 ? unchecked(bestActions[index]) : -1;
}
