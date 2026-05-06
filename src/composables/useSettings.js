import { useLocalStorage } from '@vueuse/core';
export function useSettings() {
    const language = useLocalStorage('frozen-rabbit-tome-lang', 'tw');
    const isDarkMode = useLocalStorage('frozen-rabbit-tome-dark-mode', false);
    const initialized = useLocalStorage('frozen-rabbit-tome-initialized', false);
    return {
        language,
        isDarkMode,
        initialized
    };
}
//# sourceMappingURL=useSettings.js.map