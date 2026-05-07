import { useLocalStorage } from '@vueuse/core';
import type { UserStats } from '../types/game';

export type Language = 'tw' | 'en' | 'ja' | 'cn';

const DEFAULT_STATS = {
  gathering: 5345,
  perception: 5137,
  gp: 930
};

export function useSettings() {
  const language = useLocalStorage<Language>('frozen-rabbit-tome-lang', 'tw');
  const isDarkMode = useLocalStorage<boolean>('frozen-rabbit-tome-dark-mode', false);
  const initialized = useLocalStorage<boolean>('frozen-rabbit-tome-initialized', false);
  
  const userStats = useLocalStorage<UserStats>('frozen-rabbit-tome-user-stats', {
    miner: { ...DEFAULT_STATS },
    botanist: { ...DEFAULT_STATS }
  });

  return {
    language,
    isDarkMode,
    initialized,
    userStats
  };
}
