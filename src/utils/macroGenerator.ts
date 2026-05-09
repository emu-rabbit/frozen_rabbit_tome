import type { MacroSettings, StoredTomeRotationStep } from '../types/game';

const MACRO_LINE_LIMIT = 15;
const ACTION_WAIT_SECONDS = 2;
const MIN_WAIT_SECONDS = 1;
const MAX_WAIT_SECONDS = 60;
const DEFAULT_SOUND_EFFECT = 6;

const ACTION_NAMES_BY_ID: Record<number, string> = {
  235: '敏銳視野',
  237: '敏銳視野II',
  295: '敏銳視野III',
  218: '環境探知',
  220: '環境探知II',
  294: '環境探知III',
  21177: '富礦的饋贈I',
  25589: '富礦的饋贈II',
  21178: '沃土的饋贈I',
  25590: '沃土的饋贈II',
  4072: '明晰視野',
  4086: '植被專精',
  4073: '高產',
  272: '高產II',
  4087: '豐收',
  273: '豐收II',
  232: '石工之理',
  215: '農夫之智',
  26521: '理智同興',
  239: '莫非王土',
  241: '莫非王土II',
  222: '天賜收成',
  224: '天賜收成II',
  21203: '納爾札爾福音',
  21204: '諾菲卡福音'
};

const ACTION_IDS_BY_NAME = Object.fromEntries(
  Object.entries(ACTION_NAMES_BY_ID).map(([actionId, actionName]) => [actionName, Number(actionId)])
) as Record<string, number>;

export interface MacroBuildResult {
  text: string;
  lines: string[];
  isComplete: boolean;
  omittedLineCount: number;
}

export type MacroActionNameResolver = (actionName: string, actionId: number | null) => string;
export type MacroGatherPromptFormatter = (context: {
  count: number;
  hasConditionalGather: boolean;
  isFinalRun: boolean;
}) => string;

export interface MacroBuildOptions {
  resolveActionName?: MacroActionNameResolver;
  formatGatherPrompt?: MacroGatherPromptFormatter;
}

type RotationStep =
  | { type: 'gather'; actionName: string }
  | { type: 'action'; actionName: string; actionId: number | null };

export function buildGatheringMacro(
  rotation: string[],
  settings: MacroSettings,
  options: MacroBuildOptions = {}
): MacroBuildResult {
  return buildMacroFromSteps(
    rotation.map((actionName) => actionName.startsWith('採集')
      ? { type: 'gather', actionName }
      : { type: 'action', actionName, actionId: actionIdFromRotationName(actionName) })
    ,
    settings,
    options
  );
}

export function buildGatheringMacroFromStoredRotation(
  rotation: StoredTomeRotationStep[],
  settings: MacroSettings,
  options: MacroBuildOptions = {}
): MacroBuildResult {
  const steps: RotationStep[] = [];

  rotation.forEach((step) => {
    if (step.type === 'gather') {
      steps.push({ type: 'gather', actionName: step.actionName ?? '採集' });
      return;
    }

    const actionName = step.actionName ?? ACTION_NAMES_BY_ID[step.actionId] ?? '';
    if (!actionName) return;

    steps.push({ type: 'action', actionName, actionId: step.actionId });
  });

  return buildMacroFromSteps(steps, settings, options);
}

function buildMacroFromSteps(
  rotation: RotationStep[],
  settings: MacroSettings,
  options: MacroBuildOptions
): MacroBuildResult {
  const lines = ['/merror off'];
  const normalizedSettings = normalizeSettings(settings);

  for (let index = 0; index < rotation.length; index += 1) {
    const step = rotation[index];

    if (step.type === 'action') {
      lines.push(buildActionLine(step.actionName, step.actionId, options.resolveActionName));
      continue;
    }

    const gatherRun = collectGatherRun(rotation, index);
    const isFinalRun = gatherRun.nextIndex >= rotation.length;
    lines.push(buildGatherPromptLine(
      gatherRun.count,
      gatherRun.hasConditionalGather,
      isFinalRun,
      normalizedSettings,
      options.formatGatherPrompt
    ));
    index = gatherRun.nextIndex - 1;
  }

  const limitedLines = lines.slice(0, MACRO_LINE_LIMIT);

  return {
    text: limitedLines.join('\n'),
    lines: limitedLines,
    isComplete: lines.length <= MACRO_LINE_LIMIT,
    omittedLineCount: Math.max(0, lines.length - MACRO_LINE_LIMIT)
  };
}

function normalizeSettings(settings: MacroSettings): MacroSettings {
  return {
    secondsPerGather: Math.max(1, Math.floor(settings.secondsPerGather || 4)),
    bufferSeconds: Math.max(0, Math.floor(settings.bufferSeconds || 0))
  };
}

function collectGatherRun(rotation: RotationStep[], startIndex: number) {
  let count = 0;
  let hasConditionalGather = false;
  let nextIndex = startIndex;

  while (nextIndex < rotation.length && rotation[nextIndex].type === 'gather') {
    count += 1;
    hasConditionalGather ||= rotation[nextIndex].actionName.includes('理智觸發');
    nextIndex += 1;
  }

  return { count, hasConditionalGather, nextIndex };
}

function buildActionLine(
  actionName: string,
  actionId: number | null,
  resolveActionName: MacroActionNameResolver | undefined
) {
  const baseActionName = stripCondition(actionName);
  const resolvedActionName = resolveActionName
    ? stripCondition(resolveActionName(baseActionName, actionId))
    : '';
  const macroActionName = resolvedActionName || baseActionName;

  return `/ac "${macroActionName}" <wait.${ACTION_WAIT_SECONDS}>`;
}

function buildGatherPromptLine(
  count: number,
  hasConditionalGather: boolean,
  isFinalRun: boolean,
  settings: MacroSettings,
  formatGatherPrompt: MacroGatherPromptFormatter | undefined
) {
  const message = formatGatherPrompt
    ? formatGatherPrompt({ count, hasConditionalGather, isFinalRun })
    : defaultGatherPromptMessage(count, hasConditionalGather, isFinalRun);

  if (isFinalRun) {
    return `/e ${message} <se.${DEFAULT_SOUND_EFFECT}>`;
  }

  return `/e ${message} <se.${DEFAULT_SOUND_EFFECT}> <wait.${calculateGatherWait(count, settings)}>`;
}

function defaultGatherPromptMessage(count: number, hasConditionalGather: boolean, isFinalRun: boolean) {
  if (isFinalRun) {
    return '請採集到底';
  }

  return hasConditionalGather
    ? `若理智同興觸發，請採集 ${count} 次`
    : `請採集 ${count} 次`;
}

function calculateGatherWait(count: number, settings: MacroSettings) {
  return Math.min(
    MAX_WAIT_SECONDS,
    Math.max(MIN_WAIT_SECONDS, count * settings.secondsPerGather + settings.bufferSeconds)
  );
}

function stripCondition(actionName: string) {
  return actionName
    .replace('(若觸發)', '')
    .replace('（若觸發）', '')
    .trim();
}

function actionIdFromRotationName(actionName: string) {
  return ACTION_IDS_BY_NAME[stripCondition(actionName)] ?? null;
}
