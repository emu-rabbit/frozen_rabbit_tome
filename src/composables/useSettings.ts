import { useLocalStorage } from '@vueuse/core';
import { computed } from 'vue';
import type { DebugSettings, MacroSettings, SolverSettings, UserStats } from '../types/game';
import { profileToStats, useGearProfiles } from './useGearProfiles';

export type Language = 'tw' | 'en' | 'ja' | 'cn';

const language = useLocalStorage<Language>('frozen-rabbit-tome-lang', 'tw');
const isDarkMode = useLocalStorage<boolean>('frozen-rabbit-tome-dark-mode', false);
const initialized = useLocalStorage<boolean>('frozen-rabbit-tome-initialized', false);

const macroSettings = useLocalStorage<MacroSettings>('frozen-rabbit-tome-macro-settings', {
  secondsPerGather: 4,
  bufferSeconds: 2
});

const solverSettings = useLocalStorage<SolverSettings>('frozen-rabbit-tome-solver-settings', {
  objectiveMode: 'expected',
  collectableRelicToolBonus: false
});
if (typeof solverSettings.value.collectableRelicToolBonus !== 'boolean') {
  solverSettings.value.collectableRelicToolBonus = false;
}

const debugSettings = useLocalStorage<DebugSettings>('frozen-rabbit-tome-debug-settings', {
  solverDebugMode: false
});

export function useSettings() {
  const { defaultProfileForJob, updateProfile } = useGearProfiles();
  const userStats = computed<UserStats>({
    get: () => ({
      miner: profileToStats(defaultProfileForJob('miner')),
      botanist: profileToStats(defaultProfileForJob('botanist'))
    }),
    set: (nextStats) => {
      updateProfile('default-miner', {
        level: nextStats.miner.level,
        gathering: nextStats.miner.gathering,
        perception: nextStats.miner.perception,
        currentGp: nextStats.miner.gp,
        maxGp: nextStats.miner.gp
      });
      updateProfile('default-botanist', {
        level: nextStats.botanist.level,
        gathering: nextStats.botanist.gathering,
        perception: nextStats.botanist.perception,
        currentGp: nextStats.botanist.gp,
        maxGp: nextStats.botanist.gp
      });
    }
  });

  return {
    language,
    isDarkMode,
    initialized,
    userStats,
    macroSettings,
    solverSettings,
    debugSettings
  };
}
