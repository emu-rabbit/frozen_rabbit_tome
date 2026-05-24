const FLAG_HAS_GATHERED: i32 = 1 << 0;
const FLAG_SUCCESS_I: i32 = 1 << 1;
const FLAG_SUCCESS_II: i32 = 1 << 2;
const FLAG_SUCCESS_III: i32 = 1 << 3;
const FLAG_GIFT_I: i32 = 1 << 4;
const FLAG_GIFT_II: i32 = 1 << 5;
const FLAG_TIDINGS: i32 = 1 << 6;
const FLAG_WISE: i32 = 1 << 7;

const SUCCESS_CAP: i32 = 100;
const BOON_CAP: i32 = 100;
const EV_EPSILON: f64 = 0.0000001;
const EMPTY_KEY: i64 = 0;
const MEMO_LOAD_LIMIT_PERCENT: i32 = 85;
const OBJECTIVE_EXPECTED: i32 = 0;
const OBJECTIVE_MIN: i32 = 1;
const OBJECTIVE_MAX: i32 = 2;
const FAILURE_NONE: i32 = 0;
const FAILURE_MEMO_CAPACITY: i32 = 1;

const ACTION_GATHER: i32 = 0;
const ACTION_SUCCESS_I: i32 = 1;
const ACTION_SUCCESS_II: i32 = 2;
const ACTION_SUCCESS_III: i32 = 3;
const ACTION_GIFT_I: i32 = 4;
const ACTION_GIFT_II: i32 = 5;
const ACTION_CLEAR_VISION: i32 = 6;
const ACTION_BOUNTIFUL_I: i32 = 7;
const ACTION_BOUNTIFUL_II: i32 = 8;
const ACTION_RESTORE: i32 = 9;
const ACTION_WISE: i32 = 10;
const ACTION_KING_I: i32 = 11;
const ACTION_KING_II: i32 = 12;
const ACTION_TIDINGS: i32 = 13;

let level: i32 = 100;
let maxGp: i32 = 930;
let maxIntegrity: i32 = 4;
let objectiveMode: i32 = OBJECTIVE_EXPECTED;
let baseSuccessRate: i32 = 100;
let baseBoonChance: i32 = 35;
let bountifulYield: i32 = 3;
let nodeYieldBonus: i32 = 0;
let nodeBoonBonus: i32 = 0;

let keys = new StaticArray<i64>(1);
let objectiveScores = new StaticArray<f64>(1);
let expectedYields = new StaticArray<f64>(1);
let minYields = new StaticArray<i32>(1);
let maxYields = new StaticArray<i32>(1);
let habitScores = new StaticArray<i32>(1);
let actionCounts = new StaticArray<i32>(1);
let firstGatherIndexes = new StaticArray<i32>(1);
let firstNextOnlyIndexes = new StaticArray<i32>(1);
let wholeNodeActionCounts = new StaticArray<i32>(1);
let wholeNodeBeforeNextOnlyScores = new StaticArray<i32>(1);
let nextOnlyScores = new StaticArray<i32>(1);
let giftCounts = new StaticArray<i32>(1);
let lastGiftIndexes = new StaticArray<i32>(1);
let tidingsIndexes = new StaticArray<i32>(1);
let rotationPreferenceScores = new StaticArray<i32>(1);
let bestActions = new StaticArray<i32>(1);
let used = new StaticArray<u8>(1);
let capacity: i32 = 1;
let mask: i32 = 0;
let failed: bool = false;
let failureReason: i32 = FAILURE_NONE;
let memoSize: i32 = 0;

let statesSolved: i64 = 0;
let memoHits: i64 = 0;
let actionsEvaluated: i64 = 0;
let candidateComparisons: i64 = 0;
let terminalStates: i64 = 0;
let branchCount: i64 = 0;

let resultObjectiveScore: f64 = 0.0;
let resultExpectedYield: f64 = 0.0;
let resultMinYield: i32 = 0;
let resultMaxYield: i32 = 0;
let resultHabitScore: i32 = 0;
let resultActionCount: i32 = 0;
let resultFirstGatherIndex: i32 = 0;
let resultFirstNextOnlyIndex: i32 = -1;
let resultWholeNodeActionCount: i32 = 0;
let resultWholeNodeBeforeNextOnlyScore: i32 = 0;
let resultNextOnlyScore: i32 = 0;
let resultGiftCount: i32 = 0;
let resultLastGiftIndex: i32 = -1;
let resultTidingsIndex: i32 = -1;
let resultRotationPreferenceScore: i32 = 0;
let resultBestAction: i32 = -1;

let candidateObjectiveScore: f64 = 0.0;
let candidateExpectedYield: f64 = 0.0;
let candidateMinYield: i32 = 0;
let candidateMaxYield: i32 = 0;
let candidateHabitScore: i32 = 0;
let candidateActionCount: i32 = 0;
let candidateFirstGatherIndex: i32 = 0;
let candidateFirstNextOnlyIndex: i32 = -1;
let candidateWholeNodeActionCount: i32 = 0;
let candidateWholeNodeBeforeNextOnlyScore: i32 = 0;
let candidateNextOnlyScore: i32 = 0;
let candidateGiftCount: i32 = 0;
let candidateLastGiftIndex: i32 = -1;
let candidateTidingsIndex: i32 = -1;
let candidateRotationPreferenceScore: i32 = 0;

function minI32(left: i32, right: i32): i32 {
  return left < right ? left : right;
}

function maxI32(left: i32, right: i32): i32 {
  return left > right ? left : right;
}

function resetMemo(nextCapacity: i32): void {
  failed = false;
  failureReason = FAILURE_NONE;

  if (capacity != nextCapacity) {
    capacity = nextCapacity;
    mask = capacity - 1;
    keys = new StaticArray<i64>(capacity);
    objectiveScores = new StaticArray<f64>(capacity);
    expectedYields = new StaticArray<f64>(capacity);
    minYields = new StaticArray<i32>(capacity);
    maxYields = new StaticArray<i32>(capacity);
    habitScores = new StaticArray<i32>(capacity);
    actionCounts = new StaticArray<i32>(capacity);
    firstGatherIndexes = new StaticArray<i32>(capacity);
    firstNextOnlyIndexes = new StaticArray<i32>(capacity);
    wholeNodeActionCounts = new StaticArray<i32>(capacity);
    wholeNodeBeforeNextOnlyScores = new StaticArray<i32>(capacity);
    nextOnlyScores = new StaticArray<i32>(capacity);
    giftCounts = new StaticArray<i32>(capacity);
    lastGiftIndexes = new StaticArray<i32>(capacity);
    tidingsIndexes = new StaticArray<i32>(capacity);
    rotationPreferenceScores = new StaticArray<i32>(capacity);
    bestActions = new StaticArray<i32>(capacity);
    used = new StaticArray<u8>(capacity);
  } else {
    for (let index = 0; index < capacity; index++) {
      unchecked(used[index] = 0);
    }
  }

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
  else if (score <= 40) rate = <i32>Math.floor(20.0 + <f64>(score - 20) * 1.6);
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

function calculateBoonChance(perception: i32, basePerception: i32): i32 {
  const score = minI32(150, calculateScore(perception, basePerception));
  if (score >= 100) return <i32>Math.floor((<f64>(score - 100) / 50.0) * 25.0 + 35.0);
  if (score >= 80) return <i32>Math.floor((<f64>(score - 80) / 20.0) * 20.0 + 15.0);
  if (score >= 70) return <i32>Math.floor((<f64>(score - 70) / 10.0) * 5.0 + 10.0);
  if (score >= 60) return <i32>Math.floor((<f64>(score - 60) / 10.0) * 10.0);
  return 0;
}

function calculateBountifulYield(gathering: i32, baseGathering: i32): i32 {
  if (baseGathering <= 0) return 1;
  if (gathering >= <i32>Math.floor(<f64>baseGathering * 1.1)) return 3;
  if (gathering >= <i32>Math.floor(<f64>baseGathering * 0.9)) return 2;
  return 1;
}

function packKey(
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): i64 {
  let key = <i64>(gp & 4095);
  key |= <i64>(integrity & 15) << 12;
  key |= <i64>(flags & 255) << 16;
  key |= <i64>(successBonus & 127) << 24;
  key |= <i64>(boonBonus & 127) << 31;
  key |= <i64>(allYieldBonus & 3) << 38;
  key |= <i64>(nextSuccessBonus & 31) << 40;
  key |= <i64>(nextYieldBonus & 7) << 45;
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

function memoFindIndex(key: i64): i32 {
  let index = hashKey(key);
  const startIndex = index;
  while (unchecked(used[index]) != 0) {
    if (unchecked(keys[index]) == key) return index;
    index = (index + 1) & mask;
    if (index == startIndex) return -1;
  }
  return -1;
}

function memoLoad(key: i64): bool {
  const index = memoFindIndex(key);
  if (index < 0) return false;

  memoHits += 1;
  resultObjectiveScore = unchecked(objectiveScores[index]);
  resultExpectedYield = unchecked(expectedYields[index]);
  resultMinYield = unchecked(minYields[index]);
  resultMaxYield = unchecked(maxYields[index]);
  resultHabitScore = unchecked(habitScores[index]);
  resultActionCount = unchecked(actionCounts[index]);
  resultFirstGatherIndex = unchecked(firstGatherIndexes[index]);
  resultFirstNextOnlyIndex = unchecked(firstNextOnlyIndexes[index]);
  resultWholeNodeActionCount = unchecked(wholeNodeActionCounts[index]);
  resultWholeNodeBeforeNextOnlyScore = unchecked(wholeNodeBeforeNextOnlyScores[index]);
  resultNextOnlyScore = unchecked(nextOnlyScores[index]);
  resultGiftCount = unchecked(giftCounts[index]);
  resultLastGiftIndex = unchecked(lastGiftIndexes[index]);
  resultTidingsIndex = unchecked(tidingsIndexes[index]);
  resultRotationPreferenceScore = unchecked(rotationPreferenceScores[index]);
  resultBestAction = unchecked(bestActions[index]);
  return true;
}

function memoSet(
  key: i64,
  objectiveScore: f64,
  expectedYield: f64,
  minYield: i32,
  maxYield: i32,
  habitScore: i32,
  actionCount: i32,
  firstGatherIndex: i32,
  firstNextOnlyIndex: i32,
  wholeNodeActionCount: i32,
  wholeNodeBeforeNextOnlyScore: i32,
  nextOnlyScore: i32,
  giftCount: i32,
  lastGiftIndex: i32,
  tidingsIndex: i32,
  rotationPreferenceScore: i32,
  bestAction: i32
): void {
  if (<i64>(memoSize + 1) * 100 >= <i64>capacity * MEMO_LOAD_LIMIT_PERCENT) {
    failed = true;
    failureReason = FAILURE_MEMO_CAPACITY;
    abort('Regular gathering WASM memo table capacity exceeded.', 'regularGatheringSolverCore.ts', 0, 0);
  }

  let index = hashKey(key);
  const startIndex = index;
  while (unchecked(used[index]) != 0) {
    if (unchecked(keys[index]) == key) {
      unchecked(objectiveScores[index] = objectiveScore);
      unchecked(expectedYields[index] = expectedYield);
      unchecked(minYields[index] = minYield);
      unchecked(maxYields[index] = maxYield);
      unchecked(habitScores[index] = habitScore);
      unchecked(actionCounts[index] = actionCount);
      unchecked(firstGatherIndexes[index] = firstGatherIndex);
      unchecked(firstNextOnlyIndexes[index] = firstNextOnlyIndex);
      unchecked(wholeNodeActionCounts[index] = wholeNodeActionCount);
      unchecked(wholeNodeBeforeNextOnlyScores[index] = wholeNodeBeforeNextOnlyScore);
      unchecked(nextOnlyScores[index] = nextOnlyScore);
      unchecked(giftCounts[index] = giftCount);
      unchecked(lastGiftIndexes[index] = lastGiftIndex);
      unchecked(tidingsIndexes[index] = tidingsIndex);
      unchecked(rotationPreferenceScores[index] = rotationPreferenceScore);
      unchecked(bestActions[index] = bestAction);
      return;
    }
    index = (index + 1) & mask;
    if (index == startIndex) {
      failed = true;
      failureReason = FAILURE_MEMO_CAPACITY;
      abort('Regular gathering WASM memo table is full.', 'regularGatheringSolverCore.ts', 0, 0);
    }
  }

  unchecked(used[index] = 1);
  memoSize += 1;
  unchecked(keys[index] = key);
  unchecked(objectiveScores[index] = objectiveScore);
  unchecked(expectedYields[index] = expectedYield);
  unchecked(minYields[index] = minYield);
  unchecked(maxYields[index] = maxYield);
  unchecked(habitScores[index] = habitScore);
  unchecked(actionCounts[index] = actionCount);
  unchecked(firstGatherIndexes[index] = firstGatherIndex);
  unchecked(firstNextOnlyIndexes[index] = firstNextOnlyIndex);
  unchecked(wholeNodeActionCounts[index] = wholeNodeActionCount);
  unchecked(wholeNodeBeforeNextOnlyScores[index] = wholeNodeBeforeNextOnlyScore);
  unchecked(nextOnlyScores[index] = nextOnlyScore);
  unchecked(giftCounts[index] = giftCount);
  unchecked(lastGiftIndexes[index] = lastGiftIndex);
  unchecked(tidingsIndexes[index] = tidingsIndex);
  unchecked(rotationPreferenceScores[index] = rotationPreferenceScore);
  unchecked(bestActions[index] = bestAction);
}

function gpPerGather(): i32 {
  return level >= 70 ? 6 : 5;
}

function canRaiseSuccess(successBonus: i32): bool {
  return baseSuccessRate > 1 && baseSuccessRate + successBonus < SUCCESS_CAP;
}

function canRaiseBoon(boonBonus: i32): bool {
  return baseBoonChance + nodeBoonBonus > 1
    && baseBoonChance + nodeBoonBonus + boonBonus < BOON_CAP;
}

function minLevelForAction(action: i32): i32 {
  if (action == ACTION_GATHER) return 1;
  if (action == ACTION_SUCCESS_I) return 4;
  if (action == ACTION_SUCCESS_II) return 5;
  if (action == ACTION_SUCCESS_III) return 10;
  if (action == ACTION_GIFT_I) return 15;
  if (action == ACTION_GIFT_II) return 50;
  if (action == ACTION_CLEAR_VISION) return 23;
  if (action == ACTION_BOUNTIFUL_I) return 24;
  if (action == ACTION_BOUNTIFUL_II) return 68;
  if (action == ACTION_RESTORE) return 25;
  if (action == ACTION_WISE) return 90;
  if (action == ACTION_KING_I) return 30;
  if (action == ACTION_KING_II) return 40;
  if (action == ACTION_TIDINGS) return 81;
  return 999;
}

function canUse(
  action: i32,
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): bool {
  if (level < minLevelForAction(action)) return false;
  if (integrity <= 0) return false;

  if (action == ACTION_GATHER) return true;
  if (action == ACTION_WISE) return integrity < maxIntegrity && (flags & FLAG_WISE) != 0;
  if (action == ACTION_RESTORE) return integrity < maxIntegrity && gp >= 300;

  const hasGathered = (flags & FLAG_HAS_GATHERED) != 0;
  const isWholeNodeAction = action == ACTION_SUCCESS_I || action == ACTION_SUCCESS_II || action == ACTION_SUCCESS_III
    || action == ACTION_GIFT_I || action == ACTION_GIFT_II || action == ACTION_KING_I || action == ACTION_KING_II
    || action == ACTION_TIDINGS;
  if (isWholeNodeAction && hasGathered) return false;

  if (action == ACTION_SUCCESS_I) return gp >= 50 && (flags & FLAG_SUCCESS_I) == 0 && canRaiseSuccess(successBonus);
  if (action == ACTION_SUCCESS_II) return gp >= 100 && (flags & FLAG_SUCCESS_II) == 0 && canRaiseSuccess(successBonus);
  if (action == ACTION_SUCCESS_III) return gp >= 250 && (flags & FLAG_SUCCESS_III) == 0 && canRaiseSuccess(successBonus);
  if (action == ACTION_GIFT_I) return gp >= 50 && (flags & FLAG_GIFT_I) == 0 && canRaiseBoon(boonBonus);
  if (action == ACTION_GIFT_II) return gp >= 100 && (flags & FLAG_GIFT_II) == 0 && canRaiseBoon(boonBonus);
  if (action == ACTION_CLEAR_VISION) return gp >= 50 && nextSuccessBonus == 0 && canRaiseSuccess(successBonus);
  if (action == ACTION_BOUNTIFUL_I || action == ACTION_BOUNTIFUL_II) {
    return gp >= 100 && nextYieldBonus == 0 && baseSuccessRate + successBonus > 0;
  }
  if (action == ACTION_KING_I) return gp >= 400 && allYieldBonus == 0;
  if (action == ACTION_KING_II) return gp >= 500 && allYieldBonus == 0;
  if (action == ACTION_TIDINGS) {
    return gp >= 200 && (flags & FLAG_TIDINGS) == 0 && baseBoonChance + nodeBoonBonus + boonBonus > 0;
  }

  return false;
}

function scoreFromOutcome(expectedYield: f64, minYield: i32, maxYield: i32): f64 {
  if (objectiveMode == OBJECTIVE_MAX) return <f64>maxYield;
  if (objectiveMode == OBJECTIVE_MIN) return <f64>minYield;
  return expectedYield;
}

function loadTerminal(): void {
  terminalStates += 1;
  resultObjectiveScore = 0.0;
  resultExpectedYield = 0.0;
  resultMinYield = 0;
  resultMaxYield = 0;
  resultHabitScore = 0;
  resultActionCount = 0;
  resultFirstGatherIndex = 0;
  resultFirstNextOnlyIndex = -1;
  resultWholeNodeActionCount = 0;
  resultWholeNodeBeforeNextOnlyScore = 0;
  resultNextOnlyScore = 0;
  resultGiftCount = 0;
  resultLastGiftIndex = -1;
  resultTidingsIndex = -1;
  resultRotationPreferenceScore = 0;
  resultBestAction = -1;
}

function isWholeNodeAction(action: i32): bool {
  return action == ACTION_SUCCESS_I || action == ACTION_SUCCESS_II || action == ACTION_SUCCESS_III
    || action == ACTION_GIFT_I || action == ACTION_GIFT_II || action == ACTION_KING_I || action == ACTION_KING_II
    || action == ACTION_TIDINGS;
}

function isGiftAction(action: i32): bool {
  return action == ACTION_GIFT_I || action == ACTION_GIFT_II;
}

function comboScore(giftCount: i32, lastGiftIndex: i32, tidingsIndex: i32): i32 {
  if (giftCount <= 0 || tidingsIndex < 0) return 0;
  if (tidingsIndex == lastGiftIndex + 1) return 500;
  if (lastGiftIndex < tidingsIndex) return 100;
  return -100;
}

function loadCandidateMetadataFromChild(
  action: i32,
  childActionCount: i32,
  childFirstGatherIndex: i32,
  childFirstNextOnlyIndex: i32,
  childWholeNodeActionCount: i32,
  childWholeNodeBeforeNextOnlyScore: i32,
  childNextOnlyScore: i32,
  childGiftCount: i32,
  childLastGiftIndex: i32,
  childTidingsIndex: i32
): void {
  candidateActionCount = childActionCount + 1;
  candidateFirstGatherIndex = action == ACTION_GATHER ? 0 : childFirstGatherIndex + 1;
  candidateFirstNextOnlyIndex = isNextOnlyAction(action)
    ? 0
    : (childFirstNextOnlyIndex >= 0 ? childFirstNextOnlyIndex + 1 : -1);
  candidateWholeNodeActionCount = childWholeNodeActionCount + (isWholeNodeAction(action) ? 1 : 0);

  if (isWholeNodeAction(action)) {
    candidateWholeNodeBeforeNextOnlyScore = childWholeNodeBeforeNextOnlyScore + (childFirstNextOnlyIndex >= 0 ? 1000 : 0);
  } else if (isNextOnlyAction(action)) {
    candidateWholeNodeBeforeNextOnlyScore = -1000 * childWholeNodeActionCount;
  } else {
    candidateWholeNodeBeforeNextOnlyScore = childWholeNodeBeforeNextOnlyScore;
  }

  candidateNextOnlyScore = childNextOnlyScore + (isNextOnlyAction(action) ? candidateActionCount * 10 + 100 : 0);

  if (isGiftAction(action)) {
    candidateGiftCount = childGiftCount + 1;
    candidateLastGiftIndex = childGiftCount > 0 ? childLastGiftIndex + 1 : 0;
  } else {
    candidateGiftCount = childGiftCount;
    candidateLastGiftIndex = childLastGiftIndex >= 0 ? childLastGiftIndex + 1 : -1;
  }

  candidateTidingsIndex = action == ACTION_TIDINGS
    ? 0
    : (childTidingsIndex >= 0 ? childTidingsIndex + 1 : -1);
  candidateRotationPreferenceScore = candidateFirstGatherIndex
    + candidateWholeNodeBeforeNextOnlyScore
    + candidateNextOnlyScore
    + comboScore(candidateGiftCount, candidateLastGiftIndex, candidateTidingsIndex);
}

function loadCandidateMetadataFromResult(action: i32): void {
  loadCandidateMetadataFromChild(
    action,
    resultActionCount,
    resultFirstGatherIndex,
    resultFirstNextOnlyIndex,
    resultWholeNodeActionCount,
    resultWholeNodeBeforeNextOnlyScore,
    resultNextOnlyScore,
    resultGiftCount,
    resultLastGiftIndex,
    resultTidingsIndex
  );
}

function solve(
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): void {
  if (integrity <= 0) {
    loadTerminal();
    return;
  }

  const key = packKey(gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);
  if (memoLoad(key)) return;

  statesSolved += 1;

  if ((flags & FLAG_WISE) != 0 && integrity < maxIntegrity && canUse(ACTION_WISE, gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus)) {
    actionsEvaluated += 1;
    candidateComparisons += 1;
    evaluateCandidate(ACTION_WISE, gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);
    memoSet(
      key,
      candidateObjectiveScore,
      candidateExpectedYield,
      candidateMinYield,
      candidateMaxYield,
      candidateHabitScore,
      candidateActionCount,
      candidateFirstGatherIndex,
      candidateFirstNextOnlyIndex,
      candidateWholeNodeActionCount,
      candidateWholeNodeBeforeNextOnlyScore,
      candidateNextOnlyScore,
      candidateGiftCount,
      candidateLastGiftIndex,
      candidateTidingsIndex,
      candidateRotationPreferenceScore,
      ACTION_WISE
    );
    loadMemoResult(
      candidateObjectiveScore,
      candidateExpectedYield,
      candidateMinYield,
      candidateMaxYield,
      candidateHabitScore,
      candidateActionCount,
      candidateFirstGatherIndex,
      candidateFirstNextOnlyIndex,
      candidateWholeNodeActionCount,
      candidateWholeNodeBeforeNextOnlyScore,
      candidateNextOnlyScore,
      candidateGiftCount,
      candidateLastGiftIndex,
      candidateTidingsIndex,
      candidateRotationPreferenceScore,
      ACTION_WISE
    );
    return;
  }

  evaluateCandidate(ACTION_GATHER, gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);
  let bestObjectiveScore = candidateObjectiveScore;
  let bestExpectedYield = candidateExpectedYield;
  let bestMinYield = candidateMinYield;
  let bestMaxYield = candidateMaxYield;
  let bestHabitScore = candidateHabitScore;
  let bestActionCount = candidateActionCount;
  let bestFirstGatherIndex = candidateFirstGatherIndex;
  let bestFirstNextOnlyIndex = candidateFirstNextOnlyIndex;
  let bestWholeNodeActionCount = candidateWholeNodeActionCount;
  let bestWholeNodeBeforeNextOnlyScore = candidateWholeNodeBeforeNextOnlyScore;
  let bestNextOnlyScore = candidateNextOnlyScore;
  let bestGiftCount = candidateGiftCount;
  let bestLastGiftIndex = candidateLastGiftIndex;
  let bestTidingsIndex = candidateTidingsIndex;
  let bestRotationPreferenceScore = candidateRotationPreferenceScore;
  let bestAction = ACTION_GATHER;

  for (let orderIndex = 0; orderIndex < 12; orderIndex++) {
    let action = ACTION_GATHER;
    if (orderIndex == 0) action = ACTION_SUCCESS_III;
    else if (orderIndex == 1) action = ACTION_SUCCESS_II;
    else if (orderIndex == 2) action = ACTION_SUCCESS_I;
    else if (orderIndex == 3) action = ACTION_GIFT_II;
    else if (orderIndex == 4) action = ACTION_GIFT_I;
    else if (orderIndex == 5) action = ACTION_TIDINGS;
    else if (orderIndex == 6) action = ACTION_KING_II;
    else if (orderIndex == 7) action = ACTION_KING_I;
    else if (orderIndex == 8) action = ACTION_CLEAR_VISION;
    else if (orderIndex == 9) {
      action = canUse(ACTION_BOUNTIFUL_II, gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus)
        ? ACTION_BOUNTIFUL_II
        : ACTION_BOUNTIFUL_I;
    } else if (orderIndex == 10) action = ACTION_RESTORE;
    else action = ACTION_GATHER;

    if (action == ACTION_GATHER) continue;
    if (!canUse(action, gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus)) continue;

    actionsEvaluated += 1;
    candidateComparisons += 1;
    evaluateCandidate(action, gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);

    if (preferredResult(
      candidateObjectiveScore,
      candidateHabitScore,
      candidateActionCount,
      candidateRotationPreferenceScore,
      action,
      bestObjectiveScore,
      bestHabitScore,
      bestActionCount,
      bestRotationPreferenceScore,
      bestAction
    )) {
      bestObjectiveScore = candidateObjectiveScore;
      bestExpectedYield = candidateExpectedYield;
      bestMinYield = candidateMinYield;
      bestMaxYield = candidateMaxYield;
      bestHabitScore = candidateHabitScore;
      bestActionCount = candidateActionCount;
      bestFirstGatherIndex = candidateFirstGatherIndex;
      bestFirstNextOnlyIndex = candidateFirstNextOnlyIndex;
      bestWholeNodeActionCount = candidateWholeNodeActionCount;
      bestWholeNodeBeforeNextOnlyScore = candidateWholeNodeBeforeNextOnlyScore;
      bestNextOnlyScore = candidateNextOnlyScore;
      bestGiftCount = candidateGiftCount;
      bestLastGiftIndex = candidateLastGiftIndex;
      bestTidingsIndex = candidateTidingsIndex;
      bestRotationPreferenceScore = candidateRotationPreferenceScore;
      bestAction = action;
    }
  }

  memoSet(
    key,
    bestObjectiveScore,
    bestExpectedYield,
    bestMinYield,
    bestMaxYield,
    bestHabitScore,
    bestActionCount,
    bestFirstGatherIndex,
    bestFirstNextOnlyIndex,
    bestWholeNodeActionCount,
    bestWholeNodeBeforeNextOnlyScore,
    bestNextOnlyScore,
    bestGiftCount,
    bestLastGiftIndex,
    bestTidingsIndex,
    bestRotationPreferenceScore,
    bestAction
  );
  loadMemoResult(
    bestObjectiveScore,
    bestExpectedYield,
    bestMinYield,
    bestMaxYield,
    bestHabitScore,
    bestActionCount,
    bestFirstGatherIndex,
    bestFirstNextOnlyIndex,
    bestWholeNodeActionCount,
    bestWholeNodeBeforeNextOnlyScore,
    bestNextOnlyScore,
    bestGiftCount,
    bestLastGiftIndex,
    bestTidingsIndex,
    bestRotationPreferenceScore,
    bestAction
  );
}

function loadMemoResult(
  objectiveScore: f64,
  expectedYield: f64,
  minYield: i32,
  maxYield: i32,
  habitScore: i32,
  actionCount: i32,
  firstGatherIndex: i32,
  firstNextOnlyIndex: i32,
  wholeNodeActionCount: i32,
  wholeNodeBeforeNextOnlyScore: i32,
  nextOnlyScore: i32,
  giftCount: i32,
  lastGiftIndex: i32,
  tidingsIndex: i32,
  rotationPreferenceScore: i32,
  bestAction: i32
): void {
  resultObjectiveScore = objectiveScore;
  resultExpectedYield = expectedYield;
  resultMinYield = minYield;
  resultMaxYield = maxYield;
  resultHabitScore = habitScore;
  resultActionCount = actionCount;
  resultFirstGatherIndex = firstGatherIndex;
  resultFirstNextOnlyIndex = firstNextOnlyIndex;
  resultWholeNodeActionCount = wholeNodeActionCount;
  resultWholeNodeBeforeNextOnlyScore = wholeNodeBeforeNextOnlyScore;
  resultNextOnlyScore = nextOnlyScore;
  resultGiftCount = giftCount;
  resultLastGiftIndex = lastGiftIndex;
  resultTidingsIndex = tidingsIndex;
  resultRotationPreferenceScore = rotationPreferenceScore;
  resultBestAction = bestAction;
}

function preferredResult(
  candidateScore: f64,
  candidateHabit: i32,
  candidateLength: i32,
  candidatePreference: i32,
  candidateAction: i32,
  currentScore: f64,
  currentHabit: i32,
  currentLength: i32,
  currentPreference: i32,
  currentAction: i32
): bool {
  if (candidateScore > currentScore + EV_EPSILON) return true;
  if (candidateScore < currentScore - EV_EPSILON) return false;
  if (objectiveMode != OBJECTIVE_EXPECTED && candidateLength != currentLength) return candidateLength < currentLength;
  if (candidateHabit != currentHabit) return candidateHabit > currentHabit;
  if (candidatePreference != currentPreference) return candidatePreference > currentPreference;
  return false;
}

function isNextOnlyAction(action: i32): bool {
  return action == ACTION_CLEAR_VISION || action == ACTION_BOUNTIFUL_I || action == ACTION_BOUNTIFUL_II;
}

function evaluateCandidate(
  action: i32,
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): void {
  if (action == ACTION_GATHER) {
    evaluateGather(gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);
    return;
  }

  if (action == ACTION_RESTORE) {
    evaluateRestore(gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);
    return;
  }

  let nextGp = gp;
  let nextFlags = flags;
  let nextSuccessTotal = successBonus;
  let nextBoonTotal = boonBonus;
  let nextAllYieldBonus = allYieldBonus;
  let nextNextSuccessBonus = nextSuccessBonus;
  let nextNextYieldBonus = nextYieldBonus;

  if (action == ACTION_WISE) {
    solve(gp, minI32(maxIntegrity, integrity + 1), flags & ~FLAG_WISE, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);
    candidateObjectiveScore = resultObjectiveScore;
    candidateExpectedYield = resultExpectedYield;
    candidateMinYield = resultMinYield;
    candidateMaxYield = resultMaxYield;
    candidateHabitScore = resultHabitScore + 250;
    loadCandidateMetadataFromResult(action);
    branchCount += 1;
    return;
  }

  if (action == ACTION_SUCCESS_I) {
    nextGp -= 50;
    nextFlags |= FLAG_SUCCESS_I;
    nextSuccessTotal += 5;
  } else if (action == ACTION_SUCCESS_II) {
    nextGp -= 100;
    nextFlags |= FLAG_SUCCESS_II;
    nextSuccessTotal += 15;
  } else if (action == ACTION_SUCCESS_III) {
    nextGp -= 250;
    nextFlags |= FLAG_SUCCESS_III;
    nextSuccessTotal += 50;
  } else if (action == ACTION_GIFT_I) {
    nextGp -= 50;
    nextFlags |= FLAG_GIFT_I;
    nextBoonTotal += 10;
  } else if (action == ACTION_GIFT_II) {
    nextGp -= 100;
    nextFlags |= FLAG_GIFT_II;
    nextBoonTotal += 30;
  } else if (action == ACTION_CLEAR_VISION) {
    nextGp -= 50;
    nextNextSuccessBonus = 15;
  } else if (action == ACTION_BOUNTIFUL_I) {
    nextGp -= 100;
    nextNextYieldBonus = 1;
  } else if (action == ACTION_BOUNTIFUL_II) {
    nextGp -= 100;
    nextNextYieldBonus = bountifulYield;
  } else if (action == ACTION_KING_I) {
    nextGp -= 400;
    nextAllYieldBonus = 1;
  } else if (action == ACTION_KING_II) {
    nextGp -= 500;
    nextAllYieldBonus = 2;
  } else if (action == ACTION_TIDINGS) {
    nextGp -= 200;
    nextFlags |= FLAG_TIDINGS;
  }

  branchCount += 1;
  solve(nextGp, integrity, nextFlags, nextSuccessTotal, nextBoonTotal, nextAllYieldBonus, nextNextSuccessBonus, nextNextYieldBonus);
  candidateObjectiveScore = resultObjectiveScore;
  candidateExpectedYield = resultExpectedYield;
  candidateMinYield = resultMinYield;
  candidateMaxYield = resultMaxYield;
  candidateHabitScore = resultHabitScore;
  loadCandidateMetadataFromResult(action);
}

function evaluateGather(
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): void {
  const successRate = <f64>minI32(SUCCESS_CAP, maxI32(0, baseSuccessRate + successBonus + nextSuccessBonus)) / 100.0;
  const boonChance = <f64>minI32(BOON_CAP, maxI32(0, baseBoonChance + nodeBoonBonus + boonBonus)) / 100.0;
  const baseYield = 1 + nodeYieldBonus + allYieldBonus + nextYieldBonus;
  const boonYield = 1 + (((flags & FLAG_TIDINGS) != 0) ? 1 : 0);
  const baseFlags = flags | FLAG_HAS_GATHERED;
  const successGp = minI32(maxGp, gp + gpPerGather());
  const nextIntegrity = integrity - 1;
  let expected = 0.0;
  let minYield = 2147483647;
  let maxYield = -2147483648;
  let habitScore = -2147483648;
  let firstActionCount = -1;
  let firstFirstGatherIndex = 0;
  let firstFirstNextOnlyIndex = -1;
  let firstWholeNodeActionCount = 0;
  let firstWholeNodeBeforeNextOnlyScore = 0;
  let firstNextOnlyScore = 0;
  let firstGiftCount = 0;
  let firstLastGiftIndex = -1;
  let firstTidingsIndex = -1;
  let hasFirstBranch = false;

  if (successRate < 1.0) {
    branchCount += 1;
    solve(gp, nextIntegrity, baseFlags, successBonus, boonBonus, allYieldBonus, 0, 0);
    const probability = 1.0 - successRate;
    expected += probability * resultExpectedYield;
    minYield = minI32(minYield, resultMinYield);
    maxYield = maxI32(maxYield, resultMaxYield);
    habitScore = maxI32(habitScore, resultHabitScore);
    if (!hasFirstBranch) {
      firstActionCount = resultActionCount;
      firstFirstGatherIndex = resultFirstGatherIndex;
      firstFirstNextOnlyIndex = resultFirstNextOnlyIndex;
      firstWholeNodeActionCount = resultWholeNodeActionCount;
      firstWholeNodeBeforeNextOnlyScore = resultWholeNodeBeforeNextOnlyScore;
      firstNextOnlyScore = resultNextOnlyScore;
      firstGiftCount = resultGiftCount;
      firstLastGiftIndex = resultLastGiftIndex;
      firstTidingsIndex = resultTidingsIndex;
      hasFirstBranch = true;
    }
  }

  if (successRate > 0.0 && boonChance < 1.0) {
    branchCount += 1;
    solve(successGp, nextIntegrity, baseFlags, successBonus, boonBonus, allYieldBonus, 0, 0);
    const probability = successRate * (1.0 - boonChance);
    expected += probability * (<f64>baseYield + resultExpectedYield);
    minYield = minI32(minYield, baseYield + resultMinYield);
    maxYield = maxI32(maxYield, baseYield + resultMaxYield);
    habitScore = maxI32(habitScore, resultHabitScore);
    if (!hasFirstBranch) {
      firstActionCount = resultActionCount;
      firstFirstGatherIndex = resultFirstGatherIndex;
      firstFirstNextOnlyIndex = resultFirstNextOnlyIndex;
      firstWholeNodeActionCount = resultWholeNodeActionCount;
      firstWholeNodeBeforeNextOnlyScore = resultWholeNodeBeforeNextOnlyScore;
      firstNextOnlyScore = resultNextOnlyScore;
      firstGiftCount = resultGiftCount;
      firstLastGiftIndex = resultLastGiftIndex;
      firstTidingsIndex = resultTidingsIndex;
      hasFirstBranch = true;
    }
  }

  if (successRate > 0.0 && boonChance > 0.0) {
    branchCount += 1;
    solve(successGp, nextIntegrity, baseFlags, successBonus, boonBonus, allYieldBonus, 0, 0);
    const yieldDelta = baseYield + boonYield;
    const probability = successRate * boonChance;
    expected += probability * (<f64>yieldDelta + resultExpectedYield);
    minYield = minI32(minYield, yieldDelta + resultMinYield);
    maxYield = maxI32(maxYield, yieldDelta + resultMaxYield);
    habitScore = maxI32(habitScore, resultHabitScore);
    if (!hasFirstBranch) {
      firstActionCount = resultActionCount;
      firstFirstGatherIndex = resultFirstGatherIndex;
      firstFirstNextOnlyIndex = resultFirstNextOnlyIndex;
      firstWholeNodeActionCount = resultWholeNodeActionCount;
      firstWholeNodeBeforeNextOnlyScore = resultWholeNodeBeforeNextOnlyScore;
      firstNextOnlyScore = resultNextOnlyScore;
      firstGiftCount = resultGiftCount;
      firstLastGiftIndex = resultLastGiftIndex;
      firstTidingsIndex = resultTidingsIndex;
      hasFirstBranch = true;
    }
  }

  if (minYield == 2147483647) minYield = 0;
  if (maxYield == -2147483648) maxYield = 0;
  if (habitScore == -2147483648) habitScore = 0;

  candidateExpectedYield = expected;
  candidateMinYield = minYield;
  candidateMaxYield = maxYield;
  candidateObjectiveScore = scoreFromOutcome(expected, minYield, maxYield);
  candidateHabitScore = habitScore;
  loadCandidateMetadataFromChild(
    ACTION_GATHER,
    firstActionCount,
    firstFirstGatherIndex,
    firstFirstNextOnlyIndex,
    firstWholeNodeActionCount,
    firstWholeNodeBeforeNextOnlyScore,
    firstNextOnlyScore,
    firstGiftCount,
    firstLastGiftIndex,
    firstTidingsIndex
  );
}

function evaluateRestore(
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): void {
  const nextGp = gp - 300;
  const nextIntegrity = minI32(maxIntegrity, integrity + 1);
  const restoreHabit = restoreIntegrityHabitScore(integrity);

  if (level < 90) {
    branchCount += 1;
    solve(nextGp, nextIntegrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);
    candidateExpectedYield = resultExpectedYield;
    candidateMinYield = resultMinYield;
    candidateMaxYield = resultMaxYield;
    candidateObjectiveScore = resultObjectiveScore;
    candidateHabitScore = resultHabitScore + restoreHabit;
    loadCandidateMetadataFromResult(ACTION_RESTORE);
    return;
  }

  branchCount += 2;
  solve(nextGp, nextIntegrity, flags | FLAG_WISE, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);
  const procExpected = resultExpectedYield;
  const procMin = resultMinYield;
  const procMax = resultMaxYield;
  const procHabit = resultHabitScore;
  const procActionCount = resultActionCount;
  const procFirstGatherIndex = resultFirstGatherIndex;
  const procFirstNextOnlyIndex = resultFirstNextOnlyIndex;
  const procWholeNodeActionCount = resultWholeNodeActionCount;
  const procWholeNodeBeforeNextOnlyScore = resultWholeNodeBeforeNextOnlyScore;
  const procNextOnlyScore = resultNextOnlyScore;
  const procGiftCount = resultGiftCount;
  const procLastGiftIndex = resultLastGiftIndex;
  const procTidingsIndex = resultTidingsIndex;

  solve(nextGp, nextIntegrity, flags & ~FLAG_WISE, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus);
  const noProcExpected = resultExpectedYield;
  const noProcMin = resultMinYield;
  const noProcMax = resultMaxYield;
  const noProcHabit = resultHabitScore;
  const noProcActionCount = resultActionCount;
  const noProcFirstGatherIndex = resultFirstGatherIndex;
  const noProcFirstNextOnlyIndex = resultFirstNextOnlyIndex;
  const noProcWholeNodeActionCount = resultWholeNodeActionCount;
  const noProcWholeNodeBeforeNextOnlyScore = resultWholeNodeBeforeNextOnlyScore;
  const noProcNextOnlyScore = resultNextOnlyScore;
  const noProcGiftCount = resultGiftCount;
  const noProcLastGiftIndex = resultLastGiftIndex;
  const noProcTidingsIndex = resultTidingsIndex;

  candidateExpectedYield = noProcExpected * 0.5 + procExpected * 0.5;
  candidateMinYield = minI32(noProcMin, procMin);
  candidateMaxYield = maxI32(noProcMax, procMax);
  candidateObjectiveScore = scoreFromOutcome(candidateExpectedYield, candidateMinYield, candidateMaxYield);

  if (procExpected >= noProcExpected) {
    candidateHabitScore = procHabit + restoreHabit;
    loadCandidateMetadataFromChild(
      ACTION_RESTORE,
      procActionCount,
      procFirstGatherIndex,
      procFirstNextOnlyIndex,
      procWholeNodeActionCount,
      procWholeNodeBeforeNextOnlyScore,
      procNextOnlyScore,
      procGiftCount,
      procLastGiftIndex,
      procTidingsIndex
    );
  } else {
    candidateHabitScore = noProcHabit + restoreHabit;
    loadCandidateMetadataFromChild(
      ACTION_RESTORE,
      noProcActionCount,
      noProcFirstGatherIndex,
      noProcFirstNextOnlyIndex,
      noProcWholeNodeActionCount,
      noProcWholeNodeBeforeNextOnlyScore,
      noProcNextOnlyScore,
      noProcGiftCount,
      noProcLastGiftIndex,
      noProcTidingsIndex
    );
  }
}

function restoreIntegrityHabitScore(integrity: i32): i32 {
  const missingIntegrity = maxIntegrity - integrity;
  const preferredMissingIntegrity = level >= 90 ? 2 : 1;
  return missingIntegrity >= preferredMissingIntegrity ? 500 : -500;
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
  yieldBonus: i32,
  boonBonus: i32,
  memoCapacityPower: i32,
  mode: i32
): f64 {
  level = playerLevel;
  maxGp = playerGp;
  maxIntegrity = integrity;
  objectiveMode = mode;
  baseSuccessRate = calculateSuccessRate(gathering, baseGathering, playerLevel, itemLevel);
  baseBoonChance = calculateBoonChance(perception, basePerception);
  bountifulYield = calculateBountifulYield(gathering, baseGathering);
  nodeYieldBonus = yieldBonus;
  nodeBoonBonus = boonBonus;

  resetMemo(1 << memoCapacityPower);
  solve(minI32(playerGp, temporaryGp), maxIntegrity, 0, 0, 0, 0, 0, 0);
  return resultObjectiveScore;
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
  yieldBonus: i32,
  boonBonus: i32,
  memoCapacityPower: i32
): f64 {
  return solvePlanObjective(
    playerLevel,
    gathering,
    perception,
    playerGp,
    baseGathering,
    basePerception,
    itemLevel,
    integrity,
    temporaryGp,
    yieldBonus,
    boonBonus,
    memoCapacityPower,
    OBJECTIVE_EXPECTED
  );
}

export function getExpectedYield(): f64 {
  return resultExpectedYield;
}

export function getMinYield(): i32 {
  return resultMinYield;
}

export function getMaxYield(): i32 {
  return resultMaxYield;
}

export function getBestAction(): i32 {
  return resultBestAction;
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

export function getFailureReason(): i32 {
  return failureReason;
}

export function getBaseSuccessRate(): i32 {
  return baseSuccessRate;
}

export function getBaseBoonChance(): i32 {
  return baseBoonChance;
}

export function getScoreForState(
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): f64 {
  if (integrity <= 0) return 0.0;
  const index = memoFindIndex(packKey(gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus));
  return index >= 0 ? unchecked(objectiveScores[index]) : NaN;
}

export function getExpectedYieldForState(
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): f64 {
  if (integrity <= 0) return 0.0;
  const index = memoFindIndex(packKey(gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus));
  return index >= 0 ? unchecked(expectedYields[index]) : NaN;
}

export function getMinYieldForState(
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): i32 {
  if (integrity <= 0) return 0;
  const index = memoFindIndex(packKey(gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus));
  return index >= 0 ? unchecked(minYields[index]) : -1;
}

export function getMaxYieldForState(
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): i32 {
  if (integrity <= 0) return 0;
  const index = memoFindIndex(packKey(gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus));
  return index >= 0 ? unchecked(maxYields[index]) : -1;
}

export function getBestActionForState(
  gp: i32,
  integrity: i32,
  flags: i32,
  successBonus: i32,
  boonBonus: i32,
  allYieldBonus: i32,
  nextSuccessBonus: i32,
  nextYieldBonus: i32
): i32 {
  if (integrity <= 0) return -1;
  const index = memoFindIndex(packKey(gp, integrity, flags, successBonus, boonBonus, allYieldBonus, nextSuccessBonus, nextYieldBonus));
  return index >= 0 ? unchecked(bestActions[index]) : -1;
}
