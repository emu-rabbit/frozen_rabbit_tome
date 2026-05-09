import { useLocalStorage } from '@vueuse/core';
import type { MacroSettings, UserStats } from '../types/game';

export type Language = 'tw' | 'en' | 'ja' | 'cn';

const DEFAULT_STATS = {
  level: 100,
  gathering: 5345,
  perception: 5173,
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

  const macroSettings = useLocalStorage<MacroSettings>('frozen-rabbit-tome-macro-settings', {
    secondsPerGather: 4,
    bufferSeconds: 2
  });

  return {
    language,
    isDarkMode,
    initialized,
    userStats,
    macroSettings
  };
}
