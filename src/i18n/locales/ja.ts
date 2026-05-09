export default {
  app: {
    title: '冷凍兔肉の秘伝書',
    subtitle: '兎肉が教える採集の秘訣',
    description: 'FFXIV 大地使者スキル推奨ツール'
  },
  common: {},
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
    glv: 'Glv',
    noTranslation: '(公式翻訳なし)',
    collectableSystem: '収集品システム',
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
      copyMacro: 'マクロをコピー',
      saveTome: '秘伝書を保存',
      savedTome: '保存しました',
      solve: '計算',
      expectedYield: '期待総獲得数',
      maxYield: '最大獲得数',
      minYield: '最小獲得数',
      rotationOrder: '手順',
      empty: '上のボタンを押しておすすめ手順を計算します',
      gatherAction: '採集',
      conditionalSuffix: '（発動時）',
      conditionalGatherSuffix: '（理知発動）'
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
      nodeBonuses: '採集ポイントボーナス'
    },
    actions: {
      edit: '編集',
      copyMacro: 'マクロをコピー',
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
      percent: '%'
    }
  },
  welcomeModal: {
    title: '秘伝書へようこそ',
    subtitle: '開始する前に、ご希望の言語を選択してください',
    description: 'これにより、インターフェース全体の言語が調整されます。後で「設定」からいつでも変更できます。',
    confirm: 'この言語で開始する'
  }
}
