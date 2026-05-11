import { ref } from 'vue';

export const createGuideSearchQuery = ref('');
export const createExperimentSearchQuery = ref('');

export function useSearchStore() {
  return {
    createGuideSearchQuery,
    createExperimentSearchQuery
  };
}
