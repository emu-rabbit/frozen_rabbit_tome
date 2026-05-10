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
    createGuide: 'Create New Guide',
    solver: 'Tome Solver',
    createExperiment: 'Create New Experiment',
    tomeLibrary: 'Guide Library',
    experimentDatabase: 'Experiment Database',
    faq: 'FAQ',
    settings: 'Settings',
    github: 'GitHub Project',
    sponsor: 'Sponsor the Freezer bill'
  },
  createGuide: {
    title: 'Select Item to Gather',
    description: 'Search and select an item here to enter the solver and calculate the recommended gathering rotation.',
    dataScope: 'Only Miner & Botanist items are shown.',
    searchPlaceholder: 'Search by name, or try English if not found',
    loading: 'Loading data, please wait…',
    noResults: 'No items found. Try searching in English.',
    typeToSearch: 'Type an item name to search',
    resultCount: '{count}{plus} results',
    glv: 'Glv',
    noTranslation: '(No official translation)',
    collectableSystem: 'Collectable',
    crystalGatheringSystem: 'Crystal Gathering',
    regularSystem: 'Regular',
    apiError: 'Unable to connect to XIVAPI for collectable data. Please check your network or try again later.',
    retrySearch: 'Retry Search'
  },
  createExperiment: {
    title: 'Select Item to Gather',
    description: 'Search and select an item here to enter the simulator for experiments and analysis.',
    dataScope: 'Only Miner & Botanist items are shown.'
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
    solverModeTitle: 'Solver Goal Mode',
    solverModeDesc: 'Choose what the solver optimizes when scoring rotations.',
    solverModes: {
      expected: 'Ordinary Mode',
      max: 'Chosen Mode',
      min: 'Cautious Mode'
    },
    solverModeDetails: {
      expected: 'Scores rotations by expected yield, matching the original site behavior.',
      max: 'Scores only by the highest possible yield. Probability does not affect scoring.',
      min: 'Scores only by the lowest possible yield for more conservative planning.'
    },
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
      modeDescriptions: {
        expected: 'Ordinary Mode: solve the highest expected-yield rotation from your current values.',
        max: 'Chosen Mode: solve the rotation with the highest possible yield.',
        min: 'Cautious Mode: solve the rotation with the strongest minimum yield.'
      },
      copyMacro: 'Preview Macro',
      copyMacroStates: {
        copied: 'Copied',
        partial: 'Copied first 15 lines',
        failed: 'Copy failed'
      },
      saveTome: 'Save Tome',
      savedTome: 'Saved',
      solve: 'Solve It',
      totalExpectedYield: 'Total Expected Yield',
      summary: {
        expected: 'Total Expected Yield',
        max: 'Total Maximum Yield',
        min: 'Total Minimum Yield'
      },
      expectedYield: 'Expected Yield',
      maxYield: 'Maximum Yield',
      minYield: 'Minimum Yield',
      yieldChance: '{chance}% chance',
      chanceWithRevisit: '{chance}% chance including Revisit',
      rotationOrder: 'Rotation Order',
      primaryRotation: 'Original Rotation',
      revisitRotation: 'After Revisit Rotation',
      revisitBadge: 'Revisit Triggered',
      rotationTitles: {
        primary: 'Rotation',
        primaryWithRevisit: 'Rotation (Revisit uses the same plan)',
        revisit: 'Rotation (After Revisit)'
      },
      revisitSameRotationNote: {
        expected: 'The total expected yield includes Revisit chance.',
        max: 'The maximum yield and chance include possible Revisit.',
        min: 'The minimum yield and chance include possible Revisit.'
      },
      revisitTotalNote: {
        expected: 'The total expected yield includes Revisit chance.',
        max: 'The maximum yield and chance include the after-Revisit rotation.',
        min: 'The minimum yield and chance include the after-Revisit rotation.'
      },
      empty: 'Click the button above to calculate a recommended rotation',
      workerErrors: {
        reload: 'Reload',
        workerStale: {
          title: 'The solver needs to reload',
          desc: 'The site may have just updated, so this old page cannot load the new solver resource. Reload to continue.'
        },
        workerFailed: {
          title: 'The solver could not start',
          desc: 'Please reload the page and try again. If it keeps happening, try again later.'
        }
      },
      gatherAction: 'Gather',
      conditionalSuffix: ' (if triggered)',
      conditionalGatherSuffix: ' (Wise proc)'
    },
    debug: {
      open: 'View solver debug info',
      close: 'Close debug dialog',
      kicker: 'Solver Debug',
      title: 'Expected Value and Optimality Check',
      subtitle: 'Formulas, yield distributions, and dynamic-programming search statistics for this solve.',
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
      plans: 'Rotation Results',
      primaryPlan: 'Primary rotation',
      revisitPlan: 'After Revisit rotation',
      startingGp: 'Starting GP',
      minYield: 'Min',
      maxYield: 'Max',
      statesSolved: 'States solved',
      memoHits: 'Memo hits',
      actionsEvaluated: 'Evaluated branches',
      optimality: 'Optimality',
      optimalityMethod: 'For each state, the solver exhaustively evaluates every legal action branch and the direct gather branch, then memoizes the best subproblem result. Within the current model, the root state therefore receives the globally best expected value.',
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
      nodeBonuses: 'Node Bonuses',
      objectiveMode: 'Solver Mode'
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
      percent: '%',
      secondsSuffix: ' s'
    }
  },
  welcomeModal: {
    title: 'Welcome to the Tome',
    subtitle: 'Please select your preferred language',
    description: 'This will adjust the entire interface language. You can change it anytime in Settings.',
    confirm: 'Start with this language'
  },
  sponsorModal: {
    title: 'Support Frozen Rabbit',
    description: 'Thank you for your support! Please choose your preferred region to ensure a smooth donation process. Contact: {email}',
    twProvider: 'Taiwan (ECPay)',
    twDesc: 'Best for supporters in Taiwan. Supports local cards and convenience stores.',
    globalProvider: 'Global (Ko-fi / PayPal)',
    globalDesc: 'Best for international supporters. Supports Discord integration.'
  }
}
