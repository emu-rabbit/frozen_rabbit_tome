import { createI18n } from 'vue-i18n';
import tw from './locales/tw';
import en from './locales/en';
import ja from './locales/ja';
import cn from './locales/cn';

export const i18n = createI18n({
  legacy: false,
  locale: 'tw',
  fallbackLocale: 'en',
  messages: {
    tw,
    en,
    ja,
    cn
  }
});
