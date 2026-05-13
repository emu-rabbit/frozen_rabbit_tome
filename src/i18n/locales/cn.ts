export default {
  app: {
    title: '冷冻兔肉的秘籍',
    subtitle: '兔肉不私藏的好秘籍',
    description: 'FFXIV 大地使者技能推荐工具'
  },
  common: {
    backToSelection: '返回物品选择',
    displayMode: '显示模式',
    displayModes: {
      compact: '简洁',
      detailed: '详细'
    },
    pending: {
      collectableDesc: '收藏品采集系统目前尚在开发中，敬请期待。',
      crystalDesc: '水晶采集系统目前尚在开发中，敬请期待。'
    }
  },
  saveEntry: {
    nameLabel: '名称',
    cancel: '取消',
    tome: {
      title: '保存秘籍',
      description: '替这份秘籍取一个好认的名字，之后在书库里会更容易分辨。',
      confirm: '保存秘籍'
    },
    experiment: {
      title: '保存实验',
      description: '替这次实验取一个好认的名字，之后在数据库里会更容易分辨。',
      confirm: '保存实验'
    }
  },
  macro: {
    prompts: {
      gatherCount: '请采集 {count} 次',
      conditionalGatherCount: '若理智同兴触发，请采集 {count} 次',
      finalGather: '请采集到底',
      finalConditionalGather: '若理智同兴触发，请采集到底',
      continueAfterSeconds: '{message}，{seconds} 秒后宏将继续'
    },
    preview: {
      kicker: 'FFXIV 采集宏',
      title: '预览采集宏',
      close: '关闭宏预览',
      singleTitle: '宏内容',
      partTitle: '宏 #{index}',
      singleSummary: '这份宏共 {lines} 行，可直接复制到游戏中。',
      splitSummary: '这份宏共 {lines} 行，已依游戏 15 行限制拆成 {count} 份。',
      groupSummary: '这次包含 {count} 组宏，共 {lines} 行，可分别复制到游戏中。',
      lineCount: '{count} / 15 行',
      copySingle: '复制宏',
      copyPart: '复制 #{index}',
      copyStates: {
        copied: '已复制',
        failed: '复制失败'
      }
    }
  },
  nav: {
    createGuide: '创建新秘籍',
    solver: '秘籍求解器',
    createExperiment: '创建新实验',
    tomeLibrary: '秘籍藏书库',
    experimentDatabase: '实验数据库',
    faq: '常见问题',
    settings: '设置页面',
    github: 'GitHub 项目',
    sponsor: '赞助冷冻库电费'
  },
  faq: {
    title: '常见问题',
    description: '整理秘籍目前支持范围与使用前最容易想确认的细节。',
    items: [
      {
        q: '请问本项目使用的技能组和物品是几版的？',
        a: '本项目的技能组与物品适用 Final Fantasy XIV 版本 7.5 的内容。'
      },
      {
        q: '本网站求解器输出的是最佳解吗？',
        a: '本网站会依照大部分情况与您选择的目标，输出最推荐的技能手法。不过每种技能手法都有各自的优缺点，就像不同玩法流派一样，不一定存在最完美的答案。如果想要深入分析，强烈建议前往本网站的实验区域进行模拟与分析。'
      },
      {
        q: '可以说说求解器是怎么运作的吗？',
        a: '求解器会展开所有可能的技能施放分支，并依照您设定好的目标替每个分支评分。最后，它会从最高分的技能手法中，再挑出同分时最符合玩家施放习惯的顺序作为推荐解答。'
      },
      {
        q: '宏为什么说是半自动的？',
        a: '因为采集动作必须由使用者点击游戏画面中的菜单完成，所以很抱歉，宏不能完全替您完成整份采集工作。另外，收藏品系统也不支持宏，因为它需要您依照画面上的实际情况判断下一步要采取的行动。'
      },
      {
        q: '为什么要把兔肉冷冻起来，可以烤来吃吗？',
        a: '不可以'
      }
    ]
  },
  createGuide: {
    title: '请选择待采集物品',
    description: '在这里搜索并选择物品，以进入求解台计算推荐采集手法。',
    dataScope: '仅显示「采矿工」与「园艺工」可采集的物品',
    searchPlaceholder: '输入物品名称，倘若搜索不到可以尝试使用英文',
    loading: '数据加载中，请稍候…',
    noResults: '未找到相符的物品，请尝试使用英文搜索',
    typeToSearch: '请输入物品名称开始搜索',
    resultCount: '{count}{plus} 笔结果',
    glv: 'Glv',
    noTranslation: '(无官方翻译)',
    collectableSystem: '收藏品系统',
    crystalGatheringSystem: '水晶采集系统',
    regularSystem: '一般采集系统',
    apiError: '无法连接至 XIVAPI 获取收藏品数据。请检查网络连接或稍后再试。',
    retrySearch: '重试搜索'
  },
  createExperiment: {
    title: '请选择待采集物品',
    description: '在这里搜索并选择物品，以进入模拟台进行实验与分析。',
    dataScope: '仅显示「采矿工」与「园艺工」可采集的物品'
  },
  simulator: {
    noItemTitle: '尚未选择实验物品',
    noItemDesc: '请先建立实验并选择一个一般采集物品。',
    goToCreate: '前往创建实验',
    collectablePending: '收藏品采集系统之后才动工。',
    crystalPending: '水晶采集系统之后才动工。',
    statsTitle: '实验数值',
    perceptionWarning: '鉴别力不达标，无法采集此物品。',
    integrity: '耐久',
    tabsLabel: '采集手法分页',
    clearRotation: '清空{name}',
    rotationSimulation: '指定手法模拟',
    copyPrimaryRotation: '复制一般手法',
    primaryGathering: '一般采集',
    revisitGathering: '再起后采集',
    emptyPrimaryRotation: '点下方技能开始建立手法。',
    emptyRevisitRotation: '耐久归零后可建立再起触发时的第二段手法。',
    removeFromHere: '移除此技能与后方技能',
    rotationIssueTitle: '手法串目前有无法施展的技能',
    rotationIssueDesc: '请检查被标红的技能，可能是等级、GP、耐久或前置条件在目前数值下不成立。',
    primaryRotationAnalysis: '一般采集手法',
    revisitRotationAnalysis: '再起后手法',
    rates: {
      success: '采集成功率',
      boon: '额外采集率',
      currentGp: '目前 GP'
    },
    actions: {
      simulate: '进行分析',
      save: '保存实验',
      saved: '已保存',
      copyReport: '复制报告',
      copied: '已复制'
    },
    analysis: {
      title: '分析报告',
      subtitle: '根据设定手法计算之期望结果',
      empty: '点击上方按钮开始进行分析',
      summary: '总结',
      expectedYield: '期望获得量',
      maxYield: '最大获得量',
      minYield: '最小获得量',
      chance: '概率 {chance}%',
      revisitNote: '已纳入再起 {chance}% 概率。'
    },
    actionCategories: {
      gather: '采集动作',
      success: '获得率提高',
      boon: '额外采集率提高',
      nextSuccess: '下一次获得率提高',
      nextYield: '下一次获得量提高',
      restore: '恢复耐久',
      wholeYield: '整点获得量提高',
      boonYield: '额外采集获得数提高'
    }
  },
  experimentDatabase: {
    title: '实验数据库',
    subtitle: '管理已保存的一般采集实验，之后可以载回模拟台重新分析。',
    searchPlaceholder: '搜索实验名称或物品名称',
    emptyTitle: '实验数据库目前是空的',
    emptyDesc: '在模拟台完成分析后，按下“保存实验”就会收进这里。',
    emptySearchTitle: '找不到相符的实验',
    emptySearchDesc: '可以改用当前语言名称或英文名称搜索看看。',
    unknownDate: '未知时间',
    regularExperiment: '一般采集实验',
    countValue: '{count} 个',
    createdAt: '建立于 {time}',
    rows: {
      playerStats: '玩家数值',
      gpState: 'GP 状态',
      nodeBonuses: '节点奖励',
      totalExpected: '总期望',
      maxMin: '最大 / 最小'
    },
    rotations: {
      primary: '一般采集',
      revisit: '再起后采集'
    },
    actions: {
      edit: '编辑',
      copyReport: '复制报告',
      copied: '已复制',
      delete: '删除实验'
    }
  },
  settings: {
    title: '秘籍设定',
    description: '调整秘籍的各项偏好设定',
    appearanceTitle: '外观设定',
    appearanceDesc: '调整秘籍的视觉风格',
    darkMode: '深色模式',
    darkModeDesc: '开启深色模式，适合在昏暗环境下使用',
    language: '语言版本',
    languageDesc: '本网站的显示语言，缺乏翻译的情况下将显示英文',
    langOptions: {
      tw: '繁體中文',
      en: 'English',
      ja: '日本語',
      cn: '简体中文'
    },
    aboutTitle: '关于本项目',
    aboutDesc: '这是"冷冻兔肉的秘籍"，专为 FFXIV 采集玩家设计的工具箱。',
    statsTitle: '玩家装备数值',
    statsDesc: '请填入你在游戏中真实的装备数值，以便获得更精确的演算建议。',
    macroTitle: '采集宏',
    macroDesc: '调整宏提醒玩家手动采集时的等待时间。默认每个物品 4 秒，外加 2 秒缓冲。',
    macroSecondsPerGather: '每个物品等待',
    macroBufferSeconds: '额外缓冲',
    solverModeTitle: '求解目标模式',
    solverModeDesc: '选择求解器评分手法时最在意的目标。',
    solverModes: {
      expected: '平凡人模式',
      max: '天选人模式',
      min: '保守人模式'
    },
    solverModeDetails: {
      expected: '使用期望值评分，是目前网站原本的稳健模式。',
      max: '只看手法可达到的最高获得量，概率不会进入评分。',
      min: '只看手法最差情况下的最低获得量，适合想要保底的采集规划。'
    },
    debugTitle: '专家调试模式',
    debugDesc: '开启后，求解结果会提供公式、概率分布与最优性检查信息。',
    solverDebugMode: '显示求解器调试信息',
    solverDebugModeDesc: '适合验证 rotation、期望值与搜索过程；一般采集时可保持关闭。',
  },
  solver: {
    title: '秘籍求解器',
    statsTitle: '当前采集环境数值',
    currentGp: '演算开始 GP',
    effectiveMaxGp: '食物后满 GP',
    maxGp: '装备最大 GP',
    noItemTitle: '未选择物品',
    noItemDesc: '请先通过「建立秘籍」搜寻并选择一个采集物品。',
    goToCreate: '前往建立秘籍',
    collectableWarning: '收藏品系统仍在施工中',
    crystalGatheringWarning: '水晶采集系统仍在施工中',
    syncToSettings: '保存{job}设置',
    syncSuccess: '已保存设置',
    food: {
      label: '食物',
      placeholder: '搜索食物',
      nq: 'NQ',
      hq: 'HQ',
      max: '上限'
    },
    results: {
      gatheringRate: '基础采集成功率',
      boonRate: '基础额外采集率'
    },
    nodeBonusesTitle: '采集点数值',
    nodeBonuses: {
      baseIntegrity: '节点基礎耐久',
      gatheringCount: '采集次数增加',
      yieldCount: '获得数增加',
      extraRate: '额外率增加',
      collectableRelicToolBonus: '遗物工具效果',
      collectableRelicToolBonusDesc: '收藏品价值提升率 +20%。'
    },
    strategy: {
      title: '推荐采集手法',
      description: '依照目前数值，演算出期望产量最高的手法',
      modeDescriptions: {
        expected: '平凡人模式：依照目前数值，演算出期望产量最高的手法',
        max: '天选人模式：依照目前数值，演算出最高产量最漂亮的手法',
        min: '保守人模式：依照目前数值，演算出最低产量最稳的手法'
      },
      copyMacro: '预览宏',
      copyMacroStates: {
        copied: '已复制',
        partial: '已复制前 15 行',
        failed: '复制失败'
      },
      saveTome: '保存秘籍',
      savedTome: '已保存',
      solve: '求解',
      totalExpectedYield: '总期望产量',
      summary: {
        expected: '总期望产量',
        max: '总最高产量',
        min: '总最低产量'
      },
      expectedYield: '期望总产量',
      maxYield: '最高产量',
      minYield: '最低产量',
      yieldChance: '概率 {chance}%',
      chanceWithRevisit: '含再起可能：{chance}% 概率',
      rotationOrder: '手法顺序',
      primaryRotation: '原采集手法',
      revisitRotation: '再起触发后手法',
      revisitBadge: '再起触发',
      rotationTitles: {
        primary: '采集手法',
        primaryWithRevisit: '采集手法（再起也是相同手法）',
        revisit: '采集手法（再起触发后）'
      },
      revisitSameRotationNote: {
        expected: '总期望值已纳入再起概率。',
        max: '最高值与概率已纳入再起可能。',
        min: '最低值与概率已纳入再起可能。'
      },
      revisitTotalNote: {
        expected: '总期望值已纳入再起概率。',
        max: '最高值与概率已纳入再起后手法。',
        min: '最低值与概率已纳入再起后手法。'
      },
      empty: '点击上方按钮开始计算推荐手法',
      workerErrors: {
        reload: '重新整理',
        workerStale: {
          title: '求解器需要重新加载',
          desc: '网站可能刚更新完成，旧页面载不到新的演算资源。按下重新整理后就能继续使用。'
        },
        workerFailed: {
          title: '求解器暂时无法启动',
          desc: '请重新整理页面后再试一次；若仍然发生，可能需要稍后再回来。'
        }
      },
      gatherAction: '采集',
      conditionalSuffix: '（若触发）',
      conditionalGatherSuffix: '（同兴触发）'
    },
    debug: {
      open: '查看求解器调试信息',
      close: '关闭调试窗口',
      kicker: 'Solver Debug',
      title: '期望值与最优性验证',
      subtitle: '这里列出本次求解使用的公式、outcome 分布与动态规划搜索统计。',
      formulas: '公式输入',
      successFormula: '采集成功率',
      successScoreFormula: '成功率分数 = floor(100 * {gathering} / {baseGathering}) = {score}',
      rawSuccess: '分段函数基础值',
      levelModifier: '等级修正',
      levelDifference: '等级差',
      finalSuccess: '最终成功率',
      boonFormula: '额外采集率',
      boonScoreFormula: '额外率分数 = min(150, floor(100 * {perception} / {basePerception})) = {score}',
      finalBoon: '最终 Boon 概率',
      bountifulFormula: '高产 / 丰收',
      plusTwoThreshold: '+2 门槛',
      plusThreeThreshold: '+3 门槛',
      bountifulAmount: '本次技能加成',
      gatherFormula: '单次采集状态',
      integrity: '耐久',
      nodeYieldBonus: '节点获得数',
      nodeBoonBonus: '节点额外率',
      gpRecovered: '每次采集回复',
      expectedValue: '总期望值',
      revisitChance: '再起概率',
      plans: '手法分支',
      primaryPlan: '原采集手法',
      revisitPlan: '再起触发后手法',
      startingGp: '起始 GP',
      minYield: '最小',
      maxYield: '最大',
      workerCalculationTime: 'Worker 运算时间',
      statesSolved: '实际求解状态',
      memoHits: '缓存命中数',
      memoHitRate: '缓存命中率',
      actionsEvaluated: '实际评估选项',
      candidateComparisons: '候选比较数',
      branchCount: '分支总数',
      terminalStates: '终端状态',
      outcomeDistribution: '概率分布表',
      optimality: '节点状态列举与最优性说明',
      stateKeyIntro: '下列字段是一般采集求解器识别“每个搜索节点状态”时会记录的内容。只要这些值相同，就会视为同一个子问题并复用已算好的结果。',
      stateFields: {
        gp: '当前剩余 GP。',
        integrity: '当前采集点剩余耐久，也就是还能执行几次采集或消耗耐久的动作。',
        hasGathered: '是否已经在这个节点采集过，用来判断部分技能是否仍可施放。',
        successBonus: '当前已套用在所有采集上的成功率加成总和。',
        successIActive: '获得率提高 I 类技能是否已启用，避免同一类效果重复计算。',
        successIIActive: '获得率提高 II 类技能是否已启用。',
        successIIIActive: '获得率提高 III 类技能是否已启用。',
        boonBonus: '当前已套用的额外采集率加成总和。',
        giftIActive: '额外采集率提高 I 类技能是否已启用。',
        giftIIActive: '额外采集率提高 II 类技能是否已启用。',
        allYieldBonus: '整个采集点都会增加的获得数加成。',
        tidings: '纳尔札尔福音 / 诺菲卡福音是否启用，用来计算额外采集触发时的获得数。',
        nextSuccessBonus: '只影响下一次采集的成功率加成。',
        nextYieldBonus: '只影响下一次采集的获得数加成。',
        wiseReady: '理智同兴是否可用，代表耐久恢复技能后可能取得的免费恢复机会。'
      },
      optimalityMethod: '求解器会对每个状态穷举可施放技能与直接采集分支，使用 memoization 保存子问题最佳解；因此在目前模型内，根状态取得的就是全局最佳期望值。',
      tieBreaker: '若期望值在 epsilon 内相同，使用 rotationPreferenceScore 选择更符合施放习惯的等价手法。',
      caveat: '最优性成立于目前建模的普通采集技能、GP、耐久、成功率、Boon、再起与理智同兴概率；未纳入收藏品、水晶采集与玩家手动中断。'
    }
  },
  collectableSolver: {
    badge: '收藏品秘籍',
    title: '收藏品求解台',
    description: '算法未纳入大胆提炼、强化洞察，以大地紫橘票获得量为评分依据。',
    solving: '正在推算收藏品推荐策略...',
    empty: '点击求解后，这里会显示可依状态判断的推荐策略。',
    stats: { scourValue: '提炼基础值' },
    actions: {
      solve: '求解',
      exportDecisionTree: '导出决策树',
      exportingDecisionTree: '导出中',
      exportedDecisionTree: '已导出',
      collect: '收藏品采集',
      scour: '提炼',
      meticulous: '慎重提炼',
      scrutiny: '集中检查',
      collectorsFocus: '价值瞩目',
      primingTouch: '预备碰触',
      successI: '获得率提高 I',
      successII: '获得率提高 II',
      successIII: '获得率提高 III',
      nextCollectSuccess: '下次收藏成功率提高',
      restoreIntegrity: '石工之理 / 农夫之智',
      wiseToTheWorld: '理智同兴',
      revisitCheck: '确认再起'
    },
    results: {
      kicker: 'Recommended Policy',
      title: '推荐策略',
      subtitle: '这不是固定宏，而是依照随机结果与收藏价值做判断的策略。',
      expectedScore: '期望{unit}',
      expectedScripUnit: '评分单位',
      scripUnits: {
        purple: '大地紫票',
        orange: '大地橘票',
        unknown: '未知票种'
      },
      expectedReward: '期望收益',
      rewardSummary: '票据 {scrip} / 金币 {gil}',
      summary: {
        expected: '总期望{unit}',
        max: '总最高{unit}',
        min: '总最低{unit}'
      },
      maxScore: '最高{unit}',
      minScore: '最低{unit}',
      scoreChance: '概率 {chance}',
      revisitIncluded: '总分数已纳入再起 {chance}% 概率。',
      limitationNote: '第一版未纳入大胆提炼、强化洞察、精选收益模型与实际经验值换算。'
    },
    policy: {
      now: '现在建议',
      stateSummary: 'GP {gp} / 耐久 {integrity} / 收藏价值 {collectability}',
      nextBranches: '可能分支',
      confirmOutcome: '确认这次结果',
      confirmHint: '请依照游戏画面上的状态逐项确认并选择。',
      confluentHint: '这次的随机结果已汇流到同一个状态，不需要额外选择。',
      deterministicHint: '这次动作会进入唯一结果，可以直接前往下一步。',
      collectQuestion: '这次收藏品采集有成功吗？',
      standardQuestion: '这次有触发(强化)洞察吗？',
      wiseQuestion: '这次有触发理智同兴吗？',
      revisitQuestion: '耐久耗尽后有触发再起吗？',
      collectabilityQuestion: '现在的收藏价值是多少？',
      integrityQuestion: '现在耐久剩多少？',
      integrityOption: '{integrity} 耐久',
      collectOptions: {
        success: '采集成功',
        failed: '采集失败'
      },
      standardOptions: {
        proc: '有触发洞察',
        noProc: '没有触发洞察'
      },
      wiseOptions: {
        proc: '有触发理智同兴',
        noProc: '没有触发理智同兴'
      },
      revisitOptions: {
        proc: '有触发再起',
        noProc: '没有触发再起'
      },
      matchedOutcome: '已对应到',
      confluentOutcome: '结果汇流',
      deterministicOutcome: '确定结果',
      sameOutcome: '不同触发结果会进入相同状态',
      readyOutcome: '此动作完成后进入下一状态',
      waitingSelection: '请先确认上方所有问题。',
      noMatchedOutcome: '目前选项没有对应分支，请再检查一次游戏画面。',
      continue: '下一步',
      outcomeValue: '价值 {value}，耐久 {integrity}',
      nextAction: '下一步：{action}',
      terminal: '此分支已结束',
      back: '上一层',
      root: '回起点'
    },
    branches: {
      applied: '已施放',
      collectSuccess: '采集成功',
      collectFailed: '采集失败',
      valueNormal: '未触发价值提升',
      valueIncreased: '触发价值提升',
      meticulousSaved: '慎重未消耗耐久',
      meticulousConsumed: '慎重消耗耐久',
      integrityConsumed: '消耗耐久',
      integrityRestored: '恢复耐久',
      wiseProc: '触发理智同兴',
      wiseNoProc: '未触发理智同兴',
      standardProc: '触发洞察',
      standardNoProc: '未触发洞察',
      revisitProc: '触发再起',
      revisitNoProc: '未触发再起'
    },
    conditions: {
      always: '此动作成功施放后进入下一状态。',
      collectSuccess: '收藏品采集成功时取得当前档位收益。',
      collectFailed: '收藏品采集失败时不取得收益，但仍消耗耐久。',
      refineOutcome: '依价值提升与耐久消耗结果进入下一状态。',
      integrityRestored: '耐久恢复 1 点，最多不超过此采集点的当前耐久上限。',
      wiseProc: '石工之理或农夫之智恢复耐久后，50% 机率获得可免费恢复 1 点耐久的理智同兴。',
      wiseNoProc: '石工之理或农夫之智恢复耐久后，未获得理智同兴。',
      standardProc: '提炼类动作后触发 Collector\'s Standard / 洞察。',
      standardNoProc: '提炼类动作后未触发 Collector\'s Standard / 洞察。',
      revisitProc: '再起触发时，GP 回满、耐久与采集次数恢复，并接续再起后决策树。',
      revisitNoProc: '再起未触发，本次采集点结束。'
    },
    errors: {
      unsupportedReward: { title: '找不到收藏品奖励表', desc: '此物品目前不在已支持的收藏品缴纳、老主顾、魔法大学或万货街资料中，暂时无法求解。' },
      workerStale: { title: '求解器需要重新载入', desc: '网站可能刚更新完成，刷新后即可继续。' },
      workerFailed: { title: '收藏品求解器暂时无法启动', desc: '请刷新页面后再试一次。' }
    },
    export: {
      title: '{item} 收藏品决策树',
      exportedAt: '导出时间',
      itemId: '物品 ID',
      job: '职业',
      rootNode: '起始节点',
      nodeCount: '节点数',
      howToReadTitle: '阅读方式',
      howToReadDesc: '每个节点代表一个采集状态，请依照“建议动作”执行后，在“结果分支”中找到游戏实际发生的结果，再前往该分支标示的下一个节点。',
      nodeIndexTitle: '节点索引',
      node: '节点',
      state: '状态',
      recommendedAction: '建议动作',
      nodeExpectedScore: '节点期望分数',
      resultBranches: '结果分支',
      noBranches: '此节点没有后续分支。',
      outcome: '结果',
      branchScore: '分支分数',
      nextStep: '下一步',
      revisitGateSummary: '确认再起：触发（{procProbability}）前往 {procNext}；未触发（{noProcProbability}）结束',
      end: '结束',
      stateSummary: 'GP {gp} / 耐久 {integrity} / 收藏价值 {collectability}',
      outcomeSummary: 'GP {gp} / 耐久 {integrity} / 收藏价值 {collectability}'
    },
    debug: {
      open: '查看收藏品求解器调试信息',
      close: '关闭调试窗口',
      kicker: 'Collectable Debug',
      title: '收藏品公式与策略验证',
      subtitle: '这里列出本次求解使用的公式、reward table 与搜索统计。',
      formulas: '公式输入',
      success: '收藏品采集成功率',
      collectableFormula: '收藏品公式',
      valueIncreaseRate: '价值提升率',
      relicToolBonus: '遗物工具加算',
      meticulousRate: '慎重不耗率',
      scrutiny: '集中检查',
      standardRate: 'Collector\'s Standard 机率',
      rewardTable: '奖励门槛',
      low: '低标',
      mid: '中标',
      high: '高标',
      scripAmount: '{scrip} 张票',
      search: '搜索统计',
      branchCount: '分支数',
      primaryPlan: '当前 GP 决策树',
      revisitPlan: '再起后满 GP 决策树',
      limitations: '第一版限制',
      stateKeyIntro: '下列字段是收藏品求解器识别“每个决策树节点状态”时会记录的内容。节点代表你在游戏画面上可能看到的一个采集状态，求解器会根据这些值决定下一步推荐动作。',
      stateFields: {
        gp: '当前剩余 GP。',
        integrity: '当前剩余耐久，也就是还能承受几次消耗耐久的动作。',
        collectability: '当前收藏价值，会影响交付档位与后续是否值得继续提炼。',
        scrutinyActive: '集中检查是否启用，会影响下一次提炼类动作的收藏价值提升。',
        collectorsFocusActive: '价值瞩目是否启用，会影响价值提升率。',
        primingTouchActive: '预备碰触是否启用，会影响慎重提炼不消耗耐久的概率。',
        standardActive: 'Collector\'s Standard / 洞察是否启用，代表可使用对应的后续效果。',
        hasUsedCollectableAction: '是否已使用过提炼或收藏品采集动作，用来判断部分状态与限制。',
        hasCollected: '是否已经执行过收藏品采集，避免同一个节点重复收取收益。',
        successBonus: '当前已套用在收藏品采集上的成功率加成总和。',
        successIActive: '获得率提高 I 类技能是否已启用。',
        successIIActive: '获得率提高 II 类技能是否已启用。',
        successIIIActive: '获得率提高 III 类技能是否已启用。',
        nextCollectSuccessBonus: '只影响下一次收藏品采集的成功率加成。',
        wiseToTheWorldActive: '理智同兴是否可用，代表可免费恢复 1 点耐久。'
      },
      optimalityNote: '求解器会用上述节点状态列举进行 DP policy search：在每个状态比较目前支持的收藏品技能、成功率补强技能与收取分支，推荐成立于当前模型内。'
    },
    limitations: {
      'brazen-excluded': '未纳入大胆提炼，因随机分布尚未确认。',
      'high-standard-excluded': '未纳入强化洞察，因触发机率尚未确认。',
      'reduction-reward-model-excluded': '未纳入精选收益模型。'
    }
  },
  tomeLibrary: {
    title: '秘籍书库',
    subtitle: '管理已保存的采集秘籍，搜索物品后即可快速载回求解器调整。',
    searchPlaceholder: '搜索秘籍名称或物品名称',
    noFood: '未使用食物',
    unknownDate: '未知时间',
    rotationPreview: '最佳手法预览',
    startFromAction: '从 {action} 开始',
    createdAt: '创建于 {time}',
    emptyTitle: '书库目前是空的',
    emptyDesc: '在秘籍求解器演算出手法后，按下“保存秘籍”就会收进这里。',
    emptySearchTitle: '找不到相符的秘籍',
    emptySearchDesc: '可以改用当前语言名称或英文名称搜索看看。',
    rows: {
      playerStats: '玩家数值',
      gpState: 'GP 状态',
      food: '食物',
      nodeBonuses: '矿脉奖励',
      objectiveMode: '求解模式'
    },
    actions: {
      edit: '编辑',
      copyMacro: '预览宏',
      copyMacroStates: {
        copied: '已复制',
        partial: '已复制前 15 行',
        failed: '复制失败'
      },
      delete: '删除秘籍'
    },
    editModeConflict: {
      kicker: '求解模式不同',
      title: '要用哪一种人格进入求解台？',
      desc: '这张秘籍使用“{tomeMode}”，当前设置页是“{currentMode}”。你可以覆盖设置页的人格，也可以保留现有设置进入。',
      useTomeMode: '覆盖为秘籍模式',
      useCurrentMode: '保留现有模式',
      cancel: '取消'
    }
  },
  game: {
    jobs: {
      miner: '采矿工',
      botanist: '园艺工'
    },
    stats: {
      level: '等级',
      gathering: '获得力',
      perception: '鉴别力',
      gp: 'GP'
    },
    units: {
      times: '次',
      count: '个',
      percent: '%',
      secondsSuffix: ' 秒'
    }
  },
  welcomeModal: {
    title: '欢迎来到秘籍',
    subtitle: '在你开始之前，请先选择你偏好的语言',
    description: '这将会调整整个秘籍的界面语言。你之后随时可以在"设置"中更改。',
    confirm: '就用这个语言开始吧！'
  },
  sponsorModal: {
    title: '支持冷冻兔肉的秘籍',
    description: '感謝您的支持！由於部分支付平台在台灣存在區域限制，建議台灣玩家優先使用「台灣地區」，海外玩家建議使用「全球地區」。如有任何問題，請聯繫：{email}',
    twProvider: '台湾地区 (绿界科技)',
    twDesc: '支持超商、ATM 与本地信用卡。',
    globalProvider: '全球地区 (Ko-fi / PayPal)',
    globalDesc: '适合海外玩家，支援信用卡与 PayPal，且具备 Discord 自动身分组整合。'
  }
}
