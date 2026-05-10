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
      finalConditionalGather: '若理智同興觸發，請採集到底',
      continueAfterSeconds: '{message}，{seconds} 秒後巨集將繼續'
    },
    preview: {
      kicker: 'FFXIV 採集巨集',
      title: '預覽採集巨集',
      close: '關閉巨集預覽',
      singleTitle: '巨集內容',
      partTitle: '巨集 #{index}',
      singleSummary: '這份巨集共 {lines} 行，可直接複製到遊戲中。',
      splitSummary: '這份巨集共 {lines} 行，已依遊戲 15 行限制拆成 {count} 份。',
      groupSummary: '這次包含 {count} 組巨集，共 {lines} 行，可分別複製到遊戲中。',
      lineCount: '{count} / 15 行',
      copySingle: '複製巨集',
      copyPart: '複製 #{index}',
      copyStates: {
        copied: '已複製',
        failed: '複製失敗'
      }
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
    resultCount: '{count}{plus} 筆結果',
    glv: 'Glv',
    noTranslation: '(無官方翻譯)',
    collectableSystem: '收藏品系統',
    crystalGatheringSystem: '水晶採集系統',
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
    solverModeTitle: '求解目標模式',
    solverModeDesc: '選擇求解台評分手法時最在意的目標。',
    solverModes: {
      expected: '平凡人模式',
      max: '天選人模式',
      min: '保守人模式'
    },
    solverModeDetails: {
      expected: '使用期望值評分，是目前網站原本的穩健模式。',
      max: '只看手法可達到的最高獲得量，機率不會進入評分。',
      min: '只看手法最差情況下的最低獲得量，適合想要保底的採集規劃。'
    },
    debugTitle: '專家偵錯模式',
    debugDesc: '開啟後，求解結果會提供公式、機率分布與最優性檢查資訊。',
    solverDebugMode: '顯示求解器偵錯資訊',
    solverDebugModeDesc: '適合驗證 rotation、期望值與搜尋過程；一般採集時可保持關閉。',
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
    crystalGatheringWarning: '水晶採集系統仍在施工中',
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
      modeDescriptions: {
        expected: '平凡人模式：依照目前數值，演算出期望產量最高的手法',
        max: '天選人模式：依照目前數值，演算出最高產量最漂亮的手法',
        min: '保守人模式：依照目前數值，演算出最低產量最穩的手法'
      },
      copyMacro: '預覽巨集',
      copyMacroStates: {
        copied: '已複製',
        partial: '已複製前 15 行',
        failed: '複製失敗'
      },
      saveTome: '儲存秘笈',
      savedTome: '已儲存',
      solve: '求解',
      totalExpectedYield: '總期望產量',
      summary: {
        expected: '總期望產量',
        max: '總最高產量',
        min: '總最低產量'
      },
      expectedYield: '期望總產量',
      maxYield: '最高產量',
      minYield: '最低產量',
      yieldChance: '機率 {chance}%',
      chanceWithRevisit: '含再起可能：{chance}% 機率',
      rotationOrder: '手法順序',
      primaryRotation: '原採集手法',
      revisitRotation: '再起發動後手法',
      revisitBadge: '再起發動',
      rotationTitles: {
        primary: '採集手法',
        primaryWithRevisit: '採集手法（再起也是相同手法）',
        revisit: '採集手法（再起發動後）'
      },
      revisitSameRotationNote: {
        expected: '總期望值已納入再起機率。',
        max: '最高值與機率已納入再起可能。',
        min: '最低值與機率已納入再起可能。'
      },
      revisitTotalNote: {
        expected: '總期望值已納入再起機率。',
        max: '最高值與機率已納入再起後手法。',
        min: '最低值與機率已納入再起後手法。'
      },
      empty: '點擊上方按鈕開始計算建議手法',
      workerErrors: {
        reload: '重新整理',
        workerStale: {
          title: '求解器需要重新載入',
          desc: '網站可能剛更新完成，舊頁面載不到新的演算資源。按下重新整理後就能繼續使用。'
        },
        workerFailed: {
          title: '求解器暫時無法啟動',
          desc: '請重新整理頁面後再試一次；若仍然發生，可能需要稍後再回來。'
        }
      },
      gatherAction: '採集',
      conditionalSuffix: '（若觸發）',
      conditionalGatherSuffix: '（同興觸發）'
    },
    debug: {
      open: '查看求解器偵錯資訊',
      close: '關閉偵錯視窗',
      kicker: 'Solver Debug',
      title: '期望值與最優性驗證',
      subtitle: '這裡列出本次求解使用的公式、outcome 分布與動態規劃搜尋統計。',
      formulas: '公式輸入',
      successFormula: '採集成功率',
      successScoreFormula: '成功率分數 = floor(100 * {gathering} / {baseGathering}) = {score}',
      rawSuccess: '分段函數基礎值',
      levelModifier: '等級修正',
      levelDifference: '等級差',
      finalSuccess: '最終成功率',
      boonFormula: '額外採集率',
      boonScoreFormula: '額外率分數 = min(150, floor(100 * {perception} / {basePerception})) = {score}',
      finalBoon: '最終 Boon 機率',
      bountifulFormula: '高產 / 豐收',
      plusTwoThreshold: '+2 門檻',
      plusThreeThreshold: '+3 門檻',
      bountifulAmount: '本次技能加成',
      gatherFormula: '單次採集狀態',
      integrity: '耐久',
      nodeYieldBonus: '節點獲得數',
      nodeBoonBonus: '節點額外率',
      gpRecovered: '每次採集回復',
      expectedValue: '總期望值',
      revisitChance: '再起機率',
      plans: '手法分支',
      primaryPlan: '原採集手法',
      revisitPlan: '再起發動後手法',
      startingGp: '起始 GP',
      minYield: '最小',
      maxYield: '最大',
      statesSolved: '解過狀態',
      memoHits: 'Memo 命中',
      actionsEvaluated: '已評估分支',
      optimality: '最優性說明',
      optimalityMethod: '求解器會對每個狀態窮舉可施放技能與直接採集分支，使用 memoization 保存子問題最佳解；因此在目前模型內，根狀態取得的就是全域最佳期望值。',
      tieBreaker: '若期望值在 epsilon 內相同，使用 rotationPreferenceScore 選擇更符合施放習慣的等價手法。',
      caveat: '最優性成立於目前建模的普通採集技能、GP、耐久、成功率、Boon、再起與理智同興機率；未納入收藏品、水晶採集與玩家手動中斷。'
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
      nodeBonuses: '礦脈獎勵',
      objectiveMode: '求解模式'
    },
    actions: {
      edit: '編輯',
      copyMacro: '預覽巨集',
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
      percent: '%',
      secondsSuffix: ' 秒'
    }
  },
  welcomeModal: {
    title: '歡迎來到秘笈',
    subtitle: '在你開始之前，請先選擇你偏好的語言',
    description: '這將會調整整個秘笈的介面語言。你之後隨時可以在「設定」中更改。',
    confirm: '就用這個語言開始吧！'
  }
}
