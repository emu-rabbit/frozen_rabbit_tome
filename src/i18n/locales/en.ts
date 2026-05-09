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
      finalConditionalGather: 'If Wise procs, gather until depleted',
      continueAfterSeconds: '{message}. The macro will continue in {seconds}s'
    },
    preview: {
      kicker: 'FFXIV Gathering Macro',
      title: 'Preview Gathering Macro',
      close: 'Close macro preview',
      singleTitle: 'Macro Content',
      partTitle: 'Macro #{index}',
      singleSummary: 'This macro has {lines} line(s) and can be copied into the game.',
      splitSummary: 'This macro has {lines} line(s), split into {count} macros for the 15-line game limit.',
      groupSummary: 'This result includes {count} macro sets with {lines} total line(s). Copy each set separately.',
      lineCount: '{count} / 15 lines',
      copySingle: 'Copy Macro',
      copyPart: 'Copy #{index}',
      copyStates: {
        copied: 'Copied',
        failed: 'Copy failed'
      }
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
    crystalGatheringSystem: 'Crystal Gathering',
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
    debugTitle: 'Expert Debug Mode',
    debugDesc: 'When enabled, solved results expose formulas, probability distributions, and optimality checks.',
    solverDebugMode: 'Show solver debug info',
    solverDebugModeDesc: 'Useful for validating rotations, expected values, and the search process. Keep it off for normal use.',
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
    crystalGatheringWarning: 'Crystal gathering system is under construction',
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
      copyMacro: 'Preview Macro',
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
      primaryRotation: 'Original Rotation',
      revisitRotation: 'After Revisit Rotation',
      revisitBadge: 'Revisit Triggered',
      rotationTitles: {
        primary: 'Rotation',
        revisit: 'Rotation (After Revisit)'
      },
      empty: 'Click the button above to calculate a recommended rotation',
      gatherAction: 'Gather',
      conditionalSuffix: ' (if triggered)',
      conditionalGatherSuffix: ' (Wise proc)'
    },
    debug: {
      open: 'View solver debug info',
      close: 'Close debug dialog',
      kicker: 'Solver Debug',
      title: 'Expected Value and Optimality Check',
      subtitle: 'Formulas, outcome distributions, and dynamic-programming search statistics for this solve.',
      formulas: 'Formula Inputs',
      successFormula: 'Gathering Success Rate',
      successScoreFormula: 'Success score = floor(100 * {gathering} / {baseGathering}) = {score}',
      rawSuccess: 'Piecewise base rate',
      levelModifier: 'Level modifier',
      levelDifference: 'level difference',
      finalSuccess: 'Final success rate',
      boonFormula: 'Gatherer\'s Boon Rate',
      boonScoreFormula: 'Boon score = min(150, floor(100 * {perception} / {basePerception})) = {score}',
      finalBoon: 'Final Boon chance',
      bountifulFormula: 'Bountiful Yield / Harvest',
      plusTwoThreshold: '+2 threshold',
      plusThreeThreshold: '+3 threshold',
      bountifulAmount: 'Skill bonus this solve',
      gatherFormula: 'Gather State',
      integrity: 'Integrity',
      nodeYieldBonus: 'Node yield bonus',
      nodeBoonBonus: 'Node Boon bonus',
      gpRecovered: 'Recovered per gather',
      expectedValue: 'Total Expected Value',
      revisitChance: 'Revisit chance',
      plans: 'Rotation Branches',
      primaryPlan: 'Primary rotation',
      revisitPlan: 'After Revisit rotation',
      startingGp: 'Starting GP',
      minYield: 'Min',
      maxYield: 'Max',
      statesSolved: 'States solved',
      memoHits: 'Memo hits',
      actionsEvaluated: 'Candidate actions',
      optimality: 'Optimality',
      optimalityMethod: 'For each state, the solver exhaustively compares every legal action branch and the direct gather branch, memoizing the best subproblem result. Within the current model, the root state therefore receives the globally best expected value.',
      tieBreaker: 'If expected values are equal within epsilon, rotationPreferenceScore selects the equivalent rotation that better matches practical casting habits.',
      caveat: 'Optimality holds for the currently modeled regular-gathering skills, GP, integrity, success rate, Boon, Revisit, and Wise to the World probabilities. Collectables, crystal gathering, and manual interruption are not included.'
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
      copyMacro: 'Preview Macro',
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
