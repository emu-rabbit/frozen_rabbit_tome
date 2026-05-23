export default {
  app: {
    title: '冷冻兔肉的秘籍',
    subtitle: '兔肉不私藏的好秘籍',
    description: 'FFXIV 大地使者技能推荐工具'
  },
  common: {
    cancel: '取消',
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
    favoriteItems: '最爱的物品',
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
        q: '秘籍和实验的差别在哪？',
        a: '秘籍是求解器：您提供装备数值、GP、采集次数、采集点奖励与目标后，系统会在目前支持模型内推算并推荐技能手法。实验则是模拟与分析工具：您除了提供同样的条件，也需要输入想测试的技能串或策略，模拟器会算出结果，分析器会整理奖励落点、概率分布与风险，方便您比较自己的手法。'
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
        q: '为什么不支持水晶类的物品，另外大胆提炼和强化洞察为什么也不在求解器探索范围内呢？',
        a: '因为我们目前尚未知晓大地恩惠、大胆提炼、强化洞察详细的公式和概率分布；另外，大胆提炼也会以非常夸张的方式展开搜索树，造成较高的运算负荷。等到一旦有足够的数据或想法，兔肉也会尽快将它实装进去。'
      },
      {
        q: '宏为什么说是半自动的？',
        a: '因为采集动作必须由使用者点击游戏画面中的菜单完成，所以宏不能完全替您完成整份采集工作。另外，收藏品系统也不支持宏，因为它需要您依照画面上的实际情况判断下一步要采取的行动。'
      },
      {
        q: '最爱物品与藏书库和数据库的差别在哪？',
        a: '可以想象最爱物品只保存物品本身，不会保存玩家的装备数值、采集点奖励、计算出来的采集手法或分析结果；秘籍藏书库和实验数据库则会保存这些内容。最爱物品适合经常使用同一个物品、并会反复调整各项数值的玩家。'
      },
      {
        q: '为什么要把兔肉冷冻起来，可以烤来吃吗？',
        a: '不可以'
      },
      {
        q: '关于网站现在的状态',
        a: '网站现在在超先行测试运行中，很多东西还不是稳定状态，但同时也在搜集各方的意见，有 Bug 或任何意见欢迎前往 <a href="https://github.com/emu-rabbit/frozen_rabbit_tome/issues" target="_blank" rel="noreferrer" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a> 告诉我唷'
      }
    ],
    footer: '还有其他疑问吗？欢迎通过 GitHub 回报或来信联系：{email}'
  },
  createGuide: {
    title: '请选择待采集物品',
    description: '在这里搜索并选择物品，以进入求解台计算推荐采集手法。',
    dataScope: '仅显示「采矿工」与「园艺工」可采集的物品，水晶类物品也暂时不支持',
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
    dataScope: '仅显示「采矿工」与「园艺工」可采集的物品，水晶类物品也暂时不支持'
  },
  favoriteItems: {
    title: '最爱的物品',
    subtitle: '收藏常用采集物品，需要时可以直接前往秘籍或实验。',
    count: '{count} 件',
    addAction: '加入最爱',
    removeAction: '移除最爱',
    emptyTitle: '还没有收藏物品',
    emptyDesc: '在创建秘籍或创建实验的搜索结果中，按下爱心就能加入这里。',
    dialog: {
      kicker: '选择下一步',
      title: '使用 {item}',
      close: '关闭选择窗口',
      guideDesc: '进入求解台计算推荐采集手法',
      experimentDesc: '进入模拟台进行实验与分析'
    },
    filters: {
      open: '筛选最爱物品',
      close: '关闭筛选窗口',
      kicker: '筛选条件',
      title: '筛选最爱物品',
      text: '文字搜索',
      textPlaceholder: '输入物品名称，如果搜索不到可以尝试使用英文',
      glvMin: 'Glv 下限',
      glvMax: 'Glv 上限',
      noLimit: '不限制',
      jobs: '可采集职业',
      systems: '采集系统',
      clear: '清除筛选',
      done: '完成',
      emptyTitle: '没有符合筛选的最爱物品',
      emptyDesc: '可以调整文字、Glv、职业或采集系统筛选。',
      systemOptions: {
        regular: '一般',
        collectable: '收藏品',
        crystal: '水晶'
      }
    }
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
      noRevisitNotice: '实验台以单次采集点为范围，分析结果不包含再起后重新采集的情况。',
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
    subtitle: '管理已保存的一般采集与收藏品实验，之后可以载回模拟台重新分析。',
    searchPlaceholder: '搜索实验名称或物品名称',
    emptyTitle: '实验数据库目前是空的',
    emptyDesc: '在模拟台完成分析后，按下“保存实验”就会收进这里。',
    emptySearchTitle: '找不到相符的实验',
    emptySearchDesc: '可以改用当前语言名称或英文名称搜索看看。',
    unknownDate: '未知时间',
    regularExperiment: '一般采集实验',
    collectableExperiment: '收藏品实验',
    countValue: '{count} 个',
    createdAt: '建立于 {time}',
    rows: {
      playerStats: '玩家数值',
      gpState: 'GP 状态',
      nodeBonuses: '节点奖励',
      totalExpected: '总期望',
      expectedScore: '期望分数',
      maxMin: '最大 / 最小'
    },
    rotations: {
      preview: '手法预览',
      strategyPreview: '策略预览',
      noStrategyPreview: '暂无可预览策略',
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
    about: {
      title: '关于与致谢',
      description: '秘籍背后的采集数据、图标与技术支持',
      teamcraft: 'Teamcraft - 采集物品、收藏品奖励与技能显示数据',
      xivapi: 'XIVAPI - 采集数据表、收藏品判定与图标 API 支持'
    },
    changelogTitle: '系统更新',
    changelogDesc: '了解秘籍的最新功能与版本更新内容',
    changelogLink: '查看秘籍版本更新记录',
    statsTitle: '玩家装备数值',
    statsDesc: '请填入你在游戏中真实的装备数值，以便获得更精确的演算建议。',
    gearProfilesTitle: '装备数值设置档',
    gearProfilesDesc: '预先整理多组采集数值，之后可在求解台或模拟台快速套用。',
    gearProfilesEntryTitle: '管理装备设置档',
    gearProfilesEntryDesc: '设置等级、获得力、鉴别力、GP、食物与收藏品遗物效果。',
    gearProfilesManage: '前往设置',
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
    debugTitle: '专家检查模式',
    debugDesc: '开启后，求解结果会显示公式、概率分布与搜索统计。',
    solverDebugMode: '显示求解器检查信息',
    solverDebugModeDesc: '适合核对技能手法、期望值与搜索过程；一般采集时可保持关闭。',
  },
  changelog: {
    title: '版本更新记录',
    description: '这里记录了秘籍的历史更新与功能迭代。',
    version: '版本 {v}',
    latest: '最新'
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
      boonRate: '基础额外采集率',
      unknown: '未知',
      maxValue: '最高 {value}',
      maxPercent: '最高 {value}%'
    },
    nodeBonusesTitle: '采集点数值',
    nodeBonuses: {
      baseIntegrity: '节点基礎耐久',
      gatheringCount: '采集次数增加',
      yieldCount: '获得数增加',
      extraRate: '额外率增加',
      collectableRelicToolBonus: '遗物工具效果',
      collectableRelicToolBonusDesc: '收藏品价值提升率 +20%。',
      enabled: '有',
      disabled: '无'
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
      tieBreaker: '若期望值在 epsilon 内相同，会选择更符合施放习惯的等价手法。',
      caveat: '最优性成立于目前建模的普通采集技能、GP、耐久、成功率、Boon、再起与理智同兴概率；未纳入收藏品、水晶采集与玩家手动中断。'
    }
  },
  collectableObjective: {
    kicker: '推荐排序权重',
    title: '评分偏好',
    close: '关闭评分偏好',
    intro: '权重会把每次收藏品采集结果换成分数，求解器会依这个分数排序推荐策略；权重越高，代表越希望策略把结果推向该档位。',
    solverIntro: '权重会把每次收藏品采集结果换成分数，求解器会依这个分数排序推荐策略；权重越高，代表越希望策略把结果推向该档位。',
    analysisIntro: '选择你想用哪种标准阅读这份分析结果。权重越高，代表该档位在期望、最高、最低与分布中越重要；可以在票据总量、高价值交纳，或自己的目标之间切换比较。',
    cancel: '取消',
    apply: '套用',
    applyCustom: '套用自定义权重',
    presets: {
      highValue: '高价值优先',
      midValue: '中价值优先',
      lowValue: '低价值优先',
      purpleScrip: '大地紫票优先',
      orangeScrip: '大地橙票优先',
      customTier: '自定义权重'
    },
    presetDescriptions: {
      highValue: '强烈偏向最高档位，中档作为备选结果。',
      midValue: '偏向停在中档，避免为了冲高档投入太多采集次数。',
      lowValue: '偏向稳定拿到低档，适合只想保守达标的测试。',
      scrip: '沿用目前奖励表，以票据总量作为分数。',
      customTier: '自行输入未达标、低档、中档、高档的分数。'
    },
    tiers: {
      none: '未达标',
      low: '低价值',
      mid: '中价值',
      high: '高价值'
    }
  },
  collectableSolver: {
    badge: '收藏品秘籍',
    title: '收藏品求解台',
    description: '算法未纳入大胆提炼、强化洞察，会依目前评分偏好排序推荐策略。',
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
      expectedTierCounts: '期望档位个数',
      maxTierCounts: '最高档位个数',
      minTierCounts: '最低档位个数',
      pointUnit: '分',
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
      tierCountUnit: '{tier}个数',
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
      outcomeValue: '收藏价值 {value}，耐久 {integrity}',
      nextAction: '下一步：{action}',
      terminal: '此分支已结束',
      back: '上一层',
      root: '回起点'
    },
    branches: {
      applied: '已施放',
      collectSuccess: '采集成功',
      collectFailed: '采集失败',
      valueNormal: '未触发收藏价值提升',
      valueIncreased: '触发收藏价值提升',
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
      refineOutcome: '依收藏价值提升与耐久消耗结果进入下一状态。',
      integrityRestored: '耐久恢复 1 点，最多不超过此采集点的当前耐久上限。',
      wiseProc: '石工之理或农夫之智恢复耐久后，50% 机率获得可免费恢复 1 点耐久的理智同兴。',
      wiseNoProc: '石工之理或农夫之智恢复耐久后，未获得理智同兴。',
      standardProc: '提炼类动作后触发 Collector\'s Standard / 洞察。',
      standardNoProc: '提炼类动作后未触发 Collector\'s Standard / 洞察。',
      revisitProc: '再起触发时，GP 回满、耐久与采集次数恢复，并接续再起后决策树。',
      revisitNoProc: '再起未触发，本次采集点结束。'
    },
    errors: {
      unsupportedLevel: { title: '收藏品采集需要 50 级', desc: '当前角色等级未达到 {level}，尚未开放收藏品采集。请提高等级后再使用收藏品秘笈。' },
      unsupportedReward: { title: '找不到收藏品奖励表', desc: '此物品目前不在已支持的收藏品缴纳、老主顾、魔法大学、万货街、精选或宇宙探索资料中，暂时无法求解。' },
      memoCapacity: { title: '内存不足，无法完成求解', desc: '这组条件需要的收藏品决策内存已达到此设备可用上限。请先缩小条件或改用较简单的情境。', raiseBudget: '提高内存再试', manualRisk: '提高内存后，浏览器可能短暂变慢或标签页停止响应；如果设备资源不足，系统可能会关闭该标签页。' },
      memoAllocationFailed: { title: '无法启动更高内存求解', desc: '浏览器无法分配这次求解需要的内存。请缩小条件或改用较简单的情境。' },
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
      valueIncreaseRate: '收藏价值提升率',
      relicToolBonus: '遗物工具加算',
      meticulousRate: '慎重不耗率',
      scrutiny: '集中检查',
      standardRate: 'Collector\'s Standard 机率',
      rewardTable: '奖励门槛',
      objective: '当前评分权重',
      objectivePreset: '权重档',
      objectiveUnit: '分数单位',
      objectiveNote: '这些权重只用来排序推荐策略；数字越高，代表该结果在本次求解中越值得追求。',
      itemWeight: '物品 {itemId}',
      objectiveKinds: {
        scrip: '票据总量',
        exp: '经验值',
        gil: '金币',
        custom: '自定义收益',
        tierScore: '档位权重'
      },
      objectiveUnits: {
        exp: '经验值',
        gil: '金币',
        custom: '自定义分数',
        tierScore: '分'
      },
      rewardWeights: {
        scrip: '票据',
        exp: '经验值',
        gil: '金币'
      },
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
  collectableStrategyLab: {
    strategyListKicker: '策略列表',
    strategyListTitle: '规则由上而下套用',
    strategyListAria: '收藏品策略列表',
    addStrategy: '新增策略',
    emptyStrategyTitle: '尚未建立策略',
    emptyStrategyDesc: '新增第一条策略后，右侧会立刻展开决策树并显示尚待决策的状态。',
    loadSimpleExample: '载入简单范例',
    simpleExample: {
      improveName: '提高价值',
      collectName: '采集'
    },
    treeKicker: '决策树覆盖',
    treeTitle: '当前展开状态',
    loadingBaseValues: '正在载入收藏品基础值。',
    collectableLevelLockedTitle: '收藏品采集尚未开放',
    collectableLevelLockedDesc: '收藏品采集需要等级 {level}。当前等级不足时，实验区不会展开决策树或执行分析。',
    actionLevelRequirement: '需要等级 {level}',
    ruleLevelIssue: '这条策略含有当前等级 {level} 尚未学会的技能，请调整技能或提高等级。',
    strategyLevelIssueTitle: '策略含有当前不能使用的技能',
    strategyLevelIssueDesc: '{action} 需要等级 {level}。请回到策略设置移除或替换该技能，或调整角色等级后再分析。',
    limitWarning: '当前策略展开过大，已先停止后续展开；请新增更收敛的策略再观察。',
    uncoveredTitle: '尚待决策节点总览',
    noUncoveredDesc: '当前所有分支都能一路走到耐久归零。',
    pendingOverview: {
      total: '共 {count} 个待决节点',
      uniqueValues: '{count} 种数值',
      nodeCount: '{count} 节点',
      gp: 'GP',
      integrity: '耐久',
      collectability: '收藏价值'
    },
    managedOverview: {
      rangesTitle: '状态范围',
      buffTitle: 'Buff 总览',
      collectSuccessRate: '采集成功率',
      valueIncreaseRate: '价值提升率',
      meticulousSaveRate: '慎重提炼不耗耐久率',
      someHasBuff: '部分有 {buff}',
      allHasBuff: '全部有 {buff}'
    },
    previousUncovered: '上一个待决节点',
    nextUncovered: '下一个待决节点',
    nodePager: '第 {current} / {total} 个',
    pendingState: '待决状态',
    noBuff: '无 Buff',
    pathTitle: '过往路径',
    noPath: '尚无过往路径。',
    defaultRuleName: '策略 {index}',
    coverageNodes: '{count} 节点',
    noConditions: '无条件',
    booleanCondition: '{label}{value}',
    branchJoiner: ' / ',
    pathStep: '{action}：{branch}',
    pathStepWithRule: '{rule} -> {action}：{branch}',
    joiners: {
      all: '、',
      any: ' 或 '
    },
    booleanValues: {
      true: '有',
      false: '无'
    },
    summary: {
      totalNodes: '总节点',
      decidedNodes: '已决策',
      uncoveredNodes: '尚待决策',
      terminalNodes: '终止'
    },
    nodeStatuses: {
      decided: '已纳管',
      uncovered: '待决策',
      terminal: '已终止',
      limited: '已达展开上限'
    },
    analysis: {
      title: '分析报告',
      subtitle: '依当前策略规则计算收藏品分数、概率分布与收益落点。',
      noRevisitNotice: '实验台以单次采集点为范围，分析结果不包含再起后重新采集的情况。',
      run: '进行分析',
      empty: '点击上方按钮开始分析当前策略。',
      unsupportedReward: '找不到此收藏品的支持奖励表，暂时无法评分。',
      summary: '总结',
      expectedScore: '期望{unit}',
      maxScore: '最高{unit}',
      minScore: '最低{unit}',
      distribution: '概率分布表',
      distributionScrip: '票据概率分布',
      distributionWeightedScore: '加权总分概率分布',
      distributionTierCounts: '档位个数概率分布',
      distributionUnitScrip: '分布表单位：{unit}',
      distributionUnitWeightedScore: '分布表单位：权重加权总分',
      distributionUnitTierCounts: '分布表单位：档位获得个数',
      weightedScoreUnit: '加权总分',
      scoringNote: '分布表会依当前评分偏好切换单位：票据显示票据量，档位优先显示获得个数，自定义权重显示加权总分。'
    },
    tools: {
      moveUp: '上移',
      moveDown: '下移',
      edit: '编辑',
      delete: '删除'
    },
    editor: {
      kicker: '策略设置',
      close: '关闭策略设置',
      managedNodes: '纳管的节点',
      skills: '技能选择',
      conditionSection: '策略条件',
      skillSection: '选择对应的技能',
      name: '策略名称',
      when: '符合',
      allConditions: '全部条件',
      anyCondition: '任一条件',
      then: '时执行',
      actionPreview: '策略技能预览',
      viewManagedNodes: '查看纳管的节点',
      summaryMode: '汇总',
      individualMode: '个别',
      managedNodesNotice: '仅列出策略展开至本项前，尚待决策且符合此条件的节点；不包含套用本策略技能后才产生的后续状态。',
      noManagedNodes: '这条策略目前还没有套用到任何节点。',
      effectPreview: '数值变化',
      effectPreviewDescription: '根据策略展开出的节点，显示本策略生效时每个技能单次施展可能造成的变化范围。',
      effectPreviewNoNodes: '这条策略目前没有套用节点，尚无可计算的变化范围。',
      effectPreviewCastableNodes: '可施展节点：{count}',
      effectPreviewUnavailable: '此技能在当前展开节点中不会被施展。',
      effectMetrics: {
        collectabilityGain: '价值提升 {range}',
        integrityDelta: '耐久 {range}',
        scrutinyBonus: '提炼值加成 {value}',
        valueIncreaseRate: '价值提升率 {from} → {to}（{delta}，×1.75）',
        meticulousSaveRate: '慎重不耗耐久率 {from} → {to}（{delta}）',
        collectSuccessBonus: '采集成功率 {value}',
        nextCollectSuccessBonus: '下次采集成功率 {value}',
        collectSuccessRate: '采集成功率 {range}',
        collectSuccessGp: '成功时 GP {range}'
      },
      backToMain: '返回',
      save: '保存',
      removeCondition: '移除条件',
      addCondition: '加条件',
      actionChain: '串联技能',
      singleAction: '单一技能',
      appendAction: '加技能',
      removeLastAction: '删技能',
      done: '完成'
    },
    fields: {
      gp: 'GP',
      integrity: '耐久',
      collectability: '收藏价值',
      scrutinyActive: '集中检查',
      collectorsFocusActive: '价值瞩目',
      primingTouchActive: '预备碰触',
      standardActive: '洞察',
      hasUsedCollectableAction: '已用收藏品技能',
      hasCollected: '已采集过',
      successBonus: '采集成功率加成',
      successIActive: '获得率 I',
      successIIActive: '获得率 II',
      successIIIActive: '获得率 III',
      nextCollectSuccessBonus: '下次采集成功率',
      wiseToTheWorldActive: '理智同兴'
    },
    fieldDescriptions: {
      collectability: '当前收藏价值。常用于判断要继续提炼，还是已达目标档位可以开始采集。',
      integrity: '当前剩余耐久。常用于判断是否该收尾、继续提炼，或先恢复耐久。',
      gp: '当前剩余 GP。常用于限制集中检查、价值瞩目、预备碰触与恢复耐久等耗 GP 技能。',
      scrutinyActive: '集中检查是否已启用。启用后会强化下一次提炼类技能，提炼后消耗。',
      collectorsFocusActive: '价值瞩目是否已启用。启用后会提高下一次提炼类技能的价值提升概率，提炼后消耗。',
      primingTouchActive: '预备碰触是否已启用。启用后只影响下一次慎重提炼的不消耗耐久概率。',
      standardActive: '洞察是否已触发。常用于让有洞察的分支改走慎重提炼或其他高价值判断。',
      wiseToTheWorldActive: '理智同兴是否可用。通常用于在触发后立刻免费恢复 1 点耐久。',
      successIActive: '获得率 I 是否已套用。用于避免重复使用同阶成功率补强。',
      successIIActive: '获得率 II 是否已套用。用于避免重复使用同阶成功率补强。',
      successIIIActive: '获得率 III 是否已套用。用于避免重复使用同阶成功率补强。',
      successBonus: '当前整个采集点已累积的收藏品采集成功率加成，来自获得率 I/II/III。',
      nextCollectSuccessBonus: '只套用在下一次收藏品采集的成功率加成，采集一次后就会消耗。',
      hasUsedCollectableAction: '是否已使用过提炼或收藏品采集类动作。多半是进阶分支或调试用的流程标记。',
      hasCollected: '是否已经按过收藏品采集。多半用于区分采集前后的进阶收尾规则。'
    },
    nodeState: 'GP {gp} / 耐久 {integrity} / 收藏价值 {collectability}',
    chips: {
      scrutinyActive: '集中检查',
      collectorsFocusActive: '价值瞩目',
      primingTouchActive: '预备碰触',
      standardActive: '洞察',
      wiseToTheWorldActive: '理智同兴',
      successBonus: '成功率 +{value}',
      nextCollectSuccessBonus: '下次 +{value}',
      hasUsedCollectableAction: '已开始',
      hasCollected: '已采集'
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
  gearProfiles: {
    title: '装备数值设置档设置',
    description: '把常用的采集数值先存成设置档，需要求解或模拟时再单向套用。',
    back: '返回',
    listTitle: '设置档列表',
    unnamed: '未命名设置档',
    defaultBadge: '默认',
    loadProfile: '载入设置档',
    relicShort: '遗物',
    defaults: {
      miner: '默认采掘师',
      botanist: '默认园艺师'
    },
    jobs: {
      universal: '采掘师 / 园艺师'
    },
    actions: {
      add: '新增',
      save: '保存设置档',
      saved: '已保存',
      delete: '删除设置档'
    },
    editor: {
      newTitle: '新增设置档',
      editTitle: '编辑设置档',
      defaultLocked: '默认设置档不可删除，职业类别固定。',
      name: '设置档名称',
      namePlaceholder: '例如：满禁断采集装',
      jobs: '可套用职业',
      currentGp: '当前 GP',
      maxGp: '装备 GP 上限',
      relic: '遗物工具效果',
      relicDesc: '仅影响收藏品系统的价值提升率。'
    },
    picker: {
      title: '载入装备设置档',
      description: '只会列出可套用到当前物品职业的设置档。',
      empty: '目前没有可套用到此职业的设置档。',
      manage: '管理设置档'
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
