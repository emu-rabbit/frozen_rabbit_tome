export default {
  app: {
    title: '冷冻兔肉的秘籍',
    subtitle: '兔肉不私藏的好秘籍',
    description: 'FFXIV 大地使者技能推荐工具'
  },
  common: {},
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
      copyReport: '复制报告'
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
    searchPlaceholder: '搜索实验中的物品名称',
    emptyTitle: '实验数据库目前是空的',
    emptyDesc: '在模拟台完成分析后，按下“保存实验”就会收进这里。',
    emptySearchTitle: '找不到相符的实验',
    emptySearchDesc: '可以改用当前语言名称或英文名称搜索看看。',
    unknownDate: '未知时间',
    regularExperiment: '一般采集实验',
    countValue: '{count} 个',
    updatedAt: '更新于 {time}',
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
      extraRate: '额外率增加'
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
      statesSolved: '已解状态',
      memoHits: 'Memo 命中',
      actionsEvaluated: '已评估分支',
      optimality: '最优性说明',
      optimalityMethod: '求解器会对每个状态穷举可施放技能与直接采集分支，使用 memoization 保存子问题最佳解；因此在目前模型内，根状态取得的就是全局最佳期望值。',
      tieBreaker: '若期望值在 epsilon 内相同，使用 rotationPreferenceScore 选择更符合施放习惯的等价手法。',
      caveat: '最优性成立于目前建模的普通采集技能、GP、耐久、成功率、Boon、再起与理智同兴概率；未纳入收藏品、水晶采集与玩家手动中断。'
    }
  },
  tomeLibrary: {
    title: '秘籍书库',
    subtitle: '管理已保存的采集秘籍，搜索物品后即可快速载回求解器调整。',
    searchPlaceholder: '搜索秘籍中的物品名称',
    noFood: '未使用食物',
    unknownDate: '未知时间',
    rotationPreview: '最佳手法预览',
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
