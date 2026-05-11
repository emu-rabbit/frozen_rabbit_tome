import { useLocalStorage } from '@vueuse/core';

export const createGuideSearchQuery = useLocalStorage('frozen-rabbit-tome-create-guide-search', '');
export const createExperimentSearchQuery = useLocalStorage('frozen-rabbit-tome-create-experiment-search', '');

export function useSearchStore() {
  return {
    createGuideSearchQuery,
    createExperimentSearchQuery
  };
}
