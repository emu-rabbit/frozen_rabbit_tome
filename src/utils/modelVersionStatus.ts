import {
  buildModelVersionsForScenario,
  type TomeModelScenario,
  type TomeModelVersionKey,
  type TomeModelVersions
} from '../config/modelVersions';

export function isModelVersionSnapshotStale(
  scenario: TomeModelScenario,
  snapshotVersions?: TomeModelVersions
) {
  if (!snapshotVersions) return false;

  const currentVersions = buildModelVersionsForScenario(scenario);
  return Object.entries(currentVersions).some(([key, version]) => (
    snapshotVersions[key as TomeModelVersionKey] !== version
  ));
}
