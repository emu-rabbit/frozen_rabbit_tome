import { FRONTIER_COLLECTABLE_SCHEMA_VERSION } from '../frontierModelVersions';
import { computed, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { FrontierCollectableStudy } from './frontierCollectableTypes';

export const FRONTIER_COLLECTABLE_STUDIES_STORAGE_KEY = 'frozen-rabbit-tome-frontier-studies';
const studies = useLocalStorage<FrontierCollectableStudy[]>(FRONTIER_COLLECTABLE_STUDIES_STORAGE_KEY, []);
const searchQuery = ref('');

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

function cloneStudy<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload)) as T;
}

export function useFrontierCollectableStudies() {
  const visibleStudies = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    const sorted = [...studies.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    if (!query) return sorted;

    return sorted.filter((study) => (
      study.name?.toLowerCase().includes(query)
      || study.itemId.toString().includes(query)
      || study.kind.includes(query)
    ));
  });
  const studyCount = computed(() => studies.value.length);

  function saveStudy(study: FrontierCollectableStudy) {
    const normalized = normalizeFrontierCollectableStudy(cloneStudy(study));
    const existingIndex = studies.value.findIndex((candidate) => candidate.id === normalized.id);

    studies.value = existingIndex >= 0
      ? studies.value.map((candidate, index) => index === existingIndex ? normalized : candidate)
      : [normalized, ...studies.value];

    return normalized;
  }

  function createStudy(payload: Omit<FrontierCollectableStudy, 'schemaVersion' | 'kind' | 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: string }) {
    const now = new Date().toISOString();
    return saveStudy({
      ...payload,
      schemaVersion: FRONTIER_COLLECTABLE_SCHEMA_VERSION,
      kind: 'frontier.collectable',
      id: payload.id || createFrontierCollectableStudyId(),
      createdAt: payload.createdAt || now,
      updatedAt: now
    });
  }

  function deleteStudy(id: string) {
    studies.value = studies.value.filter((study) => study.id !== id);
  }

  function getStudy(id: string) {
    return studies.value.find((study) => study.id === id) ?? null;
  }

  return {
    studies,
    visibleStudies,
    studyCount,
    searchQuery,
    createStudy,
    saveStudy,
    deleteStudy,
    getStudy
  };
}
