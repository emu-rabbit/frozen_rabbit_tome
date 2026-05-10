export default {
  app: {
    title: '冷凍兔肉の秘伝書',
    subtitle: '兎肉が教える採集の秘訣',
    description: 'FFXIV 大地使者スキル推奨ツール'
  },
  common: {},
  macro: {
    prompts: {
      gatherCount: '{count} 回採集してください',
      conditionalGatherCount: '理知興起が発動したら {count} 回採集してください',
      finalGather: '最後まで採集してください',
      finalConditionalGather: '理知興起が発動したら最後まで採集してください',
      continueAfterSeconds: '{message}。{seconds} 秒後にマクロが続行します'
    },
    preview: {
      kicker: 'FFXIV 採集マクロ',
      title: '採集マクロのプレビュー',
      close: 'マクロプレビューを閉じる',
      singleTitle: 'マクロ内容',
      partTitle: 'マクロ #{index}',
      singleSummary: 'このマクロは {lines} 行です。そのままゲーム内へコピーできます。',
      splitSummary: 'このマクロは {lines} 行です。ゲーム内の 15 行制限に合わせて {count} 個に分割しました。',
      groupSummary: 'この結果には {count} 組のマクロ、合計 {lines} 行が含まれます。各組を個別にコピーできます。',
      lineCount: '{count} / 15 行',
      copySingle: 'マクロをコピー',
      copyPart: '#{index} をコピー',
      copyStates: {
        copied: 'コピー済み',
        failed: 'コピー失敗'
      }
    }
  },
  nav: {
    createGuide: '秘伝書を作成',
    solver: '秘伝書ソルバー',
    tomeLibrary: '秘伝書ライブラリ',
    settings: '設定ページ',
    github: 'GitHub プロジェクト'
  },
  createGuide: {
    title: '採集アイテムの選択',
    subtitle: '名前で検索できます。見つからない場合は英語での検索をお試しください',
    dataScope: '採掘師と園芸師の採集アイテムのみを表示します。',
    searchPlaceholder: 'アイテム名を入力',
    loading: 'データ読み込み中、しばらくお待ちください…',
    noResults: '該当するアイテムが見つかりません。英語で検索してみてください。',
    typeToSearch: 'アイテム名を入力して検索',
    resultCount: '{count}{plus} 件',
    glv: 'Glv',
    noTranslation: '(公式翻訳なし)',
    collectableSystem: '収集品システム',
    crystalGatheringSystem: 'クリスタル採集システム',
    regularSystem: '通常採集系統',
    apiError: 'XIVAPIから収集品データを取得できませんでした。ネットワーク接続を確認するか、後でもう一度お試しください。',
    retrySearch: '再検索'
  },
  settings: {
    title: '秘伝書の設定',
    description: '秘伝書の各種設定を調整します',
    appearanceTitle: '外観設定',
    appearanceDesc: '秘伝書の視覚スタイルを調整します',
    darkMode: 'ダークモード',
    darkModeDesc: 'ダークモードを有効にします。暗い環境での使用に適しています',
    language: '言語設定',
    languageDesc: 'ウェブサイトの表示言語。翻訳がない場合は英語で表示されます',
    langOptions: {
      tw: '繁體中文',
      en: 'English',
      ja: '日本語',
      cn: '简体中文'
    },
    aboutTitle: 'このプロジェクトについて',
    aboutDesc: '「冷凍兔肉の秘伝書」は、FFXIV の採集プレイヤー向けに設計されたツールボックスです。',
    statsTitle: 'ステータス設定',
    statsDesc: 'より正確なおすすめを表示するために、ゲーム内での現在のステータスを入力してください。',
    macroTitle: '採集マクロ',
    macroDesc: '手動採集を促す時の待機時間を調整します。初期値はアイテム 1 個につき 4 秒、追加バッファ 2 秒です。',
    macroSecondsPerGather: '1 個ごとの待機',
    macroBufferSeconds: '追加バッファ',
    solverModeTitle: 'ソルバー目標モード',
    solverModeDesc: '手順を評価するときに重視する目標を選択します。',
    solverModes: {
      expected: '通常モード',
      max: '選ばれし者モード',
      min: '慎重モード'
    },
    solverModeDetails: {
      expected: '期待値で評価します。従来のサイトと同じ安定したモードです。',
      max: '到達可能な最大獲得数だけで評価します。確率は評価に入りません。',
      min: '最悪時の最小獲得数だけで評価します。堅実な採集計画向けです。'
    },
    debugTitle: '専門家向けデバッグモード',
    debugDesc: '有効にすると、計算結果に数式、確率分布、最適性チェックを表示します。',
    solverDebugMode: 'ソルバーのデバッグ情報を表示',
    solverDebugModeDesc: '手順、期待値、探索過程の検証向けです。通常利用ではオフのままで構いません。',
  },
  solver: {
    title: '秘伝書ソルバー',
    statsTitle: '現在の採集環境ステータス',
    currentGp: '開始時 GP',
    effectiveMaxGp: '食事込み満タン GP',
    maxGp: '装備最大 GP',
    noItemTitle: 'アイテム未選択',
    noItemDesc: '「秘伝書を作成」から採集アイテムを検索して選擇してください。',
    goToCreate: '作成ページへ',
    collectableWarning: '収集品システムは現在開発中です',
    crystalGatheringWarning: 'クリスタル採集システムは現在開発中です',
    syncToSettings: '{job}設定を保存',
    syncSuccess: '設定を保存しました',
    food: {
      label: '食事',
      placeholder: '食事を検索',
      nq: 'NQ',
      hq: 'HQ',
      max: '上限'
    },
    results: {
      gatheringRate: '基本採集成功率',
      boonRate: '基本ボーナス発生率'
    },
    nodeBonusesTitle: '採集ポイントの数値',
    nodeBonuses: {
      baseIntegrity: '採集場所の基礎耐久',
      gatheringCount: '採集回数増加',
      yieldCount: '獲得数増加',
      extraRate: '特殊採集発生率増加'
    },
    strategy: {
      title: 'おすすめ採集手順',
      description: '現在の数値から期待獲得数が最大の手順を計算します。',
      modeDescriptions: {
        expected: '通常モード：現在の数値から期待獲得数が最大の手順を計算します。',
        max: '選ばれし者モード：現在の数値から最大獲得数が最も高い手順を計算します。',
        min: '慎重モード：現在の数値から最小獲得数が最も安定する手順を計算します。'
      },
      copyMacro: 'マクロを確認',
      copyMacroStates: {
        copied: 'コピーしました',
        partial: '先頭 15 行をコピー',
        failed: 'コピー失敗'
      },
      saveTome: '秘伝書を保存',
      savedTome: '保存しました',
      solve: '計算',
      totalExpectedYield: '合計期待獲得数',
      summary: {
        expected: '合計期待獲得数',
        max: '合計最大獲得数',
        min: '合計最小獲得数'
      },
      expectedYield: '期待総獲得数',
      maxYield: '最大獲得数',
      minYield: '最小獲得数',
      yieldChance: '確率 {chance}%',
      chanceWithRevisit: '再発見込み：{chance}% の確率',
      rotationOrder: '手順',
      primaryRotation: '通常手順',
      revisitRotation: '再発見発動後の手順',
      revisitBadge: '再発見発動',
      rotationTitles: {
        primary: '採集手順',
        primaryWithRevisit: '採集手順（再発見後も同じ手順）',
        revisit: '採集手順（再発見発動後）'
      },
      revisitSameRotationNote: {
        expected: '合計期待値には再発見確率を含めています。',
        max: '最大値と確率には再発見の可能性を含めています。',
        min: '最小値と確率には再発見の可能性を含めています。'
      },
      revisitTotalNote: {
        expected: '合計期待値には再発見確率を含めています。',
        max: '最大値と確率には再発見後の手順を含めています。',
        min: '最小値と確率には再発見後の手順を含めています。'
      },
      empty: '上のボタンを押しておすすめ手順を計算します',
      gatherAction: '採集',
      conditionalSuffix: '（発動時）',
      conditionalGatherSuffix: '（理知発動）'
    },
    debug: {
      open: 'ソルバーのデバッグ情報を表示',
      close: 'デバッグ画面を閉じる',
      kicker: 'Solver Debug',
      title: '期待値と最適性の検証',
      subtitle: '今回の計算で使った数式、獲得数分布、動的計画法の探索統計を表示します。',
      formulas: '数式入力',
      successFormula: '採集成功率',
      successScoreFormula: '成功率スコア = floor(100 * {gathering} / {baseGathering}) = {score}',
      rawSuccess: '区分関数の基礎値',
      levelModifier: 'レベル補正',
      levelDifference: 'レベル差',
      finalSuccess: '最終成功率',
      boonFormula: 'ボーナス発生率',
      boonScoreFormula: 'ボーナススコア = min(150, floor(100 * {perception} / {basePerception})) = {score}',
      finalBoon: '最終ボーナス発生率',
      bountifulFormula: 'バウンティフル系',
      plusTwoThreshold: '+2 閾値',
      plusThreeThreshold: '+3 閾値',
      bountifulAmount: '今回のスキル加算',
      gatherFormula: '採集状態',
      integrity: '耐久',
      nodeYieldBonus: '採集場所の獲得数',
      nodeBoonBonus: '採集場所のボーナス率',
      gpRecovered: '採集ごとの回復',
      expectedValue: '総期待値',
      revisitChance: '再発見確率',
      plans: '手順ごとの結果',
      primaryPlan: '通常手順',
      revisitPlan: '再発見発動後の手順',
      startingGp: '開始 GP',
      minYield: '最小',
      maxYield: '最大',
      statesSolved: '解いた状態',
      memoHits: 'Memo 命中',
      actionsEvaluated: '評価済み分岐',
      optimality: '最適性の説明',
      optimalityMethod: 'ソルバーは各状態で使用可能な全アクション分岐と直接採集分岐を評価し、memoization で部分問題の最良解を保存します。現在のモデル内では、根状態の解が大域的に最大の期待値になります。',
      tieBreaker: '期待値が epsilon の範囲内で同値の場合、rotationPreferenceScore により実用上の詠唱順に近い等価手順を選びます。',
      caveat: '最適性は、現在モデル化されている通常採集スキル、GP、耐久、成功率、Boon、再発見、理知興起の確率に対して成立します。収集品、クリスタル採集、手動中断は含まれません。'
    }
  },
  tomeLibrary: {
    title: '秘伝書ライブラリ',
    subtitle: '保存した採集秘伝書を管理し、アイテム検索からソルバーへ読み戻せます。',
    searchPlaceholder: '保存したアイテム名を検索',
    noFood: '食事なし',
    unknownDate: '不明な時刻',
    rotationPreview: '最適手順プレビュー',
    createdAt: '作成日時 {time}',
    emptyTitle: 'ライブラリはまだ空です',
    emptyDesc: 'ソルバーで手順を計算したあと、「秘伝書を保存」を押すとここに保存されます。',
    emptySearchTitle: '一致する秘伝書がありません',
    emptySearchDesc: '現在の表示言語名、または英語名で検索してみてください。',
    rows: {
      playerStats: 'プレイヤー数値',
      gpState: 'GP 状態',
      food: '食事',
      nodeBonuses: '採集ポイントボーナス',
      objectiveMode: 'ソルバーモード'
    },
    actions: {
      edit: '編集',
      copyMacro: 'マクロを確認',
      copyMacroStates: {
        copied: 'コピーしました',
        partial: '先頭 15 行をコピー',
        failed: 'コピー失敗'
      },
      delete: '削除'
    }
  },
  game: {
    jobs: {
      miner: '採掘師',
      botanist: '園芸師'
    },
    stats: {
      level: 'レベル',
      gathering: '獲得力',
      perception: '技術力',
      gp: 'GP'
    },
    units: {
      times: '回',
      count: '個',
      percent: '%',
      secondsSuffix: ' 秒'
    }
  },
  welcomeModal: {
    title: '秘伝書へようこそ',
    subtitle: '開始する前に、ご希望の言語を選択してください',
    description: 'これにより、インターフェース全体の言語が調整されます。後で「設定」からいつでも変更できます。',
    confirm: 'この言語で開始する'
  }
}
