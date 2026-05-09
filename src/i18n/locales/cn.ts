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
    createGuide: '建立秘籍',
    solver: '秘籍求解器',
    tomeLibrary: '秘籍书库',
    settings: '设置页面',
    github: 'GitHub 项目'
  },
  createGuide: {
    title: '选择待采集的物品',
    subtitle: '可输入名称搜索，倘若搜索不到可以尝试使用英文',
    dataScope: '仅显示「采矿工」与「园艺工」可采集的物品',
    searchPlaceholder: '输入物品名称',
    loading: '数据加载中，请稍候…',
    noResults: '未找到相符的物品，请尝试使用英文搜索',
    typeToSearch: '请输入物品名称开始搜索',
    glv: 'Glv',
    noTranslation: '(无官方翻译)',
    collectableSystem: '收藏品系统',
    regularSystem: '一般采集系统',
    apiError: '无法连接至 XIVAPI 获取收藏品数据。请检查网络连接或稍后再试。',
    retrySearch: '重试搜索'
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
      copyMacro: '预览宏',
      copyMacroStates: {
        copied: '已复制',
        partial: '已复制前 15 行',
        failed: '复制失败'
      },
      saveTome: '保存秘籍',
      savedTome: '已保存',
      solve: '求解',
      expectedYield: '期望总产量',
      maxYield: '最高产量',
      minYield: '最低产量',
      rotationOrder: '手法顺序',
      empty: '点击上方按钮开始计算推荐手法',
      gatherAction: '采集',
      conditionalSuffix: '（若触发）',
      conditionalGatherSuffix: '（同兴触发）'
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
      nodeBonuses: '矿脉奖励'
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
      percent: '%'
    }
  },
  welcomeModal: {
    title: '欢迎来到秘籍',
    subtitle: '在你开始之前，请先选择你偏好的语言',
    description: '这将会调整整个秘籍的界面语言。你之后随时可以在"设置"中更改。',
    confirm: '就用这个语言开始吧！'
  }
}
