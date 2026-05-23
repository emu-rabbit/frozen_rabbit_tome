export default {
  app: {
    title: 'Frozen Rabbit Tome',
    subtitle: 'Secret gathering tips from the rabbit',
    description: 'FFXIV Gatherer skill recommendation tool'
  },
  common: {
    cancel: 'Cancel',
    backToSelection: 'Back to Selection',
    displayMode: 'Display Mode',
    displayModes: {
      compact: 'Compact',
      detailed: 'Detailed'
    },
    pending: {
      collectableDesc: 'The collectable gathering system is currently under development. Stay tuned!',
      crystalDesc: 'The crystal gathering system is currently under development. Stay tuned!'
    }
  },
  saveEntry: {
    nameLabel: 'Name',
    cancel: 'Cancel',
    tome: {
      title: 'Save Tome',
      description: 'Give this tome a recognizable name so it is easier to find in the library later.',
      confirm: 'Save Tome'
    },
    experiment: {
      title: 'Save Experiment',
      description: 'Give this experiment a recognizable name so it is easier to find in the database later.',
      confirm: 'Save Experiment'
    }
  },
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
    createGuide: 'Create New Tome',
    solver: 'Tome Solver',
    createExperiment: 'Create New Experiment',
    favoriteItems: 'Favorite Items',
    tomeLibrary: 'Tome Library',
    experimentDatabase: 'Experiment Database',
    faq: 'FAQ',
    settings: 'Settings',
    github: 'GitHub Project',
    sponsor: 'Sponsor the Freezer bill'
  },
  faq: {
    title: 'FAQ',
    description: 'Quick notes about the Tome support scope and the details worth checking before use.',
    items: [
      {
        q: 'Which patch are the supported actions and items based on?',
        a: 'The supported actions and items are based on Final Fantasy XIV Patch 7.5 content.'
      },
      {
        q: 'What is the difference between Tome and Experiment?',
        a: 'Tome is the solver: after you provide gear stats, GP, gathering attempts, node bonuses, and a goal, it calculates within the currently supported model and recommends a skill sequence. Experiment is the simulation and analysis tool: you provide the same conditions plus the action sequence or strategy you want to test. The simulator calculates the outcome, while the analyzer summarizes reward tiers, probability distribution, and risk so you can compare your own approach.'
      },
      {
        q: 'Does the solver output the best possible answer?',
        a: 'The site recommends a skill sequence based on most situations and the goal you selected. Each sequence still has its own strengths and tradeoffs, much like different playstyle schools, so there may not be one perfect answer. For deeper analysis, we strongly recommend using the Experiment area to simulate and compare rotations.'
      },
      {
        q: 'Can you explain how the solver works?',
        a: 'The solver expands every possible action branch, scores each branch against your selected goal, then chooses from the highest-scoring results. When multiple sequences tie, it prefers the casting order that better matches common player habits.'
      },
      {
        q: 'Why are crystal items unsupported, and why are Brazen Prospector / Brazen Woodsman and Collector\'s High Standard outside the solver search?',
        a: 'We do not yet know the detailed formulas and probability distributions for The Giving Land, Brazen Prospector / Brazen Woodsman, and Collector\'s High Standard. Brazen actions also expand the search tree very aggressively, which can create a heavy computation load. Once there is enough data or a solid approach, Frozen Rabbit will work them into the tool as soon as possible.'
      },
      {
        q: 'Why are macros described as semi-automatic?',
        a: 'Gathering itself still requires the player to click the in-game gathering menu, so a macro cannot complete the entire gathering session for you. Collectable gathering also does not support macros because it depends on judging the current on-screen state and choosing the next action accordingly.'
      },
      {
        q: 'What is the difference between Favorite Items, the Tome Library, and the Experiment Database?',
        a: 'Think of Favorite Items as saving only the item itself. Your gear stats, gathering node bonuses, calculated gathering sequence, and analysis results are not saved there, while the Tome Library and Experiment Database do save that context. Favorite Items are for players who often reuse the same item and adjust the numbers each time.'
      },
      {
        q: 'Why freeze the rabbit? Can I roast it instead?',
        a: 'No.'
      },
      {
        q: 'Current status of the website',
        a: 'The website is currently in an early alpha testing phase and many features are not yet stable. We are collecting feedback from all sources. If you encounter bugs or have suggestions, please let us know on <a href="https://github.com/emu-rabbit/frozen_rabbit_tome/issues" target="_blank" rel="noreferrer" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a>.'
      }
    ],
    footer: 'Have more questions? Feel free to report on GitHub or email: {email}'
  },
  createGuide: {
    title: 'Select Item to Gather',
    description: 'Search and select an item here to enter the solver and calculate the recommended gathering rotation.',
    dataScope: 'Only Miner & Botanist items are shown; crystal items are not supported yet.',
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
    dataScope: 'Only Miner & Botanist items are shown; crystal items are not supported yet.'
  },
  favoriteItems: {
    title: 'Favorite Items',
    subtitle: 'Keep commonly used gathering items here and jump straight into a tome or experiment.',
    count: '{count} items',
    addAction: 'Add to favorites',
    removeAction: 'Remove from favorites',
    emptyTitle: 'No favorite items yet',
    emptyDesc: 'Press the heart on search results in Create New Tome or Create New Experiment to add items here.',
    dialog: {
      kicker: 'Choose next step',
      title: 'Use {item}',
      close: 'Close choice dialog',
      guideDesc: 'Enter the Tome Solver to calculate a recommended gathering rotation',
      experimentDesc: 'Enter the simulator for experiments and analysis'
    },
    filters: {
      open: 'Filter favorite items',
      close: 'Close filter dialog',
      kicker: 'Filter conditions',
      title: 'Filter Favorite Items',
      text: 'Text Search',
      textPlaceholder: 'Search by name, or try English if not found',
      glvMin: 'Min Glv',
      glvMax: 'Max Glv',
      noLimit: 'No limit',
      jobs: 'Gatherable By',
      systems: 'Gathering System',
      clear: 'Clear Filters',
      done: 'Done',
      emptyTitle: 'No favorite items match these filters',
      emptyDesc: 'Try adjusting the text, Glv, job, or gathering system filters.',
      systemOptions: {
        regular: 'Regular',
        collectable: 'Collectable',
        crystal: 'Crystal'
      }
    }
  },
  simulator: {
    noItemTitle: 'No Experiment Item Selected',
    noItemDesc: 'Create an experiment and select a regular gathering item first.',
    goToCreate: 'Go to Create Experiment',
    collectablePending: 'The collectable gathering system will be built later.',
    crystalPending: 'The crystal gathering system will be built later.',
    statsTitle: 'Experiment Values',
    perceptionWarning: 'Perception is below the requirement, so this item cannot be gathered.',
    integrity: 'Integrity',
    tabsLabel: 'Gathering rotation tabs',
    clearRotation: 'Clear {name}',
    rotationSimulation: 'Simulate Custom Rotation',
    copyPrimaryRotation: 'Copy Primary Rotation',
    primaryGathering: 'Primary Gathering',
    revisitGathering: 'After Revisit',
    emptyPrimaryRotation: 'Click skills below to build a rotation.',
    emptyRevisitRotation: 'After durability reaches zero, build the second rotation for Revisit.',
    removeFromHere: 'Remove this skill and everything after it',
    rotationIssueTitle: 'This rotation has a skill that cannot be used',
    rotationIssueDesc: 'Check the red-highlighted skill. Its level, GP, durability, or prerequisite condition is not valid with the current values.',
    primaryRotationAnalysis: 'Primary Rotation',
    revisitRotationAnalysis: 'After-Revisit Rotation',
    rates: {
      success: 'Gathering Rate',
      boon: 'Boon Rate',
      currentGp: 'Current GP'
    },
    actions: {
      simulate: 'Analyze',
      save: 'Save Experiment',
      saved: 'Saved',
      copyReport: 'Copy Report',
      copied: 'Copied'
    },
    analysis: {
      title: 'Analysis Report',
      subtitle: 'Expected outcome based on current rotation and stats',
      noRevisitNotice: 'Experiment analysis is scoped to one gathering point and does not include any after-Revisit gathering.',
      empty: 'Click the button above to analyze the rotation',
      summary: 'Summary',
      expectedYield: 'Expected Yield',
      maxYield: 'Maximum Yield',
      minYield: 'Minimum Yield',
      chance: '{chance}% chance',
      revisitNote: 'Includes {chance}% Revisit chance.'
    },
    actionCategories: {
      gather: 'Gathering Action',
      success: 'Gathering Rate Buffs',
      boon: 'Boon Rate Buffs',
      nextSuccess: 'Next Gather Rate Buffs',
      nextYield: 'Next Gather Yield Buffs',
      restore: 'Durability Recovery',
      wholeYield: 'Whole Node Yield Buffs',
      boonYield: 'Boon Yield Buffs'
    }
  },
  experimentDatabase: {
    title: 'Experiment Database',
    subtitle: 'Manage saved regular gathering and collectable experiments, then load them back into the simulator for analysis.',
    searchPlaceholder: 'Search experiment or item names',
    emptyTitle: 'Your experiment database is empty',
    emptyDesc: 'After analyzing a setup in the simulator, press "Save Experiment" to keep it here.',
    emptySearchTitle: 'No matching experiments',
    emptySearchDesc: 'Try searching by the current language name or the English item name.',
    unknownDate: 'Unknown time',
    regularExperiment: 'Regular gathering experiment',
    collectableExperiment: 'Collectable experiment',
    countValue: '{count} item(s)',
    createdAt: 'Created at {time}',
    rows: {
      playerStats: 'Player Stats',
      gpState: 'GP State',
      nodeBonuses: 'Node Bonuses',
      totalExpected: 'Total Expected',
      expectedScore: 'Expected Score',
      maxMin: 'Max / Min'
    },
    rotations: {
      preview: 'Rotation Preview',
      strategyPreview: 'Strategy Preview',
      noStrategyPreview: 'No strategy preview yet',
      primary: 'Primary Gathering',
      revisit: 'After Revisit'
    },
    actions: {
      edit: 'Edit',
      copyReport: 'Copy Report',
      copied: 'Copied',
      delete: 'Delete Experiment'
    }
  },
  settings: {
    title: 'Tome Settings',
    description: 'Adjust your tome preferences',
    appearanceTitle: 'Appearance',
    appearanceDesc: 'Customize visual style',
    darkMode: 'Dark Mode',
    darkModeDesc: 'Enable dark mode for low-light environments',
    language: 'Language',
    languageDesc: 'Interface language (uses English when a translation is missing)',
    langOptions: {
      tw: '繁體中文',
      en: 'English',
      ja: '日本語',
      cn: '简体中文'
    },
    aboutTitle: 'About Project',
    aboutDesc: 'Frozen Rabbit Tome is a specialized toolkit for FFXIV gatherers.',
    about: {
      title: 'About & Credits',
      description: 'Gathering data, icons, and technical support behind the tome',
      teamcraft: 'Teamcraft - Gatherable items, collectable rewards, and action display data',
      xivapi: 'XIVAPI - Gathering tables, collectable checks, and icon API support'
    },
    changelogTitle: 'System Updates',
    changelogDesc: 'Learn about the latest Tome features and version updates',
    changelogLink: 'View Tome Update History',
    statsTitle: 'Player Equipment Stats',
    statsDesc: 'Enter your actual in-game stats to get more accurate recommendations.',
    gearProfilesTitle: 'Gear Stat Profiles',
    gearProfilesDesc: 'Prepare multiple gatherer stat profiles and load them later in the solver or simulator.',
    gearProfilesEntryTitle: 'Manage Gear Profiles',
    gearProfilesEntryDesc: 'Set level, Gathering, Perception, GP, food, and collectable relic tool effect.',
    gearProfilesManage: 'Open Profiles',
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
    debugTitle: 'Expert Check Mode',
    debugDesc: 'When enabled, solved results show formulas, probability distributions, and search statistics.',
    solverDebugMode: 'Show solver check info',
    solverDebugModeDesc: 'Useful for checking action plans, expected values, and the search process. Keep it off for normal use.',
  },
  changelog: {
    title: 'Version Changelog',
    description: 'A history of Tome updates and feature changes.',
    version: 'Version {v}',
    latest: 'Latest'
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
      boonRate: 'Base Boon Rate',
      unknown: 'Unknown',
      maxValue: 'MAX {value}',
      maxPercent: 'MAX {value}%'
    },
    nodeBonusesTitle: 'Node Values',
    nodeBonuses: {
      baseIntegrity: 'BASE DURABILITY',
      gatheringCount: 'Durability +',
      yieldCount: 'Yield +',
      extraRate: 'Extra Rate +',
      collectableRelicToolBonus: 'Relic Tool Effect',
      collectableRelicToolBonusDesc: 'Collectable value increase rate +20%.',
      enabled: 'Yes',
      disabled: 'No',
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
      workerCalculationTime: 'Worker compute time',
      statesSolved: 'Computed states',
      memoHits: 'Cache hits',
      memoHitRate: 'Cache hit rate',
      actionsEvaluated: 'Evaluated options',
      candidateComparisons: 'Candidate comparisons',
      branchCount: 'Total branches',
      terminalStates: 'Completed states',
      outcomeDistribution: 'Probability Distribution',
      optimality: 'Node State Fields and Optimality',
      stateKeyIntro: 'These fields are the state snapshot used by the regular gathering solver for each search node. When every value matches, the solver treats it as the same subproblem and reuses the computed result.',
      stateFields: {
        gp: 'Current remaining GP.',
        integrity: 'Remaining node integrity, meaning how many more gathers or integrity-spending actions are possible.',
        hasGathered: 'Whether this node has already gathered, used to decide if some actions are still legal.',
        successBonus: 'Total success-rate bonus currently applied to all gathers.',
        successIActive: 'Whether the Gathering Rate I style buff is active, preventing duplicate counting.',
        successIIActive: 'Whether the Gathering Rate II style buff is active.',
        successIIIActive: 'Whether the Gathering Rate III style buff is active.',
        boonBonus: 'Total Gatherer\'s Boon rate bonus currently applied.',
        giftIActive: 'Whether the Boon rate I style buff is active.',
        giftIIActive: 'Whether the Boon rate II style buff is active.',
        allYieldBonus: 'Yield bonus that applies to the whole gathering point.',
        tidings: 'Whether the Tidings buff is active, used to add yield when Boon triggers.',
        nextSuccessBonus: 'Success-rate bonus that applies only to the next gather.',
        nextYieldBonus: 'Yield bonus that applies only to the next gather.',
        wiseReady: 'Whether Wise to the World is available after a durability restore.'
      },
      optimalityMethod: 'For each state, the solver exhaustively evaluates every legal action branch and the direct gather branch, then memoizes the best subproblem result. Within the current model, the root state therefore receives the globally best expected value.',
      tieBreaker: 'If expected values are equal within epsilon, the solver selects the equivalent action plan that better matches practical casting habits.',
      caveat: 'Optimality holds for the currently modeled regular-gathering skills, GP, integrity, success rate, Boon, Revisit, and Wise to the World probabilities. Collectables, crystal gathering, and manual interruption are not included.'
    }
  },
  collectableObjective: {
    kicker: 'Recommendation weights',
    title: 'Scoring Preference',
    close: 'Close scoring preference',
    intro: 'Weights turn each collectable result into a score. The solver ranks strategies by that score; a higher weight means you want the recommendation to lean harder toward that tier.',
    solverIntro: 'Weights turn each collectable result into a score. The solver ranks strategies by that score; a higher weight means you want the recommendation to lean harder toward that tier.',
    analysisIntro: 'Choose the standard you want to use when reading this analysis. Higher weights make that tier count more in the expected, maximum, minimum, and distribution results, so you can compare total scrip, high-tier turn-ins, or your own target.',
    cancel: 'Cancel',
    apply: 'Apply',
    applyCustom: 'Apply custom weights',
    presets: {
      highValue: 'High Tier first',
      midValue: 'Mid Tier first',
      lowValue: 'Low Tier first',
      purpleScrip: 'Purple scrip first',
      orangeScrip: 'Orange scrip first',
      customTier: 'Custom weights'
    },
    presetDescriptions: {
      highValue: 'Strongly prefers the highest tier, with the mid tier as a backup result.',
      midValue: 'Prefers stopping at the middle tier instead of spending too many attempts pushing higher.',
      lowValue: 'Prefers stable low-tier turn-ins for conservative testing.',
      scrip: 'Uses the current reward table and scores by total scrip.',
      customTier: 'Enter your own score for no tier, low, mid, and high tiers.'
    },
    tiers: {
      none: 'No tier',
      low: 'Low Tier',
      mid: 'Mid Tier',
      high: 'High Tier'
    }
  },
  collectableSolver: {
    badge: 'Collectable Tome',
    title: 'Collectable Solver',
    description: 'Brazen and Collector\'s High Standard are excluded; recommendations are ranked by the current scoring preference.',
    solving: 'Calculating collectable policy...',
    empty: 'Solve to show a state-based recommended policy here.',
    stats: {
      scourValue: 'Scour Value'
    },
    actions: {
      solve: 'Solve',
      exportDecisionTree: 'Export Decision Tree',
      exportingDecisionTree: 'Exporting',
      exportedDecisionTree: 'Exported',
      collect: 'Collect',
      scour: 'Scour',
      meticulous: 'Meticulous',
      scrutiny: 'Scrutiny',
      collectorsFocus: "Collector's Focus",
      primingTouch: 'Priming Touch',
      successI: 'Gathering Rate I',
      successII: 'Gathering Rate II',
      successIII: 'Gathering Rate III',
      nextCollectSuccess: 'Next Collect Rate',
      restoreIntegrity: 'Solid Reason / Ageless Words',
      wiseToTheWorld: 'Wise to the World',
      revisitCheck: 'Check Revisit'
    },
    results: {
      kicker: 'Recommended Policy',
      title: 'Recommended Policy',
      subtitle: 'This is not a fixed macro. Follow the policy based on procs and collectability.',
      expectedScore: 'Expected {unit}',
      expectedScripUnit: 'Scoring Unit',
      expectedTierCounts: 'Expected Tier Counts',
      maxTierCounts: 'Max Tier Counts',
      minTierCounts: 'Min Tier Counts',
      pointUnit: 'pts',
      scripUnits: {
        purple: 'Purple Gatherers\' Scrip',
        orange: 'Orange Gatherers\' Scrip',
        unknown: 'Unknown scrip type'
      },
      expectedReward: 'Expected Reward',
      rewardSummary: 'Scrip {scrip} / Gil {gil}',
      summary: {
        expected: 'Total Expected {unit}',
        max: 'Total Maximum {unit}',
        min: 'Total Minimum {unit}'
      },
      maxScore: 'Maximum {unit}',
      minScore: 'Minimum {unit}',
      tierCountUnit: '{tier} count',
      scoreChance: '{chance} chance',
      revisitIncluded: 'Total score includes {chance}% Revisit chance.',
      limitationNote: 'V1 excludes Brazen, Collector\'s High Standard, aetherial reduction reward modeling, and real EXP conversion.'
    },
    policy: {
      now: 'Use Now',
      stateSummary: 'GP {gp} / Integrity {integrity} / Collectability {collectability}',
      nextBranches: 'Possible Branches',
      confirmOutcome: 'Confirm Current Result',
      confirmHint: 'Check and choose each item from the in-game UI.',
      confluentHint: 'These random outcomes converge to the same state, so no extra choice is needed.',
      deterministicHint: 'This action has only one resulting state. Continue to the next step.',
      collectQuestion: 'Did this Collect succeed?',
      standardQuestion: "Did Collector's (High) Standard proc?",
      wiseQuestion: 'Did Wise to the World proc?',
      revisitQuestion: 'Did Revisit trigger after the node was exhausted?',
      collectabilityQuestion: 'What is the current collectability?',
      integrityQuestion: 'How much integrity remains?',
      integrityOption: '{integrity} integrity',
      collectOptions: {
        success: 'Collect succeeded',
        failed: 'Collect failed'
      },
      standardOptions: {
        proc: 'Standard proc',
        noProc: 'No Standard proc'
      },
      wiseOptions: {
        proc: 'Wise proc',
        noProc: 'No Wise proc'
      },
      revisitOptions: {
        proc: 'Revisit triggered',
        noProc: 'No Revisit'
      },
      matchedOutcome: 'Matched Outcome',
      confluentOutcome: 'Converged Outcome',
      deterministicOutcome: 'Fixed Outcome',
      sameOutcome: 'Different proc results enter the same state',
      readyOutcome: 'This action moves into the next state',
      waitingSelection: 'Confirm every question above first.',
      noMatchedOutcome: 'No branch matches these answers. Check the in-game state again.',
      continue: 'Next Step',
      outcomeValue: 'Collectability {value}, integrity {integrity}',
      nextAction: 'Next: {action}',
      terminal: 'Completed',
      back: 'Back',
      root: 'Root'
    },
    branches: {
      applied: 'Applied',
      collectSuccess: 'Collect succeeded',
      collectFailed: 'Collect failed',
      valueNormal: 'No collectability increase',
      valueIncreased: 'Collectability increase',
      meticulousSaved: 'Meticulous saved integrity',
      meticulousConsumed: 'Meticulous consumed integrity',
      integrityConsumed: 'Integrity consumed',
      integrityRestored: 'Integrity restored',
      wiseProc: 'Wise to the World proc',
      wiseNoProc: 'No Wise to the World',
      standardProc: "Collector's Standard proc",
      standardNoProc: "No Collector's Standard",
      revisitProc: 'Revisit triggered',
      revisitNoProc: 'No Revisit'
    },
    conditions: {
      always: 'The action was applied and moves to the next state.',
      collectSuccess: 'Successful Collect receives the current reward tier.',
      collectFailed: 'Failed Collect gives no reward but still consumes integrity.',
      refineOutcome: 'Moves by collectability increase and integrity outcome.',
      integrityRestored: 'Restores 1 integrity, capped by the current node integrity maximum.',
      wiseProc: 'After Solid Reason or Ageless Words restores integrity, there is a 50% chance to gain a free Wise to the World restore.',
      wiseNoProc: 'After Solid Reason or Ageless Words restores integrity, Wise to the World did not proc.',
      standardProc: "Collector's Standard procs after a refine action.",
      standardNoProc: "Collector's Standard does not proc after a refine action.",
      revisitProc: 'When Revisit triggers, GP is fully restored, integrity and attempts are refreshed, and the after-Revisit policy continues.',
      revisitNoProc: 'Revisit did not trigger, so this gathering point ends.'
    },
    errors: {
      unsupportedLevel: {
        title: 'Collectables require level 50',
        desc: 'Your current level is below {level}, so collectable gathering is not unlocked yet. Raise your level before using the collectable tome.'
      },
      unsupportedReward: {
        title: 'Reward table not found',
        desc: 'This item is not in the supported collectable turn-in, custom delivery, Studium, Wachumeqimeqi, reduction, or Cosmic Exploration data yet.'
      },
      memoCapacity: {
        title: 'Not enough memory to finish this solve',
        desc: 'This setup has reached the memory limit available for collectable decisions on this device. Narrow the conditions or use a simpler scenario.',
        raiseBudget: 'Try with more memory',
        manualRisk: 'Using more memory may briefly slow the browser or make this tab stop responding; if the device is short on resources, the system may close the tab.'
      },
      memoAllocationFailed: {
        title: 'Could not start the higher-memory solve',
        desc: 'The browser could not allocate the memory needed for this solve. Narrow the conditions or use a simpler scenario.'
      },
      workerStale: {
        title: 'Solver needs reload',
        desc: 'The site may have updated. Refresh and try again.'
      },
      workerFailed: {
        title: 'Collectable solver could not start',
        desc: 'Please refresh the page and try again.'
      }
    },
    export: {
      title: '{item} Collectable Decision Tree',
      exportedAt: 'Exported At',
      itemId: 'Item ID',
      job: 'Job',
      rootNode: 'Root Node',
      nodeCount: 'Node Count',
      howToReadTitle: 'How To Read',
      howToReadDesc: 'Each node represents a gathering state. Use the recommended action, find the actual in-game outcome under Result Branches, then move to the next node shown by that branch.',
      nodeIndexTitle: 'Node Index',
      node: 'Node',
      state: 'State',
      recommendedAction: 'Recommended Action',
      nodeExpectedScore: 'Node Expected Score',
      resultBranches: 'Result Branches',
      noBranches: 'This node has no further branches.',
      outcome: 'Outcome',
      branchScore: 'Branch Score',
      nextStep: 'Next Step',
      revisitGateSummary: 'Check Revisit: if it triggers ({procProbability}), go to {procNext}; if it does not trigger ({noProcProbability}), end',
      end: 'End',
      stateSummary: 'GP {gp} / Integrity {integrity} / Collectability {collectability}',
      outcomeSummary: 'GP {gp} / Integrity {integrity} / Collectability {collectability}'
    },
    debug: {
      open: 'Open collectable solver debug info',
      close: 'Close debug dialog',
      kicker: 'Collectable Debug',
      title: 'Collectable Formula and Policy Check',
      subtitle: 'Shows formulas, reward table, and search statistics for this solve.',
      formulas: 'Formula Inputs',
      success: 'Collect Success Rate',
      collectableFormula: 'Collectable Formula',
      valueIncreaseRate: 'Collectability Increase Rate',
      relicToolBonus: 'Relic tool bonus',
      meticulousRate: 'Meticulous Save Rate',
      scrutiny: 'Scrutiny',
      standardRate: "Collector's Standard Rate",
      rewardTable: 'Reward Thresholds',
      objective: 'Current Scoring Weights',
      objectivePreset: 'Weight profile',
      objectiveUnit: 'Score unit',
      objectiveNote: 'These weights only rank recommended strategies; higher numbers mean this result matters more for this solve.',
      itemWeight: 'Item {itemId}',
      objectiveKinds: {
        scrip: 'Total scrip',
        exp: 'EXP',
        gil: 'Gil',
        custom: 'Custom reward',
        tierScore: 'Tier weights'
      },
      objectiveUnits: {
        exp: 'EXP',
        gil: 'Gil',
        custom: 'Custom points',
        tierScore: 'points'
      },
      rewardWeights: {
        scrip: 'Scrip',
        exp: 'EXP',
        gil: 'Gil'
      },
      low: 'Low',
      mid: 'Mid',
      high: 'High',
      scripAmount: '{scrip} scrip',
      search: 'Search Stats',
      branchCount: 'Branches',
      primaryPlan: 'Current GP Policy',
      revisitPlan: 'Full GP Revisit Policy',
      limitations: 'V1 Limitations',
      stateKeyIntro: 'These fields are the state snapshot used by the collectable solver for each decision-tree node. A node represents one possible in-game gathering state, and the solver uses these values to choose the next recommended action.',
      stateFields: {
        gp: 'Current remaining GP.',
        integrity: 'Remaining integrity, meaning how many more integrity-spending actions are possible.',
        collectability: 'Current collectability, which affects reward tiers and whether further refining is worthwhile.',
        scrutinyActive: 'Whether Scrutiny is active, affecting the next collectability increase.',
        collectorsFocusActive: 'Whether Collector\'s Focus is active, affecting value increase rate.',
        primingTouchActive: 'Whether Priming Touch is active, affecting Meticulous integrity-save chance.',
        standardActive: 'Whether Collector\'s Standard is active for the related follow-up effect.',
        hasUsedCollectableAction: 'Whether a refine or Collect action has already been used, for state and limitation checks.',
        hasCollected: 'Whether Collect has already been performed, preventing repeated reward collection in the same node.',
        successBonus: 'Total success-rate bonus currently applied to Collect.',
        successIActive: 'Whether the Gathering Rate I style buff is active.',
        successIIActive: 'Whether the Gathering Rate II style buff is active.',
        successIIIActive: 'Whether the Gathering Rate III style buff is active.',
        nextCollectSuccessBonus: 'Success-rate bonus that applies only to the next Collect action.',
        wiseToTheWorldActive: 'Whether Wise to the World is available for a free 1 integrity restore.'
      },
      optimalityNote: 'The solver uses the state fields above for DP policy search: at each state it compares currently supported collectable actions, success-rate buffs, and collect branches. The recommendation is scoped to this model.'
    },
    limitations: {
      'brazen-excluded': 'Brazen is excluded because its random distribution is not confirmed.',
      'high-standard-excluded': "Collector's High Standard is excluded because its proc rate is not confirmed.",
      'reduction-reward-model-excluded': 'Aetherial reduction reward modeling is excluded.'
    }
  },
  collectableStrategyLab: {
    strategyListKicker: 'Strategy List',
    strategyListTitle: 'Rules apply from top to bottom',
    strategyListAria: 'Collectable strategy list',
    addStrategy: 'Add Strategy',
    emptyStrategyTitle: 'No strategies yet',
    emptyStrategyDesc: 'Add the first strategy to expand the decision tree and reveal states that still need a choice.',
    loadSimpleExample: 'Load Simple Example',
    simpleExample: {
      improveName: 'Raise Value',
      collectName: 'Collect'
    },
    treeKicker: 'Decision Tree Coverage',
    treeTitle: 'Current Expanded State',
    loadingBaseValues: 'Loading collectable base values.',
    collectableLevelLockedTitle: 'Collectables are not unlocked yet',
    collectableLevelLockedDesc: 'Collectable gathering requires level {level}. Until then, the lab will not expand a decision tree or run analysis.',
    actionLevelRequirement: 'Requires level {level}',
    ruleLevelIssue: 'This strategy includes a skill your current level {level} has not learned yet. Change the skill or raise the level.',
    strategyLevelIssueTitle: 'This strategy has a skill that cannot be used',
    strategyLevelIssueDesc: '{action} requires level {level}. Open the strategy settings to remove or replace it, or adjust the character level before analysis.',
    limitWarning: 'This strategy expands too widely, so expansion stopped early. Add narrower rules and check again.',
    uncoveredTitle: 'States Awaiting Decisions Overview',
    noUncoveredDesc: 'Every branch can currently continue until integrity reaches zero.',
    pendingOverview: {
      total: '{count} undecided state(s)',
      uniqueValues: '{count} value(s)',
      nodeCount: '{count} node(s)',
      gp: 'GP',
      integrity: 'Integrity',
      collectability: 'Collectability'
    },
    managedOverview: {
      rangesTitle: 'State ranges',
      buffTitle: 'Buff overview',
      collectSuccessRate: 'Collect success rate',
      valueIncreaseRate: 'Value increase rate',
      meticulousSaveRate: 'Meticulous Save Rate',
      someHasBuff: 'Some has {buff}',
      allHasBuff: 'All has {buff}'
    },
    previousUncovered: 'Previous undecided state',
    nextUncovered: 'Next undecided state',
    nodePager: '{current} / {total}',
    pendingState: 'Undecided State',
    noBuff: 'No Buff',
    pathTitle: 'Previous Path',
    noPath: 'No previous path yet.',
    defaultRuleName: 'Strategy {index}',
    coverageNodes: '{count} node(s)',
    noConditions: 'No conditions',
    booleanCondition: '{label}: {value}',
    branchJoiner: ' / ',
    pathStep: '{action}: {branch}',
    pathStepWithRule: '{rule} -> {action}: {branch}',
    joiners: {
      all: ', ',
      any: ' or '
    },
    booleanValues: {
      true: 'Yes',
      false: 'No'
    },
    summary: {
      totalNodes: 'Total',
      decidedNodes: 'Decided',
      uncoveredNodes: 'Open',
      terminalNodes: 'Completed'
    },
    nodeStatuses: {
      decided: 'Managed',
      uncovered: 'Needs decision',
      terminal: 'Terminal',
      limited: 'Expansion limited'
    },
    analysis: {
      title: 'Analysis Report',
      subtitle: 'Calculates collectable score, probability distribution, and reward outcomes for the current strategy rules.',
      noRevisitNotice: 'Experiment analysis is scoped to one gathering point and does not include any after-Revisit gathering.',
      run: 'Run Analysis',
      empty: 'Run analysis to evaluate the current strategy.',
      unsupportedReward: 'No supported reward table was found for this collectable, so it cannot be scored yet.',
      summary: 'Summary',
      expectedScore: 'Expected {unit}',
      maxScore: 'Highest {unit}',
      minScore: 'Lowest {unit}',
      distribution: 'Probability distribution',
      distributionScrip: 'Scrip probability distribution',
      distributionWeightedScore: 'Weighted-score probability distribution',
      distributionTierCounts: 'Tier-count probability distribution',
      distributionUnitScrip: 'Distribution unit: {unit}',
      distributionUnitWeightedScore: 'Distribution unit: weighted total score',
      distributionUnitTierCounts: 'Distribution unit: tier item counts',
      weightedScoreUnit: 'weighted total score',
      scoringNote: 'The distribution unit follows the scoring preference: scrip shows scrip totals, tier priorities show item counts, and custom weights show weighted total score.'
    },
    tools: {
      moveUp: 'Move up',
      moveDown: 'Move down',
      edit: 'Edit',
      delete: 'Delete'
    },
    editor: {
      kicker: 'Strategy Settings',
      close: 'Close strategy settings',
      managedNodes: 'Managed Nodes',
      skills: 'Skill Selection',
      conditionSection: 'Strategy Conditions',
      skillSection: 'Select Matching Skills',
      name: 'Strategy Name',
      when: 'When',
      allConditions: 'all conditions',
      anyCondition: 'any condition',
      then: 'match, run',
      actionPreview: 'Strategy skill preview',
      viewManagedNodes: 'View Managed Nodes',
      summaryMode: 'Summary',
      individualMode: 'Individual',
      managedNodesNotice: "Shows only undecided states that match this rule before it is applied; outcomes from this rule's skills are not included.",
      noManagedNodes: 'This strategy does not manage any nodes yet.',
      effectPreview: 'Value Changes',
      effectPreviewDescription: 'Based on expanded strategy nodes, this shows the possible one-use change range for each action when this strategy applies.',
      effectPreviewNoNodes: 'This strategy does not apply to any nodes yet, so no change range can be calculated.',
      effectPreviewCastableNodes: 'Castable nodes: {count}',
      effectPreviewUnavailable: 'This action will not be cast in the currently expanded nodes.',
      appliedStateRange: 'Post-Apply Node State Range',
      appliedStateRangeDescription: 'Only counts nodes currently managed by this strategy, then repeats this strategy until the state is no longer managed or the branch ends.',
      appliedCompleteBranches: 'Complete: {complete}/{total} branches',
      appliedAllComplete: 'All branches have ended.',
      effectMetrics: {
        collectabilityGain: 'Collectability {range}',
        integrityDelta: 'Integrity {range}',
        scrutinyBonus: 'Refine value bonus {value}',
        valueIncreaseRate: 'Value-increase rate {from} → {to} ({delta}, ×1.75)',
        meticulousSaveRate: 'Meticulous integrity-save rate {from} → {to} ({delta})',
        collectSuccessBonus: 'Collect success rate {value}',
        nextCollectSuccessBonus: 'Next collect success rate {value}',
        collectSuccessRate: 'Collect success rate {range}',
        collectSuccessGp: 'GP on success {range}'
      },
      backToMain: 'Back',
      save: 'Save',
      removeCondition: 'Remove condition',
      addCondition: 'Add Condition',
      actionChain: 'Action Chain',
      singleAction: 'Single Action',
      appendAction: 'Add Action',
      removeLastAction: 'Remove Action',
      done: 'Done'
    },
    fields: {
      gp: 'GP',
      integrity: 'Integrity',
      collectability: 'Collectability',
      scrutinyActive: 'Scrutiny',
      collectorsFocusActive: "Collector's Focus",
      primingTouchActive: 'Priming Touch',
      standardActive: "Collector's Standard",
      hasUsedCollectableAction: 'Used collectable action',
      hasCollected: 'Collected already',
      successBonus: 'Collect success bonus',
      successIActive: 'Gathering Rate I',
      successIIActive: 'Gathering Rate II',
      successIIIActive: 'Gathering Rate III',
      nextCollectSuccessBonus: 'Next collect success bonus',
      wiseToTheWorldActive: 'Wise to the World'
    },
    fieldDescriptions: {
      collectability: 'Current collectability. Use it to decide whether to keep refining or start collecting after a target tier is reached.',
      integrity: 'Current remaining integrity. Use it to decide whether to finish, keep refining, or restore integrity first.',
      gp: 'Current remaining GP. Use it to gate GP-cost actions such as Scrutiny, Collector\'s Focus, Priming Touch, and integrity recovery.',
      scrutinyActive: 'Whether Scrutiny is active. It strengthens the next refine action, then is consumed.',
      collectorsFocusActive: 'Whether Collector\'s Focus is active. It raises the value-increase chance for the next refine action, then is consumed.',
      primingTouchActive: 'Whether Priming Touch is active. It only affects the next Meticulous integrity-save chance.',
      standardActive: 'Whether Collector\'s Standard is active. Use it to route Standard branches toward Meticulous or another high-tier choice.',
      wiseToTheWorldActive: 'Whether Wise to the World is available. Usually used to immediately restore 1 integrity for free after it procs.',
      successIActive: 'Whether Gathering Rate I has been applied. Use it to avoid repeating the same success-rate buff tier.',
      successIIActive: 'Whether Gathering Rate II has been applied. Use it to avoid repeating the same success-rate buff tier.',
      successIIIActive: 'Whether Gathering Rate III has been applied. Use it to avoid repeating the same success-rate buff tier.',
      successBonus: 'The node-wide collect success bonus currently accumulated from Gathering Rate I/II/III.',
      nextCollectSuccessBonus: 'The success bonus for only the next Collect action. It is consumed after one Collect attempt.',
      hasUsedCollectableAction: 'Whether any refine or Collect action has been used. Mostly a flow flag for advanced branches or debugging.',
      hasCollected: 'Whether Collect has already been pressed. Mostly useful for advanced finish rules before or after collecting.'
    },
    nodeState: 'GP {gp} / Integrity {integrity} / Collectability {collectability}',
    chips: {
      scrutinyActive: 'Scrutiny',
      collectorsFocusActive: "Collector's Focus",
      primingTouchActive: 'Priming Touch',
      standardActive: "Collector's Standard",
      wiseToTheWorldActive: 'Wise to the World',
      successBonus: 'Success +{value}',
      nextCollectSuccessBonus: 'Next +{value}',
      hasUsedCollectableAction: 'Started',
      hasCollected: 'Collected'
    }
  },
  tomeLibrary: {
    title: 'Tome Library',
    subtitle: 'Manage saved gathering tomes, search by item, and load a setup back into the solver.',
    searchPlaceholder: 'Search tome or item names',
    noFood: 'No food',
    unknownDate: 'Unknown time',
    rotationPreview: 'Best rotation preview',
    startFromAction: 'Start with {action}',
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
    },
    editModeConflict: {
      kicker: 'Solver mode mismatch',
      title: 'Which mode should open the solver?',
      desc: 'This tome uses "{tomeMode}", while Settings currently uses "{currentMode}". You can overwrite the Settings mode, or keep the current mode for this edit.',
      useTomeMode: 'Overwrite Settings',
      useCurrentMode: 'Keep Current Mode',
      cancel: 'Cancel'
    }
  },
  gearProfiles: {
    title: 'Gear Stat Profile Settings',
    description: 'Save commonly used gatherer stats as profiles, then load them one-way when solving or simulating.',
    back: 'Back',
    listTitle: 'Profiles',
    unnamed: 'Unnamed Profile',
    defaultBadge: 'Default',
    loadProfile: 'Load Profile',
    relicShort: 'Relic',
    defaults: {
      miner: 'Default Miner',
      botanist: 'Default Botanist'
    },
    jobs: {
      universal: 'Miner / Botanist'
    },
    actions: {
      add: 'Add',
      save: 'Save Profile',
      saved: 'Saved',
      delete: 'Delete Profile'
    },
    editor: {
      newTitle: 'New Profile',
      editTitle: 'Edit Profile',
      defaultLocked: 'Default profiles cannot be deleted and their job type is fixed.',
      name: 'Profile Name',
      namePlaceholder: 'Example: pentamelded gatherer set',
      jobs: 'Applicable Jobs',
      currentGp: 'Current GP',
      maxGp: 'Equipment GP Cap',
      relic: 'Relic Tool Effect',
      relicDesc: 'Only affects collectable value increase in the collectable system.'
    },
    picker: {
      title: 'Load Gear Profile',
      description: 'Only profiles that apply to the current item job are shown.',
      empty: 'No profile can be applied to this job yet.',
      manage: 'Manage Profiles'
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
