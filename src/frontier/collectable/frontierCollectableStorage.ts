import { FRONTIER_COLLECTABLE_SCHEMA_VERSION } from '../frontierModelVersions';
import type { FrontierCollectableStudy } from './frontierCollectableTypes';

export const FRONTIER_COLLECTABLE_STUDIES_STORAGE_KEY = 'frozen-rabbit-tome-frontier-studies';

export function createFrontierCollectableStudyId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `frontier-study-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function normalizeFrontierCollectableStudy(study: FrontierCollectableStudy): FrontierCollectableStudy {
  const now = new Date().toISOString();

  return {
    ...study,
    schemaVersion: FRONTIER_COLLECTABLE_SCHEMA_VERSION,
    kind: 'frontier.collectable',
    id: study.id || createFrontierCollectableStudyId(),
    createdAt: study.createdAt || now,
    updatedAt: study.updatedAt || now
  };
}
