export default {
  app: {
    title: 'Frozen Rabbit Tome',
    subtitle: 'Secret gathering tips from the rabbit',
    description: 'FFXIV Gatherer skill recommendation tool'
  },
  common: {},
  nav: {
    createGuide: 'Create Tome',
    settings: 'Settings',
    github: 'GitHub Project'
  },
  createGuide: {
    title: 'Select Item to Gather',
    subtitle: 'Search by name, or try English if not found',
    dataScope: 'Only Miner & Botanist items are shown. Fisher items and collectables are excluded.',
    searchPlaceholder: 'Enter item name',
    loading: 'Loading data, please wait…',
    noResults: 'No items found. Try searching in English.',
    typeToSearch: 'Type an item name to search',
    glv: 'Glv',
    noTranslation: '(No official translation)'
  },
  settings: {
    title: 'Tome Settings',
    description: 'Adjust your tome preferences',
    appearanceTitle: 'Appearance',
    appearanceDesc: 'Customize visual style',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Enable dark mode for low-light environments',
    language: 'Language',
    languageDesc: 'Interface language (English fallback)',
    langOptions: {
      tw: '繁體中文',
      en: 'English',
      ja: '日本語',
      cn: '简体中文'
    },
    aboutTitle: 'About Project',
    aboutDesc: 'Frozen Rabbit Tome is a specialized toolkit for FFXIV gatherers.'
  },
  welcomeModal: {
    title: 'Welcome to the Tome',
    subtitle: 'Please select your preferred language',
    description: 'This will adjust the entire interface language. You can change it anytime in Settings.',
    confirm: 'Start with this language'
  }
}
