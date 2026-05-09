export default {
  app: {
    title: '冷凍兔肉的秘笈',
    subtitle: '兔肉不私藏的好秘笈',
    description: 'FFXIV 大地使者技能推薦工具'
  },
  common: {
    getStarted: '立即開始'
  },
  macro: {
    prompts: {
      gatherCount: '請採集 {count} 次',
      conditionalGatherCount: '若理智同興觸發，請採集 {count} 次',
      finalGather: '請採集到底',
      finalConditionalGather: '若理智同興觸發，請採集到底'
    }
  },
  nav: {
    createGuide: '建立秘笈',
    solver: '秘笈求解器',
    tomeLibrary: '秘笈書庫',
    settings: '設定頁面',
    github: 'GitHub 專案'
  },
  createGuide: {
    title: '選擇待採集的物品',
    subtitle: '可輸入名稱搜尋，倘若搜尋不到可以嘗試使用英文',
    dataScope: '僅顯示「採掘師」與「園藝師」可採集的物品',
    searchPlaceholder: '輸入物品名稱',
    loading: '資料載入中，請稍候…',
    noResults: '未找到相符的物品，請嘗試使用英文搜尋',
    typeToSearch: '請輸入物品名稱開始搜尋',
    glv: 'Glv',
    noTranslation: '(無官方翻譯)',
    collectableSystem: '收藏品系統',
    regularSystem: '一般採集系統',
    apiError: '無法連接至 XIVAPI 獲取收藏品資料。請檢查網路連線或稍後再試。',
    retrySearch: '重試搜尋'
  },
  settings: {
    title: '秘笈設定',
    description: '調整秘笈的各項偏好設定',
    appearanceTitle: '外觀設定',
    appearanceDesc: '調整秘笈的視覺風格',
    darkMode: '深色模式',
    darkModeDesc: '開啟深色模式，適合在昏暗環境下使用',
    language: '語言版本',
    languageDesc: '本網站的顯示語言，缺乏翻譯的情況下將顯示英文',
    langOptions: {
      tw: '繁體中文',
      en: 'English',
      ja: '日本語',
      cn: '简体中文'
    },
    aboutTitle: '關於本專案',
    aboutDesc: '這是「冷凍兔肉的秘笈」，專為 FFXIV 採集玩家設計的工具箱。',
    statsTitle: '採集玩家數值',
    statsDesc: '請填入你在遊戲中真實的裝備數值，以便獲得更精確的演算建議。',
    macroTitle: '採集巨集',
    macroDesc: '調整巨集提醒玩家手動採集時的等待時間。預設每個物品 4 秒，外加 2 秒緩衝。',
    macroSecondsPerGather: '每個物品等待',
    macroBufferSeconds: '額外緩衝',
  },
  solver: {
    title: '秘笈求解器',
    statsTitle: '當前採集玩家數值',
    currentGp: '演算開始 GP',
    effectiveMaxGp: '食物後滿 GP',
    maxGp: '裝備最大 GP',
    noItemTitle: '未選擇物品',
    noItemDesc: '請先透過「建立秘笈」搜尋並選擇一個採集物品。',
    goToCreate: '前往建立秘笈',
    collectableWarning: '收藏品系統仍在施工中',
    syncToSettings: '儲存{job}設定',
    syncSuccess: '已儲存設定',
    food: {
      label: '食物',
      placeholder: '搜尋食物',
      nq: 'NQ',
      hq: 'HQ',
      max: '上限'
    },
    results: {
      gatheringRate: '基礎採集成功率',
      boonRate: '基礎額外採集率'
    },
    nodeBonusesTitle: '採集點數值',
    nodeBonuses: {
      baseIntegrity: '節點基礎耐久',
      gatheringCount: '採集次數增加',
      yieldCount: '獲得數增加',
      extraRate: '額外率增加'
    },
    strategy: {
      title: '建議採集手法',
      description: '依照目前數值，演算出期望產量最高的手法',
      copyMacro: '複製巨集',
      copyMacroStates: {
        copied: '已複製',
        partial: '已複製前 15 行',
        failed: '複製失敗'
      },
      saveTome: '儲存秘笈',
      savedTome: '已儲存',
      solve: '求解',
      expectedYield: '期望總產量',
      maxYield: '最高產量',
      minYield: '最低產量',
      rotationOrder: '手法順序',
      empty: '點擊上方按鈕開始計算建議手法',
      gatherAction: '採集',
      conditionalSuffix: '（若觸發）',
      conditionalGatherSuffix: '（同興觸發）'
    }
  },
  tomeLibrary: {
    title: '秘笈書庫',
    subtitle: '管理已儲存的採集秘笈，搜尋物品後即可快速載回求解器調整。',
    searchPlaceholder: '搜尋秘笈中的物品名稱',
    noFood: '未使用食物',
    unknownDate: '未知時間',
    rotationPreview: '最佳手法預覽',
    createdAt: '建立於 {time}',
    emptyTitle: '書庫目前是空的',
    emptyDesc: '在秘笈求解器演算出手法後，按下「儲存秘笈」就會收進這裡。',
    emptySearchTitle: '找不到相符的秘笈',
    emptySearchDesc: '可以改用當前語系名稱或英文名稱搜尋看看。',
    rows: {
      playerStats: '玩家數值',
      gpState: 'GP 狀態',
      food: '食物',
      nodeBonuses: '礦脈獎勵'
    },
    actions: {
      edit: '編輯',
      copyMacro: '複製巨集',
      copyMacroStates: {
        copied: '已複製',
        partial: '已複製前 15 行',
        failed: '複製失敗'
      },
      delete: '刪除秘笈'
    }
  },
  game: {
    jobs: {
      miner: '採掘師',
      botanist: '園藝師'
    },
    stats: {
      level: '等級',
      gathering: '獲得力',
      perception: '鑑別力',
      gp: 'GP'
    },
    units: {
      times: '次',
      count: '個',
      percent: '%'
    }
  },
  welcomeModal: {
    title: '歡迎來到秘笈',
    subtitle: '在你開始之前，請先選擇你偏好的語言',
    description: '這將會調整整個秘笈的介面語言。你之後隨時可以在「設定」中更改。',
    confirm: '就用這個語言開始吧！'
  }
}
