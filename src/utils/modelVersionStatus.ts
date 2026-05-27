import {
  buildModelVersionsForScenario,
  type TomeModelScenario,
  type TomeModelVersionKey,
  type TomeModelVersions
} from '../config/modelVersions';

const STALE_COMPARISON_KEYS = {
  'tome.regular': ['regularSolver'],
  'tome.collectable': ['collectableSolver'],
  'experiment.regular': ['regularSimulator', 'regularAnalyzer'],
  'experiment.collectable': ['collectableSimulator', 'collectableAnalyzer']
} as const satisfies Record<TomeModelScenario, readonly TomeModelVersionKey[]>;

export function isModelVersionSnapshotStale(
  scenario: TomeModelScenario,
  snapshotVersions?: TomeModelVersions
) {
  if (!snapshotVersions) return true;

  const currentVersions = buildModelVersionsForScenario(scenario);
  return STALE_COMPARISON_KEYS[scenario].some((key) => (
    snapshotVersions[key] !== currentVersions[key]
  ));
}
