export default {
  app: {
    title: 'Frozen Rabbit Tome',
    subtitle: 'Secret gathering tips from the rabbit',
    description: 'FFXIV Gatherer skill recommendation tool'
  },
  common: {},
  macro: {
    prompts: {
      gatherCount: 'Gather {count} time(s)',
      conditionalGatherCount: 'If Wise procs, gather {count} time(s)',
      finalGather: 'Gather until depleted',
      finalConditionalGather: 'If Wise procs, gather until depleted'
    }
  },
  nav: {
    createGuide: 'Create Tome',
    solver: 'Tome Solver',
    tomeLibrary: 'Tome Library',
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
    macroTitle: 'Gathering Macro',
    macroDesc: 'Adjust how long the macro waits while asking you to manually gather. Default is 4 seconds per item plus a 2-second buffer.',
    macroSecondsPerGather: 'Wait per item',
    macroBufferSeconds: 'Extra buffer',
  },
  solver: {
    title: 'Tome Solver',
    statsTitle: 'Current Gathering Stats',
    currentGp: 'Starting GP',
    effectiveMaxGp: 'Full GP after food',
    maxGp: 'Equipment Max GP',
    noItemTitle: 'No Item Selected',
    noItemDesc: 'Please search and select an item via "Create Tome" first.',
    goToCreate: 'Go to Create Tome',
    collectableWarning: 'Collectable system is under construction',
    syncToSettings: 'Save {job} Settings',
    syncSuccess: 'Settings saved',
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
    },
    strategy: {
      title: 'Recommended Rotation',
      description: 'Solves the highest expected-yield rotation from your current values.',
      copyMacro: 'Copy Macro',
      copyMacroStates: {
        copied: 'Copied',
        partial: 'Copied first 15 lines',
        failed: 'Copy failed'
      },
      saveTome: 'Save Tome',
      savedTome: 'Saved',
      solve: 'Solve It',
      expectedYield: 'Expected Yield',
      maxYield: 'Maximum Yield',
      minYield: 'Minimum Yield',
      rotationOrder: 'Rotation Order',
      empty: 'Click the button above to calculate a recommended rotation',
      gatherAction: 'Gather',
      conditionalSuffix: ' (if triggered)',
      conditionalGatherSuffix: ' (Wise proc)'
    }
  },
  tomeLibrary: {
    title: 'Tome Library',
    subtitle: 'Manage saved gathering tomes, search by item, and load a setup back into the solver.',
    searchPlaceholder: 'Search saved item names',
    noFood: 'No food',
    unknownDate: 'Unknown time',
    rotationPreview: 'Best rotation preview',
    createdAt: 'Created {time}',
    emptyTitle: 'Your library is empty',
    emptyDesc: 'After solving a rotation, press "Save Tome" to keep it here.',
    emptySearchTitle: 'No matching tomes',
    emptySearchDesc: 'Try searching by the current language name or the English item name.',
    rows: {
      playerStats: 'Player Stats',
      gpState: 'GP State',
      food: 'Food',
      nodeBonuses: 'Node Bonuses'
    },
    actions: {
      edit: 'Edit',
      copyMacro: 'Copy Macro',
      copyMacroStates: {
        copied: 'Copied',
        partial: 'Copied first 15 lines',
        failed: 'Copy failed'
      },
      delete: 'Delete'
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
