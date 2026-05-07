export default {
  app: {
    title: '冷冻兔肉的秘籍',
    subtitle: '兔肉不私藏的好秘籍',
    description: 'FFXIV 大地使者技能推荐工具'
  },
  common: {},
  nav: {
    createGuide: '建立秘籍',
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
    statsDesc: '请填入你在游戏中真实的装备数值，以便获得更精确的演算建议。'
  },
  game: {
    jobs: {
      miner: '采矿工',
      botanist: '园艺工'
    },
    stats: {
      gathering: '获得力',
      perception: '鉴别力',
      gp: 'GP'
    }
  },
  welcomeModal: {
    title: '欢迎来到秘籍',
    subtitle: '在你开始之前，请先选择你偏好的语言',
    description: '这将会调整整个秘籍的界面语言。你之后随时可以在"设置"中更改。',
    confirm: '就用这个语言开始吧！'
  }
}
