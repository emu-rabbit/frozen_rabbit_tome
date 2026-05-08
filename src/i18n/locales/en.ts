export default {
  app: {
    title: 'Frozen Rabbit Tome',
    subtitle: 'Secret gathering tips from the rabbit',
    description: 'FFXIV Gatherer skill recommendation tool'
  },
  common: {},
  nav: {
    createGuide: 'Create Tome',
    solver: 'Tome Solver',
    settings: 'Settings',
    github: 'GitHub Project'
  },
  createGuide: {
    title: 'Select Item to Gather',
    subtitle: 'Search by name, or try English if not found',
    dataScope: 'Only Miner & Botanist items are shown.',
    searchPlaceholder: 'Enter item name',
    loading: 'Loading data, please wait…',
    noResults: 'No items found. Try searching in English.',
    typeToSearch: 'Type an item name to search',
    glv: 'Glv',
    noTranslation: '(No official translation)',
    collectableSystem: 'Collectable',
    regularSystem: 'Regular',
    apiError: 'Unable to connect to XIVAPI for collectable data. Please check your network or try again later.',
    retrySearch: 'Retry Search'
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
    aboutDesc: 'Frozen Rabbit Tome is a specialized toolkit for FFXIV gatherers.',
    statsTitle: 'Player Equipment Stats',
    statsDesc: 'Enter your actual in-game stats to get more accurate recommendations.',
  },
  solver: {
    title: 'Tome Solver',
    statsTitle: 'Current Gathering Stats',
    currentGp: 'Current GP',
    maxGp: 'Max GP (Equipment Cap)',
    noItemTitle: 'No Item Selected',
    noItemDesc: 'Please search and select an item via "Create Tome" first.',
    goToCreate: 'Go to Create Tome',
    collectableWarning: 'Collectable system is under construction',
    syncToSettings: 'Sync {job} Settings',
    syncSuccess: 'Stats synced to global settings',
    food: {
      label: 'Food',
      placeholder: 'Search food',
      nq: 'NQ',
      hq: 'HQ',
      max: 'max'
    },
    results: {
      gatheringRate: 'Base Gathering Rate',
      boonRate: 'Base Boon Rate'
    },
    nodeBonusesTitle: 'Node Values',
    nodeBonuses: {
      baseIntegrity: 'BASE DURABILITY',
      gatheringCount: 'Durability +',
      yieldCount: 'Yield +',
      extraRate: 'Extra Rate +',
    }
  },
  game: {
    jobs: {
      miner: 'Miner',
      botanist: 'Botanist'
    },
    stats: {
      level: 'Level',
      gathering: 'Gathering',
      perception: 'Perception',
      gp: 'GP'
    },
    units: {
      times: 'Time(s)',
      count: 'Piece(s)',
      percent: '%'
    }
  },
  welcomeModal: {
    title: 'Welcome to the Tome',
    subtitle: 'Please select your preferred language',
    description: 'This will adjust the entire interface language. You can change it anytime in Settings.',
    confirm: 'Start with this language'
  }
}
