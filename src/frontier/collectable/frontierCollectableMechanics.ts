import type {
  FrontierCollectableProbabilityProfile,
  FrontierCollectableState
} from './frontierCollectableTypes';

export interface FrontierIntuitionRates {
  totalProcRatePercent: number;
  standardProcRatePercent: number;
  highStandardProcRatePercent: number;
  noProcRatePercent: number;
}

export interface FrontierMeticulousSaveRateContext {
  meticulousRate: number;
}

export function getFrontierIntuitionRates(
  profile: FrontierCollectableProbabilityProfile
): FrontierIntuitionRates {
  const totalProcRatePercent = clampPercent(profile.standardProcRatePercent);
  const highStandardProcRatePercent = clampPercent(profile.highStandardProcRatePercent ?? 0);
  const effectiveProcRatePercent = Math.max(totalProcRatePercent, highStandardProcRatePercent);

  return {
    totalProcRatePercent,
    standardProcRatePercent: clampPercent(totalProcRatePercent - highStandardProcRatePercent),
    highStandardProcRatePercent,
    noProcRatePercent: clampPercent(100 - effectiveProcRatePercent)
  };
}

export function getFrontierMeticulousSaveRatePercent(
  state: Pick<FrontierCollectableState, 'primingTouchActive' | 'standardMode'>,
  context: FrontierMeticulousSaveRateContext
): number {
  const baseRate = state.primingTouchActive
    ? Math.min(100, context.meticulousRate * 2)
    : context.meticulousRate;
  const highStandardBonus = state.standardMode === 'highStandard' ? 40 : 0;

  return clampPercent(baseRate + highStandardBonus);
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}
