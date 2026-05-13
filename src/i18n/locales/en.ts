export default {
  app: {
    title: 'Frozen Rabbit Tome',
    subtitle: 'Secret gathering tips from the rabbit',
    description: 'FFXIV Gatherer skill recommendation tool'
  },
  common: {
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
  faq: {
    title: 'FAQ',
    description: 'Quick notes about the Tome support scope and the details worth checking before use.',
    items: [
      {
        q: 'Which patch are the supported actions and items based on?',
        a: 'The supported actions and items are based on Final Fantasy XIV Patch 7.5 content.'
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
        q: 'Why are macros described as semi-automatic?',
        a: 'Gathering itself still requires the player to click the in-game gathering menu, so unfortunately a macro cannot complete the entire gathering session for you. Collectable gathering also does not support macros because it depends on judging the current on-screen state and choosing the next action accordingly.'
      },
      {
        q: 'Why freeze the rabbit? Can I roast it instead?',
        a: 'No.'
      }
    ]
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
    subtitle: 'Manage saved regular gathering experiments and load them back into the simulator for analysis.',
    searchPlaceholder: 'Search experiment or item names',
    emptyTitle: 'Your experiment database is empty',
    emptyDesc: 'After analyzing a setup in the simulator, press "Save Experiment" to keep it here.',
    emptySearchTitle: 'No matching experiments',
    emptySearchDesc: 'Try searching by the current language name or the English item name.',
    unknownDate: 'Unknown time',
    regularExperiment: 'Regular gathering experiment',
    countValue: '{count} item(s)',
    createdAt: 'Created at {time}',
    rows: {
      playerStats: 'Player Stats',
      gpState: 'GP State',
      nodeBonuses: 'Node Bonuses',
      totalExpected: 'Total Expected',
      maxMin: 'Max / Min'
    },
    rotations: {
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
      workerCalculationTime: 'Worker compute time',
      statesSolved: 'Computed states',
      memoHits: 'Cache hits',
      memoHitRate: 'Cache hit rate',
      actionsEvaluated: 'Evaluated options',
      candidateComparisons: 'Candidate comparisons',
      branchCount: 'Total branches',
      terminalStates: 'Terminal states',
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
      tieBreaker: 'If expected values are equal within epsilon, rotationPreferenceScore selects the equivalent rotation that better matches practical casting habits.',
      caveat: 'Optimality holds for the currently modeled regular-gathering skills, GP, integrity, success rate, Boon, Revisit, and Wise to the World probabilities. Collectables, crystal gathering, and manual interruption are not included.'
    }
  },
  collectableSolver: {
    badge: 'Collectable Tome',
    title: 'Collectable Solver',
    description: 'Brazen and Collector\'s High Standard are excluded; scoring uses expected purple/orange gatherers\' scrip.',
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
      outcomeValue: 'Value {value}, integrity {integrity}',
      nextAction: 'Next: {action}',
      terminal: 'This branch ends here',
      back: 'Back',
      root: 'Root'
    },
    branches: {
      applied: 'Applied',
      collectSuccess: 'Collect succeeded',
      collectFailed: 'Collect failed',
      valueNormal: 'No value increase',
      valueIncreased: 'Value increase',
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
      refineOutcome: 'Moves by value increase and integrity outcome.',
      integrityRestored: 'Restores 1 integrity, capped by the current node integrity maximum.',
      wiseProc: 'After Solid Reason or Ageless Words restores integrity, there is a 50% chance to gain a free Wise to the World restore.',
      wiseNoProc: 'After Solid Reason or Ageless Words restores integrity, Wise to the World did not proc.',
      standardProc: "Collector's Standard procs after a refine action.",
      standardNoProc: "Collector's Standard does not proc after a refine action.",
      revisitProc: 'When Revisit triggers, GP is fully restored, integrity and attempts are refreshed, and the after-Revisit policy continues.',
      revisitNoProc: 'Revisit did not trigger, so this gathering point ends.'
    },
    errors: {
      unsupportedReward: {
        title: 'Reward table not found',
        desc: 'This item is not in the supported collectable turn-in, custom delivery, Studium, or Wachumeqimeqi data yet.'
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
      valueIncreaseRate: 'Value Increase Rate',
      meticulousRate: 'Meticulous Save Rate',
      scrutiny: 'Scrutiny',
      standardRate: "Collector's Standard Rate",
      rewardTable: 'Reward Thresholds',
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
        scrutinyActive: 'Whether Scrutiny is active, affecting the next collectable refine action.',
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
      desc: 'This guide uses "{tomeMode}", while Settings currently uses "{currentMode}". You can overwrite the Settings mode, or keep the current mode for this edit.',
      useTomeMode: 'Overwrite Settings',
      useCurrentMode: 'Keep Current Mode',
      cancel: 'Cancel'
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
