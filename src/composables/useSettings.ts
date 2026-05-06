import { useLocalStorage } from '@vueuse/core';

export type Language = 'tw' | 'en' | 'ja' | 'cn';

export function useSettings() {
  const language = useLocalStorage<Language>('frozen-rabbit-tome-lang', 'tw');
  const isDarkMode = useLocalStorage<boolean>('frozen-rabbit-tome-dark-mode', true);
  const initialized = useLocalStorage<boolean>('frozen-rabbit-tome-initialized', false);

  return {
    language,
    isDarkMode,
    initialized
  };
}
