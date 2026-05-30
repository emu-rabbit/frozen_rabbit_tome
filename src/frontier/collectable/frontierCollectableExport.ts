import { FRONTIER_COLLECTABLE_SCHEMA_VERSION } from '../frontierModelVersions';
import type { FrontierCollectableJsonExportInput } from './frontierCollectableTypes';

export function buildFrontierCollectableJsonExport(input: FrontierCollectableJsonExportInput) {
  return compactJson({
    manifest: {
      app: 'frozen_rabbit_tome',
      schemaVersion: FRONTIER_COLLECTABLE_SCHEMA_VERSION,
      scenario: 'frontier.collectable',
      version: input.analysis.modelVersions.app ?? null,
      commit: input.commit ?? import.meta.env.VITE_APP_COMMIT ?? null,
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      locale: input.locale ?? null,
      limitations: input.analysis.assumptionsUsed.filter((assumption) => !assumption.startsWith('frontier-calculation-ms:'))
    },
    modelVersions: input.analysis.modelVersions,
    subject: {
      surface: 'frontier',
      itemKind: 'collectable',
      item: {
        itemId: input.item.itemId,
        nameLocale: input.item.nameLocale,
        nameEn: input.item.nameEn,
        glv: input.item.glv,
        gatheringItemId: input.item.gatheringItemId,
        jobType: input.item.jobType,
        jobTypes: input.item.jobTypes,
        isTimedNode: input.item.isTimedNode ?? false,
        isCollectable: !!input.item.isCollectable
      }
    },
    input: {
      player: {
        effectiveStats: input.request.stats,
        temporaryGp: input.request.temporaryGp
      },
      itemLevel: input.request.itemLevel,
      baseValues: input.request.baseValues,
      jobType: input.request.jobType,
      isTimedNode: input.request.isTimedNode,
      node: {
        bonuses: input.request.nodeBonuses,
        maxIntegrity: input.request.nodeBonuses.baseIntegrity + input.request.nodeBonuses.gatheringCount
      },
      hasRelicToolBonus: !!input.request.hasRelicToolBonus,
      objective: input.request.objective,
      rewardTable: input.request.rewardTable
    },
    probabilityProfile: input.request.probabilityProfile,
    strategy: {
      rules: input.request.strategy
    },
    analyzer: input.analysis
  });
}

function compactJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
