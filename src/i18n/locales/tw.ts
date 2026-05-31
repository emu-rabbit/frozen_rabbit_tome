export default {
  app: {
    title: '冷凍兔肉的秘笈',
    subtitle: '兔肉不私藏的好秘笈',
    description: 'FFXIV 大地使者技能推薦工具'
  },
  common: {
    getStarted: '立即開始',
    cancel: '取消',
    close: '關閉',
    done: '完成',
    backToSelection: '返回物品選擇',
    exportJson: '匯出 JSON',
    exportingJson: '正在匯出 JSON',
    exportedJson: '已匯出 JSON',
    displayMode: '顯示模式',
    displayModes: {
      compact: '簡潔',
      detailed: '詳細'
    },
    pending: {
      collectableDesc: '收藏品採集系統目前尚在開發中，敬請期待。',
      crystalDesc: '水晶採集系統目前尚在開發中，敬請期待。'
    }
  },
  jsonExport: {
    scenarios: {
      tomeRegular: '一般採集秘笈',
      tomeCollectable: '收藏品秘笈',
      experimentRegular: '一般採集實驗',
      experimentCollectable: '收藏品實驗'
    }
  },
  jsonImport: {
    actions: {
      upload: '匯入 JSON'
    },
    save: {
      tome: {
        title: '匯入秘笈',
        description: '確認這份 JSON 的內容後，可以替它取名並存進秘笈書庫。',
        confirm: '儲存秘笈'
      },
      experiment: {
        title: '匯入實驗',
        description: '確認這份 JSON 的內容後，可以替它取名並存進實驗資料庫。',
        confirm: '儲存實驗'
      }
    },
    warning: {
      kicker: '檔案類型不同',
      tomeLibraryTitle: '這份檔案是實驗資料',
      tomeLibraryDescription: '你目前在秘笈書庫上傳，但這份 JSON 來自實驗。繼續後會存進實驗資料庫，不會存成秘笈。',
      experimentDatabaseTitle: '這份檔案是秘笈資料',
      experimentDatabaseDescription: '你目前在實驗資料庫上傳，但這份 JSON 來自秘笈。繼續後會存進秘笈書庫，不會存成實驗。',
      continueToExperiment: '存進實驗資料庫',
      continueToTome: '存進秘笈書庫',
      cancel: '放棄'
    },
    errors: {
      title: '無法匯入檔案',
      invalidJson: '這不是可解析的 JSON 檔案，請確認你選到的是從秘笈下載的 JSON。',
      unsupportedSchema: '這份 JSON 不是目前版本支援的秘笈匯出格式。',
      unsupportedScenario: '這份 JSON 的情境類型目前尚未支援匯入。',
      invalidContent: '這份 JSON 缺少必要內容，無法重建秘笈或實驗卡片。',
      unknown: '匯入時發生未預期的錯誤，請確認檔案內容後再試一次。',
      close: '知道了'
    }
  },
  saveEntry: {
    nameLabel: '名稱',
    cancel: '取消',
    tome: {
      title: '儲存秘笈',
      description: '替這份秘笈取一個好認的名字，之後在書庫裡會更容易分辨。',
      confirm: '儲存秘笈'
    },
    experiment: {
      title: '儲存實驗',
      description: '替這次實驗取一個好認的名字，之後在資料庫裡會更容易分辨。',
      confirm: '儲存實驗'
    }
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
    createGuide: '創建新秘笈',
    solver: '秘笈求解器',
    createExperiment: '創建新實驗',
    frontierCollectable: '建立開拓研究',
    favoriteItems: '最愛的物品',
    tomeLibrary: '秘笈藏書庫',
    experimentDatabase: '實驗數據庫',
    frontierStudies: '開拓研究庫',
    faq: '常見問題',
    settings: '設定頁面',
    github: 'GitHub 專案',
    sponsor: '贊助冷凍庫電費'
  },
  frontier: {
    disabled: {
      title: '開拓研究模式尚未啟用',
      description: '開拓是進階研究區，會依你提供的機率假設分析策略；結果僅供研究參考。',
      action: '前往設定啟用'
    },
    collectable: {
      title: '開拓研究',
      description: '用自訂機率假設分析進階採集策略，適合研究大膽提煉與強化洞察等尚待實證的採集情境。',
      emptyTitle: '準備建立研究',
      emptyDescription: '選定研究條件後，就能在這裡整理策略假設、觀察結果分布，並保留給日後回顧。'
    },
    studies: {
      title: '研究案例',
      description: '這裡保存開拓研究案例，方便日後回顧同一組假設與策略。',
      emptyTitle: '尚未保存研究案例',
      emptyDescription: '保存後的研究案例會集中在這裡，方便日後回顧與比較。',
      emptySearchTitle: '沒有找到研究案例',
      emptySearchDescription: '換個名稱或物品關鍵字再試一次。',
      searchPlaceholder: '搜尋研究案例',
      updatedAt: '更新於 {time}',
      rules: '策略規則',
      open: '開啟副本',
      delete: '刪除研究'
    },
    create: {
      title: '選擇研究物品',
      description: '先選定採集物品，再由系統判斷目前可用的開拓模型。',
      searchPlaceholder: '搜尋採集物品',
      modelResult: '模型搜尋結果',
      dawntrailCollectableModel: '黃金遺產收藏品模型',
      modelDescription: '此模型會使用你提供的機率假設分析收藏品策略。',
      noModelTitle: '沒有找到相符模型',
      noModelDescription: '目前開拓研究只支援收藏品模型；一般採集品可以先使用既有秘笈或實驗。',
      startModel: '使用此模型',
      states: {
        loading: '正在搜尋可採集物品...',
        idle: '輸入物品名稱開始搜尋。',
        empty: '沒有找到符合條件的物品。',
        error: '搜尋失敗，請稍後再試。',
        results: '搜尋結果'
      }
    },
    workspace: {
      assumptionNote: '此研究只代表目前輸入的機率假設，不代表正式遊戲期望值。',
      changeItem: '更換物品',
      inputs: '研究條件',
      inputsDesc: '玩家數值與節點狀態會搭配物品資料，用來分析這次研究。',
      relicBonus: '套用收藏品遺物工具效果',
      effectiveStats: '食物後數值'
    },
    profile: {
      title: '研究假設',
      description: '設定大膽提煉分布與強化洞察觸發率；一般洞察使用已確認資料。',
      standardRate: '洞察觸發率',
      standardFixed: '洞察觸發率（固定）',
      highStandardRate: '強化洞察觸發率',
      highStandardDescription: '輸入強化洞察在提煉後出現的假設機率。',
      brazenTitle: '大膽提煉分布',
      brazenShortDescription: '選擇大膽提煉的機率分布曲線。',
      brazenDescription: '用離散 bucket 描述大膽提煉倍率與機率。這是研究假設，不代表官方分布。',
      distribution: '分布',
      curveLabel: '機率分布曲線',
      granularityLabel: '大膽提煉精細程度',
      granularityOption: '{count} 檔',
      granularityHint: '越精細，分析時的大膽提煉分支會越多。',
      curves: {
        uniform: {
          label: '均勻分布',
          description: '每個倍率同機率。'
        },
        triangular: {
          label: '三角分布',
          description: '中間較常見，兩端較少。'
        },
        normal: {
          label: '常態分布',
          description: '鐘形曲線近似。'
        },
        skewLow: {
          label: '偏低分布',
          description: '低倍率較常見。'
        },
        skewHigh: {
          label: '偏高分布',
          description: '高倍率較常見。'
        },
        uShape: {
          label: 'U 型分布',
          description: '兩端較常見，中間較少。'
        }
      },
      editBrazen: '編輯分布',
      bucketCount: '檔數',
      totalRate: '總機率',
      average: '平均',
      addBucket: '新增',
      applyTemplate: '套用模板',
      normalize: '正規化',
      clear: '清空',
      invalidTotal: '大膽提煉機率總和必須等於 100%。',
      multiplier: '倍率 %',
      probability: '機率 %',
      removeBucket: '移除 bucket'
    },
    branches: {
      highStandardProc: '觸發強化洞察'
    },
    strategy: {
      title: '策略規則',
      description: '依序比對規則，符合條件後執行動作串；沒有規則覆蓋的狀態會停止。',
      addRule: '新增規則',
      newRule: '新規則',
      ruleName: '規則名稱',
      enabled: '啟用',
      removeRule: '刪除規則',
      conditions: '條件',
      actions: '動作',
      all: '全部符合',
      any: '任一符合',
      addCondition: '新增條件',
      removeCondition: '移除條件',
      addAction: '加入動作',
      noActions: '尚未加入動作',
      ruleOrder: '第 {index} 條規則，會依序比對。',
      boolean: {
        true: '是',
        false: '否'
      },
      standardModes: {
        none: '無洞察',
        standard: '洞察',
        highStandard: '強化洞察'
      },
      fields: {
        gp: 'GP',
        integrity: '耐久',
        collectability: '收藏價值',
        scrutinyActive: '集中檢查',
        collectorsFocusActive: '價值矚目',
        primingTouchActive: '預備碰觸',
        standardMode: '洞察狀態',
        wiseToTheWorldActive: '理智同興預備',
        successBonus: '採集成功率補強',
        nextCollectSuccessBonus: '下次採集成功補強',
        hasUsedCollectableAction: '已用收藏品技能',
        hasCollected: '已採集'
      }
    },
    analysis: {
      title: '分析結果',
      description: '完整展開目前策略的結果分布，方便檢查每種落點。',
      run: '分析',
      save: '保存',
      invalidProfile: '請先讓機率設定有效。',
      noRewardTable: '找不到此物品的收藏品獎勵資料。',
      expectedScore: '期望分數',
      minScore: '最低分數',
      maxScore: '最高分數',
      states: '狀態 / 轉移',
      scoreDistribution: '分數分布',
      limited: '分析達到狀態上限，結果僅為受限摘要。'
    },
    save: {
      title: '保存開拓研究',
      description: '替這份研究取一個好認的名字，之後可在研究庫再次開啟。',
      defaultName: '開拓研究',
      confirm: '保存研究'
    },
    json: {
      scenario: '開拓研究',
      export: '匯出開拓 JSON',
      exported: '已匯出',
      import: '匯入開拓 JSON',
      importTitle: '匯入開拓研究',
      importDescription: '確認這份 JSON 的研究假設與策略後，可以存進開拓研究庫。',
      importConfirm: '儲存研究',
      errors: {
        title: '無法匯入開拓 JSON',
        invalidJson: '這不是可解析的 JSON 檔案。',
        unsupportedScenario: '這份 JSON 不是開拓研究情境。',
        missingItem: '這份 JSON 缺少物品資訊。',
        invalidContent: '這份 JSON 缺少必要研究內容。',
        unknown: '匯入時發生未預期的錯誤。'
      }
    }
  },
  faq: {
    title: '常見問題',
    description: '整理秘笈目前支援範圍與使用前最容易想確認的細節。',
    items: [
      {
        q: '請問本專案使用的技能組和物品是幾版的？',
        a: '本專案的技能組與物品適用 Final Fantasy XIV 版本 7.5 的內容。'
      },
      {
        q: '秘笈和實驗的差別在哪？',
        a: '秘笈是求解器：你提供裝備數值、GP、採集次數、節點獎勵與目標後，系統會在目前支援模型內推算並推薦技能手法。實驗則是模擬與分析工具：你除了提供同樣的條件，也需要輸入想測試的技能串或策略，模擬器會算出結果，分析器會整理獎勵落點、機率分布與風險，方便你比較自己的手法。'
      },
      {
        q: '本網站求解器輸出的是最佳解嗎？',
        a: '本網站會依照大部分情況與你選擇的目標，輸出最推薦的技能手法。不過每種技能手法都有各自的優缺點，就像不同玩法流派一樣，不一定存在最完美的答案。如果想要深入分析，強烈建議前往本網站的實驗區域進行模擬與分析。'
      },
      {
        q: '可以說說求解器是怎麼運作的嗎？',
        a: '求解器會展開所有可能的技能施放分支，並依照你設定好的目標替每個分支評分。最後，它會從最高分的技能手法中，再挑出同分時最符合玩家施放習慣的順序作為推薦解答。'
      },
      {
        q: '為何不支援水晶類的物品，另外大膽提煉和強化洞察為何也不在求解器探索範圍內呢？',
        a: '因為我們目前尚未知曉大地恩惠、大膽提煉、強化洞察詳細的公式和機率分布；另外，大膽提煉也會以非常誇張的方式展開搜尋樹，造成較高的運算負荷。等到一旦有足夠的資料或想法，兔肉也會盡快將它實裝進去。'
      },
      {
        q: '巨集為什麼說是半自動的？',
        a: '因為採集動作必須由使用者點擊遊戲畫面中的選單完成，所以巨集不能完全替你完成整份採集工作。另外，收藏品系統也不支援巨集，因為它需要你依照畫面上的實際情況判斷下一步要採取的行動。'
      },
      {
        q: '最愛物品與藏書庫和數據庫的差別在哪？',
        a: '可以想像最愛物品只保存物品本身，不會保存玩家的裝備數值、採集點獎勵、計算出來的採集手法或分析結果；秘笈藏書庫和實驗數據庫則會保存這些內容。最愛物品適合經常使用同一個物品、並會反覆調整各項數值的玩家。'
      },
      {
        q: '為甚麼要把兔肉冷凍起來，可以烤來吃嗎？',
        a: '不可以'
      },
      {
        q: '關於網站現在的狀態',
        a: '網站現在在超先行測試運行中，很多東西還不是穩定狀態，但同時也在蒐集各方的意見，有 Bug 或任何意見歡迎前往 <a href="https://github.com/emu-rabbit/frozen_rabbit_tome/issues" target="_blank" rel="noreferrer" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a> 告訴我唷'
      }
    ],
    footer: '還有其他疑問嗎？歡迎透過 GitHub 回報或來信聯繫：{email}'
  },
  createGuide: {
    title: '請選擇待採集物品',
    description: '在這裡搜尋並選擇物品，以進入求解台計算推薦採集手法。',
    dataScope: '僅顯示「採掘師」與「園藝師」可採集的物品，水晶類物品也暫時不支援',
    searchPlaceholder: '請輸入繁體中文名稱，若搜尋不到可以試試英文名稱',
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
  createExperiment: {
    title: '請選擇待採集物品',
    description: '在這裡搜尋並選擇物品，以進入模擬台進行實驗與分析。',
    dataScope: '僅顯示「採掘師」與「園藝師」可採集的物品，水晶類物品也暫時不支援'
  },
  favoriteItems: {
    title: '最愛的物品',
    subtitle: '收藏常用採集物品，需要時可以直接前往秘笈或實驗。',
    count: '{count} 件',
    addAction: '加入最愛',
    removeAction: '移除最愛',
    emptyTitle: '還沒有收藏物品',
    emptyDesc: '在創建秘笈或創建實驗的搜尋結果中，按下愛心就能加入這裡。',
    dialog: {
      kicker: '選擇下一步',
      title: '使用 {item}',
      close: '關閉選擇視窗',
      guideDesc: '進入求解台計算推薦採集手法',
      experimentDesc: '進入模擬台進行實驗與分析'
    },
    filters: {
      open: '篩選最愛物品',
      close: '關閉篩選視窗',
      kicker: '篩選條件',
      title: '篩選最愛物品',
      text: '文字搜尋',
      textPlaceholder: '輸入物品名稱，倘若搜尋不到可以嘗試使用英文',
      glvMin: 'Glv 下限',
      glvMax: 'Glv 上限',
      noLimit: '不限制',
      jobs: '可採集職業',
      systems: '採集系統',
      clear: '清除篩選',
      done: '完成',
      emptyTitle: '沒有符合篩選的最愛物品',
      emptyDesc: '可以調整文字、Glv、職業或採集系統篩選。',
      systemOptions: {
        regular: '一般',
        collectable: '收藏品',
        crystal: '水晶'
      }
    }
  },
  simulator: {
    noItemTitle: '尚未選擇實驗物品',
    noItemDesc: '請先建立實驗並選擇一個一般採集物品。',
    goToCreate: '前往創建實驗',
    collectablePending: '收藏品採集系統之後才動工。',
    crystalPending: '水晶採集系統之後才動工。',
    statsTitle: '實驗數值',
    perceptionWarning: '鑑別力不達標，無法採集此物品。',
    integrity: '耐久',
    tabsLabel: '採集手法分頁',
    clearRotation: '清空{name}',
    rotationSimulation: '指定手法模擬',
    copyPrimaryRotation: '複製一般手法',
    primaryGathering: '一般採集',
    revisitGathering: '再起後採集',
    emptyPrimaryRotation: '未加入技能時會以「不施放技能」分析；也可以點下方技能建立手法。',
    emptyRevisitRotation: '耐久歸零後可建立再起發動時的第二段手法。',
    removeFromHere: '移除此技能與後方技能',
    rotationIssueTitle: '手法串目前有無法施展的技能',
    rotationIssueDesc: '請檢查被標紅的技能，可能是等級、GP、耐久或前置條件在目前數值下不成立。',
    primaryRotationAnalysis: '一般採集手法',
    revisitRotationAnalysis: '再起後手法',
    rates: {
      success: '採集成功率',
      boon: '額外採集率',
      currentGp: '目前 GP'
    },
    actions: {
      simulate: '進行分析',
      save: '儲存實驗',
      saved: '已儲存'
    },
    analysis: {
      title: '分析報告',
      subtitle: '根據設定手法計算之期望結果',
      noRevisitNotice: '實驗台以單次採集點為範圍，分析結果不包含再起後重新採集的情況。',
      empty: '點擊上方按鈕開始進行分析',
      summary: '總結',
      expectedYield: '期望獲得量',
      maxYield: '最大獲得量',
      minYield: '最小獲得量',
      chance: '機率 {chance}%',
      revisitNote: '已納入再起 {chance}% 機率。'
    },
    actionCategories: {
      gather: '採集動作',
      success: '獲得率提高',
      boon: '額外採集率提高',
      nextSuccess: '下一次獲得率提高',
      nextYield: '下一次獲得量提高',
      restore: '恢復耐久',
      wholeYield: '整點獲得量提高',
      boonYield: '額外採集獲得數提高'
    }
  },
  experimentDatabase: {
    title: '實驗資料庫',
    subtitle: '管理已儲存的一般採集與收藏品實驗，之後可以載回模擬台重新分析。',
    searchPlaceholder: '搜尋實驗名稱或物品名稱',
    emptyTitle: '實驗資料庫目前是空的',
    emptyDesc: '在模擬台完成分析後，按下「儲存實驗」就會收進這裡。',
    emptySearchTitle: '找不到相符的實驗',
    emptySearchDesc: '可以改用當前語系名稱或英文名稱搜尋看看。',
    unknownDate: '未知時間',
    regularExperiment: '一般採集實驗',
    collectableExperiment: '收藏品實驗',
    countValue: '{count} 個',
    createdAt: '建立於 {time}',
    rows: {
      playerStats: '玩家數值',
      gpState: 'GP 狀態',
      nodeBonuses: '採集點獎勵',
      objectivePreference: '評分偏好',
      totalExpected: '總期望',
      expectedScore: '期望分數',
      maxScore: '最大分數',
      minScore: '最小分數',
      maxMin: '最大 / 最小'
    },
    rotations: {
      preview: '手法預覽',
      strategyPreview: '策略預覽',
      noStrategyPreview: '尚無可預覽策略',
      primary: '一般採集',
      revisit: '再起後採集'
    },
    snapshot: {
      staleBadge: '快照可能過期',
      staleKicker: '保存時快照',
      staleTitle: '這份分析快照可能已不是目前模型的結果',
      staleDesc: '載入後會保留你的輸入與手法，但卡片上的摘要是保存當下的快照。建議回到實驗台後重新分析一次。',
      loadAnyway: '載入實驗',
      cancel: '取消'
    },
    actions: {
      edit: '開啟副本',
      delete: '刪除實驗'
    }
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
    about: {
      title: '關於與致謝',
      description: '秘笈背後的採集資料、圖示與技術支援',
      teamcraft: 'Teamcraft - 採集物品、收藏品獎勵與技能顯示資料',
      xivapi: 'XIVAPI - 採集資料表、收藏品判定與圖示 API 支援'
    },
    changelogTitle: '系統更新',
    changelogDesc: '了解秘笈的最新功能與版本更新內容',
    changelogLink: '查看秘笈版本更新紀錄',
    statsTitle: '採集玩家數值',
    statsDesc: '請填入你在遊戲中真實的裝備數值，以便獲得更精確的演算建議。',
    gearProfilesTitle: '裝備數值設定檔',
    gearProfilesDesc: '預先整理多組採集數值，之後可在求解台或模擬台快速套用。',
    gearProfilesEntryTitle: '管理裝備設定檔',
    gearProfilesEntryDesc: '設定等級、獲得力、鑑別力、GP、食物與收藏品遺物效果。',
    gearProfilesManage: '前往設定',
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
    frontierTitle: '開拓研究模式',
    frontierDesc: '啟用後顯示進階研究入口。此模式會使用你提供的機率假設分析策略，結果僅供研究參考。',
    frontierCollectable: '顯示開拓研究',
    frontierCollectableDesc: '在側邊欄顯示開拓研究與開拓研究庫入口。',
    debugTitle: '專家檢查模式',
    debugDesc: '開啟後，求解結果會顯示公式、機率分布與搜尋統計。',
    solverDebugMode: '顯示求解器檢查資訊',
    solverDebugModeDesc: '適合核對技能手法、期望值與搜尋過程；一般採集時可保持關閉。',
  },
  changelog: {
    title: '版本更新紀錄',
    description: '這裡記錄了秘笈的歷史更新與功能迭代。',
    version: '版本 {v}',
    latest: '最新',
    currentModelVersionsTitle: '現行模型版本',
    currentModelVersionsDescription: '目前秘笈與實驗會寫入結果、藏書庫快照與 JSON 匯出的版本來源。',
    currentModelVersionsSummary: '{count} 個版本',
    modelVersionsButton: '查看現行模型版本',
    modelVersionsClose: '關閉模型版本視窗',
    modelVersionGroups: {
      overall: '整體',
      jsonExport: 'JSON輸出',
      tomeSolver: '秘笈推薦求解器',
      experimentSimulator: '實驗模擬器',
      experimentAnalyzer: '實驗分析器',
      strategyCodec: '決策樹/策略表無損轉換'
    },
    modelVersionKeys: {
      exportSchema: 'JSON 匯出格式',
      app: '冷凍兔肉的秘笈',
      regularSolver: '一般採集推薦模型',
      collectableSolver: '收藏品採集推薦模型',
      regularSimulator: '一般採集模擬模型',
      regularAnalyzer: '一般採集分析模型',
      collectableSimulator: '收藏品策略模擬模型',
      collectableAnalyzer: '收藏品策略分析模型',
      collectableStrategyCodec: '收藏品策略 codec'
    }
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
      boonRate: '基礎額外採集率',
      unknown: '未知',
      maxValue: '最高 {value}',
      maxPercent: '最高 {value}%'
    },
    nodeBonusesTitle: '採集點數值',
    nodeBonuses: {
      baseIntegrity: '節點基礎耐久',
      gatheringCount: '採集次數增加',
      yieldCount: '獲得數增加',
      extraRate: '額外率增加',
      collectableRelicToolBonus: '遺物工具效果',
      collectableRelicToolBonusDesc: '收藏品價值提升率 +20%。',
      enabled: '有',
      disabled: '無'
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
        },
        memoCapacity: {
          title: '記憶體不足，無法完成求解',
          desc: '這組條件需要較大的採集決策記憶體，已達此裝置可用上限。請先縮小條件，或改用較簡單的情境。',
          raiseBudget: '提高記憶體再試',
          manualRisk: '提高記憶體後，瀏覽器可能短暫變慢或分頁停止回應；若裝置資源不足，系統可能會關閉分頁。'
        },
        memoAllocationFailed: {
          title: '無法啟動更高記憶體求解',
          desc: '瀏覽器無法配置這次採集求解需要的記憶體。請縮小條件或改用較簡單的情境。'
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
      workerCalculationTime: 'Worker 運算時間',
      statesSolved: '實際求解狀態',
      memoHits: '快取命中數',
      memoHitRate: '快取命中率',
      actionsEvaluated: '實際評估選項',
      candidateComparisons: '候選比較數',
      branchCount: '分支總數',
      terminalStates: '終端狀態',
      outcomeDistribution: '機率分布表',
      optimality: '節點狀態列舉與最優性說明',
      stateKeyIntro: '下列欄位是一般採集求解器辨識「每個搜尋節點狀態」時會記錄的內容。只要這些值相同，就會視為同一個子問題並共用已算好的結果。',
      stateFields: {
        gp: '目前剩餘 GP。',
        integrity: '目前採集點剩餘耐久，也就是還能執行幾次採集或消耗耐久的動作。',
        hasGathered: '是否已經在這個節點採集過，用來判斷部分技能是否仍可施放。',
        successBonus: '目前已套用在所有採集上的成功率加成總和。',
        successIActive: '獲得率提高 I 類技能是否已啟用，避免同一類效果重複計算。',
        successIIActive: '獲得率提高 II 類技能是否已啟用。',
        successIIIActive: '獲得率提高 III 類技能是否已啟用。',
        boonBonus: '目前已套用的額外採集率加成總和。',
        giftIActive: '額外採集率提高 I 類技能是否已啟用。',
        giftIIActive: '額外採集率提高 II 類技能是否已啟用。',
        allYieldBonus: '整個採集點都會增加的獲得數加成。',
        tidings: '納爾札爾福音 / 諾菲卡福音是否啟用，用來計算額外採集觸發時的獲得數。',
        nextSuccessBonus: '只影響下一次採集的成功率加成。',
        nextYieldBonus: '只影響下一次採集的獲得數加成。',
        wiseReady: '理智同興是否可用，代表耐久恢復技能後可能取得的免費恢復機會。'
      },
      optimalityMethod: '求解器會對每個狀態窮舉可施放技能與直接採集分支，使用 memoization 保存子問題最佳解；因此在目前模型內，根狀態取得的就是全域最佳期望值。',
      tieBreaker: '若期望值在 epsilon 內相同，會選擇更符合施放習慣的等價手法。',
      caveat: '最優性成立於目前建模的普通採集技能、GP、耐久、成功率、Boon、再起與理智同興機率；未納入收藏品、水晶採集與玩家手動中斷。'
    }
  },
  collectableObjective: {
    kicker: '推薦排序權重',
    title: '評分偏好',
    close: '關閉評分偏好',
    intro: '權重會把每次收藏品採集的結果換成分數，求解器會依這個分數排序推薦策略；權重越高，代表越希望策略把結果推向該檔位。',
    solverIntro: '權重會把每次收藏品採集的結果換成分數，求解器會依這個分數排序推薦策略；權重越高，代表越希望策略把結果推向該檔位。',
    analysisIntro: '選擇你想用哪種標準閱讀這份分析結果。權重越高，代表該檔位在期望、最高、最低與分布中越重要；可以在票據總量、高價值交納，或自己的目標之間切換比較。',
    cancel: '取消',
    apply: '套用',
    applyCustom: '套用自訂權重',
    presets: {
      highValue: '高價值優先',
      midValue: '中價值優先',
      lowValue: '低價值優先',
      purpleScrip: '大地紫票優先',
      orangeScrip: '大地橘票優先',
      customTier: '自訂權重'
    },
    presetDescriptions: {
      highValue: '強烈偏向最高檔位，中檔作為備選結果。',
      midValue: '偏向停在中檔，避免為了衝高檔投入太多採集次數。',
      lowValue: '偏向穩定拿到低檔，適合只想保守達標的測試。',
      scrip: '沿用目前獎勵表，以票據總量作為分數。',
      customTier: '自行輸入未達標、低檔、中檔、高檔的分數。'
    },
    tiers: {
      none: '未達標',
      low: '低價值',
      mid: '中價值',
      high: '高價值'
    }
  },
  collectableSolver: {
    badge: '收藏品秘笈',
    title: '收藏品求解台',
    description: '演算法未納入大膽提煉、強化洞察，會依目前評分偏好排序推薦策略。',
    solving: '正在推算收藏品推薦策略...',
    empty: '點擊求解後，這裡會顯示可依狀態判斷的推薦策略。',
    stats: {
      scourValue: '提煉基礎值'
    },
    actions: {
      solve: '求解',
      collect: '收藏品採集',
      scour: '提煉',
      meticulous: '慎重提煉',
      scrutiny: '集中檢查',
      collectorsFocus: '價值矚目',
      primingTouch: '預備碰觸',
      successI: '獲得率提高 I',
      successII: '獲得率提高 II',
      successIII: '獲得率提高 III',
      nextCollectSuccess: '下次收藏成功率提高',
      restoreIntegrity: '石工之理 / 農夫之智',
      wiseToTheWorld: '理智同興',
      revisitCheck: '確認再起'
    },
    results: {
      kicker: 'Recommended Policy',
      title: '推薦策略',
      subtitle: '這不是固定巨集，而是依照隨機結果與收藏價值做判斷的策略。',
      expectedScore: '期望{unit}',
      expectedScripUnit: '評分單位',
      expectedTierCounts: '期望檔位個數',
      maxTierCounts: '最高檔位個數',
      minTierCounts: '最低檔位個數',
      pointUnit: '分',
      scripUnits: {
        purple: '大地紫票',
        orange: '大地橘票',
        unknown: '未知票種'
      },
      expectedReward: '期望收益',
      rewardSummary: '票據 {scrip} / 金幣 {gil}',
      summary: {
        expected: '總期望{unit}',
        max: '總最高{unit}',
        min: '總最低{unit}'
      },
      maxScore: '最高{unit}',
      minScore: '最低{unit}',
      tierCountUnit: '{tier}個數',
      scoreChance: '機率 {chance}',
      revisitIncluded: '總分數已納入再起 {chance}% 機率。',
      limitationNote: '第一版未納入大膽提煉、強化洞察、精選收益模型與實際經驗值換算。'
    },
    policy: {
      now: '現在建議',
      stateSummary: 'GP {gp} / 耐久 {integrity} / 收藏價值 {collectability}',
      nextBranches: '可能分支',
      confirmOutcome: '確認這次結果',
      confirmHint: '請依照遊戲畫面上的狀態逐項確認並選擇。',
      confluentHint: '這次的隨機結果已匯流到同一個狀態，不需要額外選擇。',
      deterministicHint: '這次動作會進入唯一結果，可以直接前往下一步。',
      collectQuestion: '這次收藏品採集有成功嗎？',
      standardQuestion: '這次有觸發(強化)洞察嗎？',
      wiseQuestion: '這次有觸發理智同興嗎？',
      revisitQuestion: '耐久耗盡後有觸發再起嗎？',
      collectabilityQuestion: '現在的收藏價值是多少？',
      integrityQuestion: '現在耐久剩多少？',
      integrityOption: '{integrity} 耐久',
      collectOptions: {
        success: '採集成功',
        failed: '採集失敗'
      },
      standardOptions: {
        proc: '有觸發',
        noProc: '沒有觸發'
      },
      wiseOptions: {
        proc: '有觸發',
        noProc: '沒有觸發'
      },
      revisitOptions: {
        proc: '有觸發',
        noProc: '沒有觸發'
      },
      matchedOutcome: '已對應到',
      confluentOutcome: '結果匯流',
      deterministicOutcome: '確定結果',
      sameOutcome: '不同觸發結果會進入相同狀態',
      readyOutcome: '此動作完成後進入下一狀態',
      waitingSelection: '請先確認上方所有問題。',
      noMatchedOutcome: '目前選項沒有對應分支，請再檢查一次遊戲畫面。',
      continue: '下一步',
      outcomeValue: '收藏價值 {value}，耐久 {integrity}',
      nextAction: '下一步：{action}',
      terminal: '此分支已結束',
      back: '上一層',
      root: '回起點'
    },
    branches: {
      applied: '已施放',
      collectSuccess: '採集成功',
      collectFailed: '採集失敗',
      valueNormal: '未觸發收藏價值提升',
      valueIncreased: '觸發收藏價值提升',
      meticulousSaved: '慎重未消耗耐久',
      meticulousConsumed: '慎重消耗耐久',
      integrityConsumed: '消耗耐久',
      integrityRestored: '恢復耐久',
      wiseProc: '觸發理智同興',
      wiseNoProc: '未觸發理智同興',
      standardProc: '觸發洞察',
      standardNoProc: '未觸發洞察',
      revisitProc: '觸發再起',
      revisitNoProc: '未觸發再起'
    },
    conditions: {
      always: '此動作成功施放後進入下一狀態。',
      collectSuccess: '收藏品採集成功時取得目前檔位收益。',
      collectFailed: '收藏品採集失敗時不取得收益，但仍消耗耐久。',
      refineOutcome: '依收藏價值提升與耐久消耗結果進入下一狀態。',
      integrityRestored: '耐久恢復 1 點，最多不超過此採集點的目前耐久上限。',
      wiseProc: '石工之理或農夫之智恢復耐久後，50% 機率獲得可免費恢復 1 點耐久的理智同興。',
      wiseNoProc: '石工之理或農夫之智恢復耐久後，未獲得理智同興。',
      standardProc: '提煉類動作後觸發 Collector\'s Standard / 洞察。',
      standardNoProc: '提煉類動作後未觸發 Collector\'s Standard / 洞察。',
      revisitProc: '再起觸發時，GP 回滿、耐久與採集次數恢復，並接續再起後決策樹。',
      revisitNoProc: '再起未觸發，本次採集點結束。'
    },
    errors: {
      unsupportedLevel: {
        title: '收藏品採集需要 50 級',
        desc: '目前角色等級未達 {level}，尚未開放收藏品採集。請提高等級後再使用收藏品秘笈。'
      },
      unsupportedReward: {
        title: '找不到收藏品獎勵表',
        desc: '此物品目前不在已支援的收藏品繳納、老主顧、魔法大學、萬貨街、精選或宇宙探索資料中，暫時無法求解。'
      },
      memoCapacity: {
        title: '記憶體不足，無法完成求解',
        desc: '這組條件需要的收藏品決策記憶體已達此裝置可用上限。請先縮小條件或改用較簡單的情境。',
        raiseBudget: '提高記憶體再試',
        manualRisk: '提高記憶體後，瀏覽器可能短暫變慢或分頁停止回應；若裝置資源不足，系統可能會關閉分頁。'
      },
      memoAllocationFailed: {
        title: '無法啟動更高記憶體求解',
        desc: '瀏覽器無法配置這次求解需要的記憶體。請縮小條件或改用較簡單的情境。'
      },
      workerStale: {
        title: '求解器需要重新載入',
        desc: '網站可能剛更新完成，重新整理後即可繼續。'
      },
      workerFailed: {
        title: '收藏品求解器暫時無法啟動',
        desc: '請重新整理頁面後再試一次。'
      }
    },
    export: {
      fileScenario: '收藏品互動決策樹',
      title: '{item} 收藏品決策樹',
      exportedAt: '匯出時間',
      inputTitle: '求解輸入與條件',
      modelVersionsTitle: '模型版本',
      itemId: '物品 ID',
      job: '職業',
      actions: {
        exportHtml: '匯出互動決策樹',
        exportingHtml: '正在匯出決策樹',
        exportedHtml: '已匯出決策樹'
      },
      sections: {
        item: '物品',
        player: '玩家數值',
        food: '食物',
        node: '採集點條件',
        solver: '求解設定'
      },
      fields: {
        item: '物品',
        timedNode: '限時點',
        baseStats: '裝備原始數值',
        effectiveStats: '食物後數值',
        foodBonus: '食物加成',
        solverVersion: '求解器版本',
        itemLevel: '物品等級',
        baseGathering: '獲得力基準',
        basePerception: '鑑別力基準',
        maxIntegrity: '實際耐久',
        rewardSource: '獎勵來源',
        rewardItem: '獎勵物品',
        rewardTiers: '獎勵門檻',
        manualMemoCapacityPower: '手動記憶體容量'
      },
      rootNode: '起始節點',
      nodeCount: '節點數',
      howToReadTitle: '閱讀方式',
      howToReadDesc: '每個節點代表一個採集狀態，請依照「建議動作」執行後，在「結果分支」中找到遊戲實際發生的結果，再前往該分支標示的下一個節點。',
      nodeIndexTitle: '節點索引',
      node: '節點',
      state: '狀態',
      recommendedAction: '建議動作',
      nodeExpectedScore: '節點期望分數',
      resultBranches: '結果分支',
      noBranches: '此節點沒有後續分支。',
      outcome: '結果',
      branchScore: '分支分數',
      nextStep: '下一步',
      revisitGateSummary: '確認再起：觸發（{procProbability}）前往 {procNext}；未觸發（{noProcProbability}）結束',
      end: '結束',
      stateSummary: 'GP {gp} / 耐久 {integrity} / 收藏價值 {collectability}',
      outcomeSummary: 'GP {gp} / 耐久 {integrity} / 收藏價值 {collectability}'
    },
    debug: {
      open: '查看收藏品求解器偵錯資訊',
      close: '關閉偵錯視窗',
      kicker: 'Collectable Debug',
      title: '收藏品公式與策略驗證',
      subtitle: '這裡列出本次求解使用的公式、reward table 與搜尋統計。',
      formulas: '公式輸入',
      success: '收藏品採集成功率',
      collectableFormula: '收藏品公式',
      valueIncreaseRate: '收藏價值提升率',
      relicToolBonus: '遺物工具加算',
      meticulousRate: '慎重不耗率',
      scrutiny: '集中檢查',
      standardRate: 'Collector\'s Standard 機率',
      rewardTable: '獎勵門檻',
      objective: '目前評分權重',
      objectivePreset: '權重檔',
      objectiveUnit: '分數單位',
      objectiveNote: '這些權重只用來排序推薦策略；數字越高，代表該結果在本次求解中越值得追求。',
      itemWeight: '物品 {itemId}',
      objectiveKinds: {
        scrip: '票據總量',
        exp: '經驗值',
        gil: '金幣',
        custom: '自訂收益',
        tierScore: '檔位權重'
      },
      objectiveUnits: {
        exp: '經驗值',
        gil: '金幣',
        custom: '自訂分數',
        tierScore: '分'
      },
      rewardWeights: {
        scrip: '票據',
        exp: '經驗值',
        gil: '金幣'
      },
      low: '低標',
      mid: '中標',
      high: '高標',
      scripAmount: '{scrip} 張票',
      search: '搜尋統計',
      branchCount: '分支數',
      primaryPlan: '目前 GP 決策樹',
      revisitPlan: '再起後滿 GP 決策樹',
      limitations: '第一版限制',
      stateKeyIntro: '下列欄位是收藏品求解器辨識「每個決策樹節點狀態」時會記錄的內容。節點代表你在遊戲畫面上可能看到的一個採集狀態，求解器會根據這些值決定下一步推薦動作。',
      stateFields: {
        gp: '目前剩餘 GP。',
        integrity: '目前剩餘耐久，也就是還能承受幾次消耗耐久的動作。',
        collectability: '目前收藏價值，會影響交付檔位與後續是否值得繼續提煉。',
        scrutinyActive: '集中檢查是否啟用，會影響下一次提煉類動作的收藏價值提升。',
        collectorsFocusActive: '價值矚目是否啟用，會影響價值提升率。',
        primingTouchActive: '預備碰觸是否啟用，會影響慎重提煉不消耗耐久的機率。',
        standardActive: 'Collector\'s Standard / 洞察是否啟用，代表可使用對應的後續效果。',
        hasUsedCollectableAction: '是否已使用過提煉或收藏品採集動作，用來判斷部分狀態與限制。',
        hasCollected: '是否已經執行過收藏品採集，避免同一個節點重複收取收益。',
        successBonus: '目前已套用在收藏品採集上的成功率加成總和。',
        successIActive: '獲得率提高 I 類技能是否已啟用。',
        successIIActive: '獲得率提高 II 類技能是否已啟用。',
        successIIIActive: '獲得率提高 III 類技能是否已啟用。',
        nextCollectSuccessBonus: '只影響下一次收藏品採集的成功率加成。',
        wiseToTheWorldActive: '理智同興是否可用，代表可免費恢復 1 點耐久。'
      },
      optimalityNote: '求解器會用上述節點狀態列舉進行 DP policy search：在每個狀態比較目前支援的收藏品技能、成功率補強技能與收取分支，推薦成立於目前模型內。'
    },
    limitations: {
      'brazen-excluded': '未納入大膽提煉，因隨機分布尚未確認。',
      'high-standard-excluded': '未納入強化洞察，因觸發機率尚未確認。',
      'reduction-reward-model-excluded': '未納入精選收益模型。'
    }
  },
  collectableStrategyLab: {
    strategyListKicker: '策略列表',
    strategyListTitle: '規則由上而下套用',
    strategyListAria: '收藏品策略列表',
    addStrategy: '新增策略',
    emptyStrategyTitle: '尚未建立策略',
    emptyStrategyDesc: '新增第一條策略後，右側會立刻展開決策樹並顯示尚待決策的狀態。',
    loadSimpleExample: '載入簡單範例',
    simpleExample: {
      improveName: '提高價值',
      collectName: '採集'
    },
    export: {
      fileScenario: '收藏品實驗決策樹',
      title: '{item} 收藏品實驗決策樹',
      appSubtitle: '收藏品實驗台',
      inputTitle: '實驗輸入與條件',
      currentAction: '目前動作',
      sections: {
        experiment: '實驗設定'
      },
      fields: {
        coverage: '已決策節點'
      },
      status: {
        decided: '已套用策略',
        terminal: '已完成',
        uncovered: '尚待決策',
        limited: '展開已停止'
      }
    },
    treeKicker: '決策樹覆蓋',
    treeTitle: '目前展開狀態',
    loadingBaseValues: '正在載入收藏品基礎值。',
    calculatingTree: '正在展開策略樹，請稍候。',
    collectableLevelLockedTitle: '收藏品採集尚未開放',
    collectableLevelLockedDesc: '收藏品採集需要等級 {level}。目前等級不足時，實驗區不會展開決策樹或執行分析。',
    actionLevelRequirement: '需要等級 {level}',
    ruleLevelIssue: '這條策略含有目前等級 {level} 尚未學會的技能，請調整技能或提高等級。',
    strategyLevelIssueTitle: '策略含有目前不能使用的技能',
    strategyLevelIssueDesc: '{action} 需要等級 {level}。請回到策略設定移除或替換該技能，或調整角色等級後再分析。',
    limitWarning: '目前策略展開過大，已先停止後續展開；請新增更收斂的策略再觀察。',
    uncoveredTitle: '尚待決策節點總覽',
    noUncoveredDesc: '目前所有分枝都能一路走到耐久歸零。',
    pendingOverview: {
      total: '共 {count} 個待決節點',
      uniqueValues: '{count} 種數值',
      buffCount: '{count} 種狀態',
      nodeCount: '{count} 節點',
      gp: 'GP',
      integrity: '耐久',
      collectability: '收藏價值'
    },
    managedOverview: {
      rangesTitle: '狀態範圍',
      buffTitle: 'Buff 總覽',
      collectSuccessRate: '採集成功率',
      valueIncreaseRate: '價值提升率',
      meticulousSaveRate: '慎重提煉不耗耐久率',
      noneHasBuff: '沒有 {buff}',
      someHasBuff: '部分有 {buff}',
      allHasBuff: '全部有 {buff}'
    },
    previousUncovered: '上一個待決節點',
    nextUncovered: '下一個待決節點',
    nodePager: '第 {current} / {total} 個',
    pendingState: '待決狀態',
    noBuff: '無 Buff',
    pathTitle: '過往路徑',
    noPath: '尚無過往路徑。',
    defaultRuleName: '策略 {index}',
    coverageNodes: '{count} 節點',
    noConditions: '無條件',
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
      false: '無'
    },
    summary: {
      totalNodes: '總節點',
      decidedNodes: '已決策',
      uncoveredNodes: '尚待決策',
      terminalNodes: '終止'
    },
    nodeStatuses: {
      decided: '已納管',
      uncovered: '待決策',
      terminal: '已終止',
      limited: '已達展開上限'
    },
    analysis: {
      title: '分析報告',
      subtitle: '依目前策略規則計算收藏品分數、機率分布與收益落點。',
      noRevisitNotice: '實驗台以單次採集點為範圍，分析結果不包含再起後重新採集的情況。',
      run: '進行分析',
      running: '分析中',
      runningDesc: '正在計算策略結果，請稍候。',
      empty: '點擊上方按鈕開始分析目前策略。',
      unsupportedReward: '找不到此收藏品的支援獎勵表，暫時無法評分。',
      summary: '總結',
      expectedScore: '期望{unit}',
      maxScore: '最高{unit}',
      minScore: '最低{unit}',
      distribution: '機率分布表',
      distributionScrip: '票據機率分布',
      distributionWeightedScore: '加權總分機率分布',
      distributionTierCounts: '檔位個數機率分布',
      distributionUnitScrip: '分布表單位：{unit}',
      distributionUnitWeightedScore: '分布表單位：權重加權總分',
      distributionUnitTierCounts: '分布表單位：檔位獲得個數',
      weightedScoreUnit: '加權總分',
      scoringNote: '分布表會依目前評分偏好切換單位：票據顯示票據量，檔位優先顯示獲得個數，自訂權重顯示加權總分。'
    },
    tools: {
      moveUp: '上移',
      moveDown: '下移',
      edit: '編輯',
      delete: '刪除'
    },
    editor: {
      kicker: '策略設定',
      close: '關閉策略設定',
      managedNodes: '納管的節點',
      skills: '技能選擇',
      conditionSection: '策略條件',
      skillSection: '選擇對應的技能',
      name: '策略名稱',
      when: '符合',
      allConditions: '全部條件',
      anyCondition: '任一條件',
      then: '時執行',
      actionPreview: '策略技能預覽',
      viewManagedNodes: '查看納管的節點',
      summaryMode: '彙總',
      individualMode: '個別',
      managedNodesNotice: '僅列出策略展開至本項前，尚待決策且符合此條件的節點；不包含套用本策略技能後才產生的後續狀態。',
      calculatingNodes: '正在計算節點…',
      noManagedNodes: '這條策略目前還沒有套用到任何節點。',
      effectPreview: '數值變化',
      effectPreviewDescription: '依策略展開出的節點，顯示本策略生效時每個技能單次施展可能造成的變化範圍。',
      effectPreviewNoNodes: '這條策略目前沒有套用節點，尚無可計算的變化範圍。',
      effectPreviewCastableNodes: '可施展節點：{count}',
      effectPreviewUnavailable: '此技能在目前展開節點中不會被施展。',
      appliedStateRange: '套用後節點狀態範圍',
      appliedStateRangeDescription: '只統計這條策略目前納管的節點；會反覆套用本策略，直到狀態不再納管或分支結束。',
      appliedStateRangeLimited: '這條策略的分支很多，這裡先顯示目前可整理的狀態範圍。',
      appliedCompleteBranches: 'Complete：{complete}/{total} 分支',
      appliedAllComplete: '所有分支都已結束',
      effectMetrics: {
        collectabilityGain: '價值提升 {range}',
        integrityDelta: '耐久 {range}',
        scrutinyBonus: '提煉值加成 {value}',
        valueIncreaseRate: '價值提升率 {from} → {to}（{delta}，×1.75）',
        meticulousSaveRate: '慎重不耗耐久率 {from} → {to}（{delta}）',
        collectSuccessBonus: '採集成功率 {value}',
        nextCollectSuccessBonus: '下次採集成功率 {value}',
        collectSuccessRate: '採集成功率 {range}',
        collectSuccessGp: '成功時 GP {range}'
      },
      backToMain: '返回',
      save: '儲存',
      removeCondition: '移除條件',
      addCondition: '加條件',
      actionChain: '串聯技能',
      singleAction: '單一技能',
      appendAction: '加技能',
      removeLastAction: '刪技能',
      done: '完成'
    },
    fields: {
      gp: 'GP',
      integrity: '耐久',
      collectability: '收藏價值',
      scrutinyActive: '集中檢查',
      collectorsFocusActive: '價值矚目',
      primingTouchActive: '預備碰觸',
      standardActive: '洞察',
      highStandardActive: '強化洞察',
      anyStandardActive: '洞察或強化洞察',
      hasUsedCollectableAction: '已用收藏品技能',
      hasCollected: '已採集過',
      successBonus: '採集成功率加成',
      successIActive: '獲得率 I',
      successIIActive: '獲得率 II',
      successIIIActive: '獲得率 III',
      nextCollectSuccessBonus: '下次採集成功率',
      wiseToTheWorldActive: '理智同興'
    },
    fieldDescriptions: {
      collectability: '目前收藏價值。常用來判斷要繼續提煉，還是已達目標檔位可以開始採集。',
      integrity: '目前剩餘耐久。常用來判斷是否該收尾、繼續提煉，或先恢復耐久。',
      gp: '目前剩餘 GP。常用來限制集中檢查、價值矚目、預備碰觸與恢復耐久等耗 GP 技能。',
      scrutinyActive: '集中檢查是否已啟用。啟用後會強化下一次提煉類技能，提煉後消耗。',
      collectorsFocusActive: '價值矚目是否已啟用。啟用後會提高下一次提煉類技能的價值提升機率，提煉後消耗。',
      primingTouchActive: '預備碰觸是否已啟用。啟用後只影響下一次慎重提煉的不消耗耐久機率。',
      standardActive: '洞察是否已觸發。常用來讓有洞察的分支改走慎重提煉或其他高價值判斷。',
      highStandardActive: '強化洞察是否已觸發。常用來讓強化洞察分支改走大膽提煉或其他高倍率判斷。',
      anyStandardActive: '一般洞察或強化洞察是否已觸發。常用來讓任何洞察分支共用同一條策略。',
      wiseToTheWorldActive: '理智同興是否可用。通常用來在觸發後立刻免費恢復 1 點耐久。',
      successIActive: '獲得率 I 是否已套用。用來避免重複使用同階成功率補強。',
      successIIActive: '獲得率 II 是否已套用。用來避免重複使用同階成功率補強。',
      successIIIActive: '獲得率 III 是否已套用。用來避免重複使用同階成功率補強。',
      successBonus: '目前整個採集點已累積的收藏品採集成功率加成，來自獲得率 I/II/III。',
      nextCollectSuccessBonus: '只套用在下一次收藏品採集的成功率加成，採集一次後就會消耗。',
      hasUsedCollectableAction: '是否已使用過提煉或收藏品採集類動作。多半是進階分支或偵錯用的流程旗標。',
      hasCollected: '是否已經按過收藏品採集。多半用來區分採集前後的進階收尾規則。'
    },
    nodeState: 'GP {gp} / 耐久 {integrity} / 收藏價值 {collectability}',
    chips: {
      scrutinyActive: '集中檢查',
      collectorsFocusActive: '價值矚目',
      primingTouchActive: '預備碰觸',
      standardActive: '洞察',
      wiseToTheWorldActive: '理智同興',
      successBonus: '成功率 +{value}',
      nextCollectSuccessBonus: '下次 +{value}',
      hasUsedCollectableAction: '已開始',
      hasCollected: '已採集'
    }
  },
  tomeLibrary: {
    title: '秘笈書庫',
    subtitle: '管理已儲存的採集秘笈，搜尋物品後即可快速載回求解器調整。',
    searchPlaceholder: '搜尋秘笈名稱或物品名稱',
    noFood: '未使用食物',
    unknownDate: '未知時間',
    rotationPreview: '保存時手法預覽',
    startFromAction: '從 {action} 開始',
    createdAt: '建立於 {time}',
    emptyTitle: '書庫目前是空的',
    emptyDesc: '在秘笈求解器演算出手法後，按下「儲存秘笈」就會收進這裡。',
    emptySearchTitle: '找不到相符的秘笈',
    emptySearchDesc: '可以改用當前語系名稱或英文名稱搜尋看看。',
    rows: {
      playerStats: '玩家數值',
      gpState: 'GP 狀態',
      food: '食物',
      nodeBonuses: '採集點獎勵',
      objectiveMode: '求解模式',
      relicBonus: '遺物加成'
    },
    nodeState: {
      regular: '次數 +{gathering} / 獲得 +{yield} / 額外率 +{extra}',
      collectable: '次數 +{gathering}'
    },
    relicBonus: {
      enabled: '已納入',
      disabled: '未納入'
    },
    snapshot: {
      expectedYield: '期望獲得量',
      maxYield: '最大獲得量',
      minYield: '最小獲得量',
      expectedScore: '期望分數',
      maxScore: '最大分數',
      minScore: '最小分數',
      staleBadge: '快照可能過期',
      staleKicker: '保存時快照',
      staleTitle: '這張秘笈快照可能已不是目前模型的結果',
      staleDesc: '載入後會保留你的輸入條件，但卡片上的推薦摘要是保存當下的快照。建議回到秘笈後重新求解一次。',
      loadAnyway: '載入秘笈'
    },
    actions: {
      edit: '開啟副本',
      copyMacro: '預覽巨集',
      copyMacroStates: {
        copied: '已複製',
        partial: '已複製前 15 行',
        failed: '複製失敗'
      },
      delete: '刪除秘笈'
    },
    editModeConflict: {
      kicker: '求解模式不同',
      title: '要用哪一種人格進入求解台？',
      desc: '這張秘笈使用「{tomeMode}」，目前設定頁是「{currentMode}」。你可以覆蓋設定頁的人格，也可以保留現有設定進入。',
      useTomeMode: '覆蓋為秘笈模式',
      useCurrentMode: '保留現有模式',
      cancel: '取消'
    }
  },
  gearProfiles: {
    title: '裝備數值設定檔設定',
    description: '把常用的採集數值先存成設定檔，需要求解或模擬時再單向套用。',
    back: '返回',
    listTitle: '設定檔列表',
    unnamed: '未命名設定檔',
    defaultBadge: '預設',
    loadProfile: '載入設定檔',
    relicShort: '遺物',
    defaults: {
      miner: '預設採掘師',
      botanist: '預設園藝師'
    },
    jobs: {
      universal: '採掘師 / 園藝師'
    },
    actions: {
      add: '新增',
      save: '儲存設定檔',
      saved: '已儲存',
      delete: '刪除設定檔'
    },
    editor: {
      newTitle: '新增設定檔',
      editTitle: '編輯設定檔',
      defaultLocked: '預設設定檔不可刪除，職業類別固定。',
      name: '設定檔名稱',
      namePlaceholder: '例如：滿禁斷採集裝',
      jobs: '可套用職業',
      currentGp: '當前 GP',
      maxGp: '裝備 GP 上限',
      relic: '遺物工具效果',
      relicDesc: '僅影響收藏品系統的價值提升率。'
    },
    picker: {
      title: '載入裝備設定檔',
      description: '只會列出可套用到目前物品職業的設定檔。',
      empty: '目前沒有可套用到此職業的設定檔。',
      manage: '管理設定檔'
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
  },
  sponsorModal: {
    title: '支持冷凍兔肉的秘笈',
    description: '感謝您的支持！由於支付平台（PayPal/Stripe）在台灣有區域轉帳限制，建議台灣玩家優先使用「台灣地區（綠界）」進行贊助，海外玩家則可使用「全球地區（Ko-fi）」。如有任何問題，請聯繫：{email}',
    twProvider: '台灣地區 (綠界科技)',
    twDesc: '支援超商代碼、ATM、國內信用卡，最適合台灣玩家支持。',
    globalProvider: '全球地區 (Ko-fi / PayPal)',
    globalDesc: '適合海外玩家，支援信用卡與 PayPal，且具備 Discord 自動身分組整合。'
  }
}
