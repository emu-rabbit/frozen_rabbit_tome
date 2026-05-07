export default {
  app: {
    title: '冷凍兔肉の秘伝書',
    subtitle: '兎肉が教える採集の秘訣',
    description: 'FFXIV 大地使者スキル推奨ツール'
  },
  common: {},
  nav: {
    createGuide: '秘伝書を作成',
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
    statsDesc: 'より正確なおすすめを表示するために、ゲーム内での現在のステータスを入力してください。'
  },
  game: {
    jobs: {
      miner: '採掘師',
      botanist: '園芸師'
    },
    stats: {
      gathering: '獲得力',
      perception: '識質力',
      gp: 'GP'
    }
  },
  welcomeModal: {
    title: '秘伝書へようこそ',
    subtitle: '開始する前に、ご希望の言語を選択してください',
    description: 'これにより、インターフェース全体の言語が調整されます。後で「設定」からいつでも変更できます。',
    confirm: 'この言語で開始する'
  }
}
