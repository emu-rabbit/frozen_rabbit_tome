export default {
  app: {
    title: '冷凍兔肉の秘伝書',
    subtitle: '兎肉が教える採集の秘訣',
    description: 'FFXIV 大地使者スキル推奨ツール'
  },
  common: {
    cancel: 'キャンセル',
    backToSelection: 'アイテム選択に戻る',
    displayMode: '表示モード',
    displayModes: {
      compact: '簡潔',
      detailed: '詳細'
    },
    pending: {
      collectableDesc: '収集品採集システムは現在開発中です。公開まで今しばらくお待ちください。',
      crystalDesc: 'クリスタル採集システムは現在開発中です。公開まで今しばらくお待ちください。'
    }
  },
  saveEntry: {
    nameLabel: '名前',
    cancel: 'キャンセル',
    tome: {
      title: '秘伝書を保存',
      description: '後でライブラリから見分けやすいように、この秘伝書に名前を付けます。',
      confirm: '秘伝書を保存'
    },
    experiment: {
      title: '実験を保存',
      description: '後でデータベースから見分けやすいように、この実験に名前を付けます。',
      confirm: '実験を保存'
    }
  },
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
    createGuide: '新しい秘伝書を作成',
    solver: '秘伝書ソルバー',
    createExperiment: '新しい実験を作成',
    favoriteItems: 'お気に入りアイテム',
    tomeLibrary: '秘伝書庫',
    experimentDatabase: '実験データベース',
    faq: 'よくある質問',
    settings: '設定ページ',
    github: 'GitHub プロジェクト',
    sponsor: '電気代を支援する'
  },
  faq: {
    title: 'よくある質問',
    description: '秘伝書の対応範囲と、使い始める前に確認しやすい内容をまとめています。',
    items: [
      {
        q: 'このプロジェクトのスキルセットとアイテムはどのバージョンのものですか？',
        a: '本プロジェクトのスキルセットとアイテムは、Final Fantasy XIV パッチ 7.5 の内容に対応しています。'
      },
      {
        q: '秘伝書と実験の違いは何ですか？',
        a: '秘伝書はソルバーです。装備ステータス、GP、採集回数、採集場所のボーナス、目標を入力すると、現在対応しているモデルの範囲内で計算し、スキル手順をおすすめします。実験はシミュレーションと分析のための機能です。同じ条件に加えて、試したいスキル列や戦略を入力すると、シミュレーターが結果を計算し、アナライザーが報酬の到達帯、確率分布、リスクを整理して、自分の手順を比較しやすくします。'
      },
      {
        q: 'このサイトのソルバーが出力するのは最適解ですか？',
        a: '本サイトは多くの状況と選択した目標に合わせて、もっともおすすめしやすいスキル手順を出力します。ただし、どの手順にもそれぞれ長所と短所があり、プレイスタイルの流派のように、必ずしも完璧な答えが一つに決まるわけではありません。より深く分析したい場合は、本サイトの実験エリアでシミュレーションと分析を行うことを強くおすすめします。'
      },
      {
        q: 'ソルバーがどのように動いているのか教えてもらえますか？',
        a: 'ソルバーは使用可能なスキル手順の分岐を展開し、設定された目標に合わせて各分岐を採点します。そのうえで最高点の手順から、同点の場合はプレイヤーの使用感により合いやすい順番を優先しておすすめの解答として表示します。'
      },
      {
        q: 'クリスタル類アイテムに対応していない理由と、なぜ大胆純化や強活眼もソルバーの探索範囲に入っていないのですか？',
        a: '現時点では、大地の恵み、大胆純化、強活眼の詳しい計算式や確率分布がまだ分かっていないためです。また、大胆純化は探索木をかなり大きく広げてしまい、計算負荷も高くなります。十分なデータや実装の見通しがそろい次第、兔肉もできるだけ早く対応していきます。'
      },
      {
        q: 'マクロが半自動と書かれているのはなぜですか？',
        a: '採集そのものはプレイヤーがゲーム画面のメニューをクリックして行う必要があるため、マクロだけで採集作業をすべて完了することはできません。また、収集品システムもマクロには対応していません。画面上の実際の状態を見て、次に行うアクションを判断する必要があるためです。'
      },
      {
        q: 'お気に入りアイテムとライブラリ、データベースの違いは何ですか？',
        a: 'お気に入りアイテムは、アイテムそのものだけを保存する場所だと考えてください。プレイヤーの装備ステータス、採集場所のボーナス、計算された採集手順や分析結果は保存されません。一方、秘伝書ライブラリと実験データベースではそれらの情報も保存されます。お気に入りアイテムは、同じアイテムをよく使い、そのたびに数値を調整したいプレイヤー向けです。'
      },
      {
        q: 'どうしてうさぎを冷凍するのですか？焼いて食べてもいいですか？',
        a: 'ダメです。'
      },
      {
        q: 'サイトの現在の状態について',
        a: 'このサイトは現在アルファテスト段階にあり、多くの機能が不安定な状態です。現在、皆様からのフィードバックを募集しています。バグ報告や改善の提案がありましたら、お気軽に <a href="https://github.com/emu-rabbit/frozen_rabbit_tome/issues" target="_blank" rel="noreferrer" class="text-soft-green-600 hover:text-soft-green-700 font-bold underline decoration-dotted underline-offset-4 transition-colors">GitHub Issues</a> までお寄せください！'
      }
    ],
    footer: '他に質問がありますか？GitHubでの報告、またはメールでお問い合わせください：{email}'
  },
  createGuide: {
    title: '採集アイテムの選択',
    description: 'ここでアイテムを検索・選択し、ソルバーに入っておすすめの採集手順を計算します。',
    dataScope: '採掘師と園芸師の採集アイテムのみを表示します。クリスタル類アイテムにもまだ対応していません。',
    searchPlaceholder: '名前で検索、見つからない場合は英語での検索をお試しください',
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
  createExperiment: {
    title: '採集アイテムの選択',
    description: 'ここでアイテムを検索・選択し、シミュレーターに入って実験と分析を行います。',
    dataScope: '採掘師と園芸師の採集アイテムのみを表示します。クリスタル類アイテムにもまだ対応していません。'
  },
  favoriteItems: {
    title: 'お気に入りアイテム',
    subtitle: 'よく使う採集アイテムを保存し、必要なときに秘伝書や実験へすぐ移動できます。',
    count: '{count} 件',
    addAction: 'お気に入りに追加',
    removeAction: 'お気に入りから削除',
    emptyTitle: 'お気に入りアイテムはまだありません',
    emptyDesc: '新しい秘伝書または新しい実験の検索結果でハートを押すと、ここに追加されます。',
    dialog: {
      kicker: '次の操作を選択',
      title: '{item} を使う',
      close: '選択ウィンドウを閉じる',
      guideDesc: 'ソルバーに入っておすすめの採集手順を計算します',
      experimentDesc: 'シミュレーターに入って実験と分析を行います'
    },
    filters: {
      open: 'お気に入りアイテムを絞り込む',
      close: '絞り込みウィンドウを閉じる',
      kicker: '絞り込み条件',
      title: 'お気に入りアイテムを絞り込む',
      text: 'テキスト検索',
      textPlaceholder: '名前で検索、見つからない場合は英語での検索をお試しください',
      glvMin: 'Glv 下限',
      glvMax: 'Glv 上限',
      noLimit: '制限なし',
      jobs: '採集可能ジョブ',
      systems: '採集システム',
      clear: '絞り込みをクリア',
      done: '完了',
      emptyTitle: '条件に一致するお気に入りアイテムがありません',
      emptyDesc: 'テキスト、Glv、ジョブ、採集システムの条件を調整できます。',
      systemOptions: {
        regular: '通常',
        collectable: '収集品',
        crystal: 'クリスタル'
      }
    }
  },
  simulator: {
    noItemTitle: '実験アイテム未選択',
    noItemDesc: '先に実験を作成し、通常採集アイテムを選択してください。',
    goToCreate: '実験作成へ',
    collectablePending: '収集品採集システムは後で実装予定です。',
    crystalPending: 'クリスタル採集システムは後で実装予定です。',
    statsTitle: '実験数値',
    perceptionWarning: '技術力が不足しているため、このアイテムは採集できません。',
    integrity: '耐久',
    tabsLabel: '採集手順タブ',
    clearRotation: '{name}をクリア',
    rotationSimulation: '指定手順のシミュレーション',
    copyPrimaryRotation: '通常手順をコピー',
    primaryGathering: '通常採集',
    revisitGathering: '再発見後の採集',
    emptyPrimaryRotation: '下のスキルを押して手順を作成します。',
    emptyRevisitRotation: '耐久が 0 になった後、再発見発動時の 2 つ目の手順を作成できます。',
    removeFromHere: 'このスキル以降を削除',
    rotationIssueTitle: 'この手順には使用できないスキルがあります',
    rotationIssueDesc: '赤く表示されたスキルを確認してください。現在の数値ではレベル、GP、耐久、または前提条件が満たされていません。',
    primaryRotationAnalysis: '通常採集手順',
    revisitRotationAnalysis: '再発見後の手順',
    rates: {
      success: '採集成功率',
      boon: 'ボーナス発生率',
      currentGp: '現在 GP'
    },
    actions: {
      simulate: '分析する',
      save: '実験を保存',
      saved: '保存済み',
      copyReport: 'レポートをコピー',
      copied: 'コピー済み'
    },
    analysis: {
      title: '分析レポート',
      subtitle: '設定したスキル回しに基づく期待値',
      noRevisitNotice: '実験台の分析は 1 つの採集ポイント内に限定され、再発見後の再採集は含みません。',
      empty: '上のボタンを押して分析を開始します',
      summary: '概要',
      expectedYield: '期待獲得数',
      maxYield: '最大獲得数',
      minYield: '最小獲得数',
      chance: '確率 {chance}%',
      revisitNote: '再発見 {chance}% の確率を含みます。'
    },
    actionCategories: {
      gather: '採集アクション',
      success: '獲得率アップ',
      boon: 'ボーナス発生率アップ',
      nextSuccess: '次回獲得率アップ',
      nextYield: '次回獲得数アップ',
      restore: '耐久回復',
      wholeYield: '採集場所全体の獲得数アップ',
      boonYield: 'ボーナス獲得数アップ'
    }
  },
  experimentDatabase: {
    title: '実験データベース',
    subtitle: '保存した通常採集実験と収集品実験を管理し、シミュレーターへ読み戻して再分析できます。',
    searchPlaceholder: '実験名またはアイテム名を検索',
    emptyTitle: '実験データベースはまだ空です',
    emptyDesc: 'シミュレーターで分析したあと、「実験を保存」を押すとここに保存されます。',
    emptySearchTitle: '一致する実験がありません',
    emptySearchDesc: '現在の表示言語名、または英語名で検索してみてください。',
    unknownDate: '不明な時刻',
    regularExperiment: '通常採集実験',
    collectableExperiment: '収集品実験',
    countValue: '{count} 個',
    createdAt: '作成日時 {time}',
    rows: {
      playerStats: 'プレイヤー数値',
      gpState: 'GP 状態',
      nodeBonuses: '採集ポイントボーナス',
      totalExpected: '合計期待値',
      expectedScore: '期待スコア',
      maxMin: '最大 / 最小'
    },
    rotations: {
      preview: '手順プレビュー',
      strategyPreview: '戦略プレビュー',
      noStrategyPreview: 'プレビューできる戦略はまだありません',
      primary: '通常採集',
      revisit: '再発見後の採集'
    },
    actions: {
      edit: '編集',
      copyReport: 'レポートをコピー',
      copied: 'コピー済み',
      delete: '実験を削除'
    }
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
    about: {
      title: '概要と謝辞',
      description: '秘伝書を支える採集データ、アイコン、技術サポート',
      teamcraft: 'Teamcraft - 採集アイテム、収集品報酬、アクション表示データ',
      xivapi: 'XIVAPI - 採集データ表、収集品判定、アイコン API サポート'
    },
    changelogTitle: 'システムアップデート',
    changelogDesc: '秘伝書の最新機能やアップデート履歴を確認できます',
    changelogLink: '秘伝書のアップデート履歴を見る',
    statsTitle: 'ステータス設定',
    statsDesc: 'より正確なおすすめを表示するために、ゲーム内での現在のステータスを入力してください。',
    gearProfilesTitle: '装備ステータスプロファイル',
    gearProfilesDesc: '複数の採集ステータスを用意し、ソルバーやシミュレーターで素早く読み込めます。',
    gearProfilesEntryTitle: '装備プロファイルを管理',
    gearProfilesEntryDesc: 'レベル、獲得力、識質力、GP、食事、収集品向けレリック効果を設定します。',
    gearProfilesManage: '設定へ進む',
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
    debugTitle: '専門家向けチェックモード',
    debugDesc: '有効にすると、計算結果に数式、確率分布、探索統計を表示します。',
    solverDebugMode: 'ソルバーのチェック情報を表示',
    solverDebugModeDesc: 'スキル回し、期待値、探索過程の確認向けです。通常利用ではオフのままで構いません。',
  },
  changelog: {
    title: 'アップデート履歴',
    description: '秘伝書の更新履歴や新機能はこちらで確認できます。',
    version: 'バージョン {v}',
    latest: '最新'
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
      boonRate: '基本ボーナス発生率',
      unknown: '不明',
      maxValue: '最大 {value}',
      maxPercent: '最大 {value}%'
    },
    nodeBonusesTitle: '採集ポイントの数値',
    nodeBonuses: {
      baseIntegrity: '採集場所の基礎耐久',
      gatheringCount: '採集回数増加',
      yieldCount: '獲得数増加',
      extraRate: '特殊採集発生率増加',
      collectableRelicToolBonus: 'レリック道具効果',
      collectableRelicToolBonusDesc: '収集品の価値上昇率 +20%。',
      enabled: 'あり',
      disabled: 'なし'
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
      workerErrors: {
        reload: '再読み込み',
        workerStale: {
          title: 'ソルバーの再読み込みが必要です',
          desc: 'サイトが更新された直後のため、古いページから新しい計算リソースを読み込めない可能性があります。再読み込みして続行してください。'
        },
        workerFailed: {
          title: 'ソルバーを起動できませんでした',
          desc: 'ページを再読み込みしてもう一度お試しください。続く場合は、時間を置いてから再度お試しください。'
        }
      },
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
      workerCalculationTime: 'Worker 計算時間',
      statesSolved: '実計算した状態',
      memoHits: 'キャッシュ命中数',
      memoHitRate: 'キャッシュ命中率',
      actionsEvaluated: '評価した選択肢',
      candidateComparisons: '候補比較数',
      branchCount: '総分岐数',
      terminalStates: '終端状態',
      outcomeDistribution: '確率分布表',
      optimality: 'ノード状態の一覧と最適性',
      stateKeyIntro: '以下の項目は、通常採集ソルバーが各探索ノードの状態を識別するために記録する内容です。すべての値が同じなら同じ部分問題として扱い、計算済みの結果を再利用します。',
      stateFields: {
        gp: '現在の残り GP。',
        integrity: '採集場所の残り耐久。あと何回、採集または耐久を消費する行動ができるかを表します。',
        hasGathered: 'このノードですでに採集したかどうか。一部アクションがまだ使えるかの判定に使います。',
        successBonus: 'すべての採集に適用される成功率ボーナスの合計。',
        successIActive: '採集成功率アップ I 系の効果が有効かどうか。同系統の重複計算を防ぎます。',
        successIIActive: '採集成功率アップ II 系の効果が有効かどうか。',
        successIIIActive: '採集成功率アップ III 系の効果が有効かどうか。',
        boonBonus: '現在適用されている Boon 発生率ボーナスの合計。',
        giftIActive: 'Boon 発生率アップ I 系の効果が有効かどうか。',
        giftIIActive: 'Boon 発生率アップ II 系の効果が有効かどうか。',
        allYieldBonus: '採集場所全体に適用される獲得数ボーナス。',
        tidings: 'Tidings 系の効果が有効かどうか。Boon 発生時の獲得数計算に使います。',
        nextSuccessBonus: '次の 1 回の採集だけに適用される成功率ボーナス。',
        nextYieldBonus: '次の 1 回の採集だけに適用される獲得数ボーナス。',
        wiseReady: '理知興起が使用可能かどうか。耐久回復後の無料回復機会を表します。'
      },
      optimalityMethod: 'ソルバーは各状態で使用可能な全アクション分岐と直接採集分岐を評価し、memoization で部分問題の最良解を保存します。現在のモデル内では、根状態の解が大域的に最大の期待値になります。',
      tieBreaker: '期待値が epsilon の範囲内で同値の場合、実用上のスキル回しに近い等価手順を選びます。',
      caveat: '最適性は、現在モデル化されている通常採集スキル、GP、耐久、成功率、Boon、再発見、理知興起の確率に対して成立します。収集品、クリスタル採集、手動中断は含まれません。'
    }
  },
  collectableObjective: {
    kicker: 'おすすめ順の重み',
    title: '評価設定',
    close: '評価設定を閉じる',
    intro: '重みは各収集品の結果をスコアに変換します。ソルバーはそのスコアで方針を並べ替えます。重みが高いほど、その段階を強く狙う設定です。',
    solverIntro: '重みは各収集品の結果をスコアに変換します。ソルバーはそのスコアで方針を並べ替えます。重みが高いほど、その段階を強く狙う設定です。',
    analysisIntro: 'この分析結果をどの基準で読みたいかを選びます。重みが高い段階ほど、期待値、最大、最小、分布で重視されます。スクリップ総量、高価値納品、自分の目標を切り替えて比較できます。',
    cancel: 'キャンセル',
    apply: '適用',
    applyCustom: 'カスタム重みを適用',
    presets: {
      highValue: '高価値優先',
      midValue: '中価値優先',
      lowValue: '低価値優先',
      purpleScrip: 'ギャザラー紫貨優先',
      orangeScrip: 'ギャザラー橙貨優先',
      customTier: 'カスタム重み'
    },
    presetDescriptions: {
      highValue: '最高段階を強く優先し、中段階を予備の候補にします。',
      midValue: '高段階へ押し上げるために採集回数を使いすぎず、中段階を優先します。',
      lowValue: '保守的な検証向けに、低段階へ安定して到達することを優先します。',
      scrip: '現在の報酬表を使い、スクリップ総量で採点します。',
      customTier: '未達、低、中、高の各段階に任意の点数を入力します。'
    },
    tiers: {
      none: '未達',
      low: '低価値',
      mid: '中価値',
      high: '高価値'
    }
  },
  collectableSolver: {
    badge: '収集品秘伝書',
    title: '収集品ソルバー',
    description: '大胆純化と強活眼は未対応です。現在の評価設定に基づいて推奨方針を並べ替えます。',
    solving: '収集品の推奨方針を計算中...',
    empty: '計算すると、状態に応じた推奨方針がここに表示されます。',
    stats: { scourValue: '純化基礎値' },
    actions: {
      solve: '計算',
      exportDecisionTree: '決定木を書き出す',
      exportingDecisionTree: '書き出し中',
      exportedDecisionTree: '書き出し済み',
      collect: '収集品採集',
      scour: '純化',
      meticulous: '慎重純化',
      scrutiny: '集中検分',
      collectorsFocus: 'バリューフォーカス',
      primingTouch: 'プライミングタッチ',
      successI: '採集成功率アップ I',
      successII: '採集成功率アップ II',
      successIII: '採集成功率アップ III',
      nextCollectSuccess: '次回収集成功率アップ',
      restoreIntegrity: '石工の理 / 老農の知',
      wiseToTheWorld: '理知興起',
      revisitCheck: '再発見確認'
    },
    results: {
      kicker: 'Recommended Policy',
      title: '推奨方針',
      subtitle: '固定マクロではなく、proc と収集価値に応じて判断する方針です。',
      expectedScore: '期待{unit}',
      expectedScripUnit: '評価単位',
      expectedTierCounts: '期待段階数',
      maxTierCounts: '最大段階数',
      minTierCounts: '最小段階数',
      pointUnit: '点',
      scripUnits: {
        purple: 'ギャザラー紫貨',
        orange: 'ギャザラー橙貨',
        unknown: '不明なスクリップ種別'
      },
      expectedReward: '期待報酬',
      rewardSummary: 'スクリップ {scrip} / ギル {gil}',
      summary: {
        expected: '合計期待{unit}',
        max: '合計最大{unit}',
        min: '合計最小{unit}'
      },
      maxScore: '最大{unit}',
      minScore: '最小{unit}',
      tierCountUnit: '{tier}数',
      scoreChance: '確率 {chance}',
      revisitIncluded: '合計スコアには再発見 {chance}% の確率を含みます。',
      limitationNote: 'V1 では大胆純化、強活眼、精選報酬モデル、実際の経験値換算を含みません。'
    },
    policy: {
      now: '現在の推奨',
      stateSummary: 'GP {gp} / 耐久 {integrity} / 収集価値 {collectability}',
      nextBranches: '分岐候補',
      confirmOutcome: '今回の結果を確認',
      confirmHint: 'ゲーム画面の状態を見ながら一つずつ確認し、選択してください。',
      confluentHint: '今回のランダム結果は同じ状態に合流するため、追加の選択は不要です。',
      deterministicHint: 'このアクションの結果は 1 つだけです。そのまま次へ進めます。',
      collectQuestion: '今回の収集品採集は成功しましたか？',
      standardQuestion: '(強)活眼は発生しましたか？',
      wiseQuestion: '理知興起は発動しましたか？',
      revisitQuestion: '耐久を使い切った後、再発見は発動しましたか？',
      collectabilityQuestion: '現在の収集価値はいくつですか？',
      integrityQuestion: '現在の耐久はいくつ残っていますか？',
      integrityOption: '耐久 {integrity}',
      collectOptions: {
        success: '採集成功',
        failed: '採集失敗'
      },
      standardOptions: {
        proc: '発動した',
        noProc: '発動していない'
      },
      wiseOptions: {
        proc: '発動した',
        noProc: '発動していない'
      },
      revisitOptions: {
        proc: '再発見あり',
        noProc: '再発見なし'
      },
      matchedOutcome: '対応した結果',
      confluentOutcome: '結果が合流',
      deterministicOutcome: '確定結果',
      sameOutcome: '異なる発動結果でも同じ状態に進みます',
      readyOutcome: 'このアクション後、次の状態へ進みます',
      waitingSelection: '上の質問をすべて確認してください。',
      noMatchedOutcome: 'この選択に対応する分岐がありません。ゲーム画面をもう一度確認してください。',
      continue: '次へ',
      outcomeValue: '収集価値 {value}、耐久 {integrity}',
      nextAction: '次：{action}',
      terminal: 'この分岐はここで終了',
      back: '戻る',
      root: '起点'
    },
    branches: {
      applied: '使用済み',
      collectSuccess: '採集成功',
      collectFailed: '採集失敗',
      valueNormal: '収集価値上昇なし',
      valueIncreased: '収集価値上昇あり',
      meticulousSaved: '慎重純化で耐久消費なし',
      meticulousConsumed: '慎重純化で耐久消費',
      integrityConsumed: '耐久消費',
      integrityRestored: '耐久回復',
      wiseProc: '理知興起発動',
      wiseNoProc: '理知興起なし',
      standardProc: '活眼発生',
      standardNoProc: '活眼なし',
      revisitProc: '再発見発動',
      revisitNoProc: '再発見なし'
    },
    conditions: {
      always: 'このアクションを使用して次の状態へ進みます。',
      collectSuccess: '収集品採集に成功し、現在の報酬段階を得ます。',
      collectFailed: '収集品採集に失敗し、報酬は得られませんが耐久は消費します。',
      refineOutcome: '収集価値上昇と耐久消費の結果に応じて進みます。',
      integrityRestored: '耐久を 1 回復します。現在の採集地点の耐久上限を超えません。',
      wiseProc: '石工の理 / 老農の知で耐久を回復した後、50% の確率で無料の理知興起を得ます。',
      wiseNoProc: '石工の理 / 老農の知で耐久を回復した後、理知興起は発動しません。',
      standardProc: '収集品アクション後に活眼が発生します。',
      standardNoProc: '収集品アクション後に活眼が発生しません。',
      revisitProc: '再発見が発動すると GP が全回復し、耐久と採集回数が戻り、再発見後の決定木へ進みます。',
      revisitNoProc: '再発見が発動しなかったため、この採集場所は終了です。'
    },
    errors: {
      unsupportedLevel: { title: '収集品採集にはレベル 50 が必要です', desc: '現在のレベルは {level} 未満のため、収集品採集はまだ開放されていません。レベルを上げてから収集品秘訣を使用してください。' },
      unsupportedReward: { title: '報酬テーブルが見つかりません', desc: 'このアイテムは対応済みの収集品納品、お得意様、魔法大学、ワチュメキメキ万貨街、精選、またはコスモエクスプローラーのデータにないため、まだ計算できません。' },
      memoCapacity: { title: 'メモリ不足のため計算を完了できません', desc: 'この条件では、この端末で収集品判断に使えるメモリ上限に達しました。条件を絞るか、より単純な状況でお試しください。' },
      workerStale: { title: 'ソルバーの再読み込みが必要です', desc: 'サイト更新直後の可能性があります。再読み込みしてからお試しください。' },
      workerFailed: { title: '収集品ソルバーを起動できません', desc: 'ページを再読み込みしてもう一度お試しください。' }
    },
    export: {
      title: '{item} 収集品決定木',
      exportedAt: '書き出し日時',
      itemId: 'アイテム ID',
      job: 'ジョブ',
      rootNode: '起点ノード',
      nodeCount: 'ノード数',
      howToReadTitle: '読み方',
      howToReadDesc: '各ノードは採集状態を表します。「推奨アクション」を実行した後、ゲーム内で実際に起きた結果を「結果分岐」から探し、その分岐に示された次のノードへ進みます。',
      nodeIndexTitle: 'ノード索引',
      node: 'ノード',
      state: '状態',
      recommendedAction: '推奨アクション',
      nodeExpectedScore: 'ノード期待スコア',
      resultBranches: '結果分岐',
      noBranches: 'このノードには後続分岐がありません。',
      outcome: '結果',
      branchScore: '分岐スコア',
      nextStep: '次',
      revisitGateSummary: '再発見確認：発生（{procProbability}）なら {procNext} へ、未発生（{noProcProbability}）なら終了',
      end: '終了',
      stateSummary: 'GP {gp} / 耐久 {integrity} / 収集価値 {collectability}',
      outcomeSummary: 'GP {gp} / 耐久 {integrity} / 収集価値 {collectability}'
    },
    debug: {
      open: '収集品ソルバーのデバッグ情報を開く',
      close: 'デバッグ画面を閉じる',
      kicker: 'Collectable Debug',
      title: '収集品公式と方針の検証',
      subtitle: '今回の計算で使った公式、reward table、探索統計を表示します。',
      formulas: '公式入力',
      success: '収集品採集成功率',
      collectableFormula: '収集品公式',
      valueIncreaseRate: '収集価値上昇率',
      relicToolBonus: 'レリック道具加算',
      meticulousRate: '慎重純化の耐久保存率',
      scrutiny: '集中検分',
      standardRate: '活眼発生率',
      rewardTable: '報酬しきい値',
      objective: '現在の評価ウェイト',
      objectivePreset: 'ウェイト設定',
      objectiveUnit: '評価単位',
      objectiveNote: 'これらのウェイトは推奨方針の並び替えにだけ使います。数値が高いほど、この計算で重視される結果です。',
      itemWeight: 'アイテム {itemId}',
      objectiveKinds: {
        scrip: 'スクリップ合計',
        exp: '経験値',
        gil: 'ギル',
        custom: 'カスタム報酬',
        tierScore: '段階ウェイト'
      },
      objectiveUnits: {
        exp: '経験値',
        gil: 'ギル',
        custom: 'カスタム点',
        tierScore: '点'
      },
      rewardWeights: {
        scrip: 'スクリップ',
        exp: '経験値',
        gil: 'ギル'
      },
      low: '低',
      mid: '中',
      high: '高',
      scripAmount: 'スクリップ {scrip}',
      search: '探索統計',
      branchCount: '分岐数',
      primaryPlan: '現在 GP の決定木',
      revisitPlan: '再発見後の満 GP 決定木',
      limitations: 'V1 の制限',
      stateKeyIntro: '以下の項目は、収集品ソルバーが各決定木ノードの状態を識別するために記録する内容です。ノードはゲーム画面上で起こり得る 1 つの採集状態を表し、ソルバーはこれらの値から次の推奨アクションを決めます。',
      stateFields: {
        gp: '現在の残り GP。',
        integrity: '現在の残り耐久。あと何回、耐久を消費する行動を受けられるかを表します。',
        collectability: '現在の収集価値。報酬段階と、さらに精選を続ける価値があるかに影響します。',
        scrutinyActive: '集中検分が有効かどうか。次の収集品精選アクションの収集価値上昇に影響します。',
        collectorsFocusActive: 'バリューフォーカスが有効かどうか。収集価値上昇率に影響します。',
        primingTouchActive: 'プライミングタッチが有効かどうか。慎重純化の耐久保存率に影響します。',
        standardActive: '活眼が有効かどうか。対応する後続効果に使います。',
        hasUsedCollectableAction: '精選または収集品採集アクションをすでに使ったかどうか。状態と制限の判定に使います。',
        hasCollected: '収集品採集をすでに実行したかどうか。同じノードで報酬を重複取得しないために使います。',
        successBonus: '収集品採集に適用される成功率ボーナスの合計。',
        successIActive: '採集成功率アップ I 系の効果が有効かどうか。',
        successIIActive: '採集成功率アップ II 系の効果が有効かどうか。',
        successIIIActive: '採集成功率アップ III 系の効果が有効かどうか。',
        nextCollectSuccessBonus: '次の収集品採集だけに適用される成功率ボーナス。',
        wiseToTheWorldActive: '理知興起が使用可能かどうか。耐久を 1 回復できる無料効果を表します。'
      },
      optimalityNote: 'ソルバーは上記のノード状態を使って DP policy search を行います。各状態で、現在サポートしている収集品アクション、成功率補助スキル、収集分岐を比較します。推奨はこのモデル内で成立します。'
    },
    limitations: {
      'brazen-excluded': '大胆純化はランダム分布が未確認のため含めていません。',
      'high-standard-excluded': '強活眼は発生率が未確認のため含めていません。',
      'reduction-reward-model-excluded': '精選報酬モデルは含めていません。'
    }
  },
  collectableStrategyLab: {
    strategyListKicker: '方針リスト',
    strategyListTitle: 'ルールは上から順に適用',
    strategyListAria: '収集品方針リスト',
    addStrategy: '方針を追加',
    emptyStrategyTitle: '方針はまだありません',
    emptyStrategyDesc: '最初の方針を追加すると、右側で決定木が展開され、未決定の状態が表示されます。',
    loadSimpleExample: '簡単な例を読み込む',
    simpleExample: {
      improveName: '価値を上げる',
      collectName: '採集'
    },
    treeKicker: '決定木カバー率',
    treeTitle: '現在の展開状態',
    loadingBaseValues: '収集品の基礎値を読み込み中です。',
    collectableLevelLockedTitle: '収集品採集はまだ開放されていません',
    collectableLevelLockedDesc: '収集品採集にはレベル {level} が必要です。それまでは、実験で決定木の展開や分析を実行しません。',
    actionLevelRequirement: 'レベル {level} が必要',
    ruleLevelIssue: 'この方針には現在のレベル {level} ではまだ使えないスキルがあります。スキルを調整するか、レベルを上げてください。',
    strategyLevelIssueTitle: 'この方針には使用できないスキルがあります',
    strategyLevelIssueDesc: '{action} はレベル {level} が必要です。方針設定で削除または置き換えるか、キャラクターレベルを調整してから分析してください。',
    limitWarning: '現在の方針では展開が大きすぎるため、途中で停止しました。より絞り込んだ方針を追加して確認してください。',
    uncoveredTitle: '未決定ノード',
    noUncoveredDesc: '現在、すべての分岐は耐久 0 まで進めます。',
    previousUncovered: '前の未決定ノード',
    nextUncovered: '次の未決定ノード',
    nodePager: '{current} / {total}',
    pendingState: '未決定状態',
    noBuff: 'Buff なし',
    pathTitle: 'これまでの経路',
    noPath: 'これまでの経路はありません。',
    defaultRuleName: '方針 {index}',
    coverageNodes: '{count} ノード',
    noConditions: '条件なし',
    booleanCondition: '{label}: {value}',
    branchJoiner: ' / ',
    pathStep: '{action}：{branch}',
    pathStepWithRule: '{rule} -> {action}：{branch}',
    joiners: {
      all: '、',
      any: ' または '
    },
    booleanValues: {
      true: 'あり',
      false: 'なし'
    },
    summary: {
      totalNodes: '総ノード',
      decidedNodes: '決定済み',
      uncoveredNodes: '未決定',
      terminalNodes: '終端'
    },
    analysis: {
      title: '分析レポート',
      subtitle: '現在の方針ルールにもとづき、収集品スコア、確率分布、報酬の着地点を計算します。',
      noRevisitNotice: '実験台の分析は 1 つの採集ポイント内に限定され、再発見後の再採集は含みません。',
      run: '分析する',
      empty: '上のボタンで現在の方針を分析します。',
      unsupportedReward: 'この収集品の対応報酬表が見つからないため、まだ採点できません。',
      summary: '概要',
      expectedScore: '期待{unit}',
      maxScore: '最高{unit}',
      minScore: '最低{unit}',
      distribution: 'スコア確率分布',
      scoringNote: '結果は現在の評価設定で表示されます。歯車設定を切り替えて再分析すると、スクリップ、段階数、カスタム点を比較できます。'
    },
    tools: {
      moveUp: '上へ移動',
      moveDown: '下へ移動',
      edit: '編集',
      delete: '削除'
    },
    editor: {
      kicker: '方針設定',
      close: '方針設定を閉じる',
      name: '方針名',
      when: '条件',
      allConditions: 'すべての条件',
      anyCondition: 'いずれかの条件',
      then: 'に一致したら実行',
      removeCondition: '条件を削除',
      addCondition: '条件を追加',
      actionChain: '連続アクション',
      singleAction: '単一アクション',
      addAction: 'アクションを追加',
      removeAction: 'アクションを削除',
      done: '完了'
    },
    fields: {
      gp: 'GP',
      integrity: '耐久',
      collectability: '収集価値',
      scrutinyActive: '集中検分',
      collectorsFocusActive: 'バリューフォーカス',
      primingTouchActive: 'プライミングタッチ',
      standardActive: '活眼',
      hasUsedCollectableAction: '収集品アクション使用済み',
      hasCollected: '採集済み',
      successBonus: '採集成功率ボーナス',
      successIActive: '採集成功率 I',
      successIIActive: '採集成功率 II',
      successIIIActive: '採集成功率 III',
      nextCollectSuccessBonus: '次回採集成功率',
      wiseToTheWorldActive: '理知興起'
    },
    fieldDescriptions: {
      collectability: '現在の収集価値です。目標段階まで純化を続けるか、採集を始めるかの判断に使います。',
      integrity: '現在の残り耐久です。締めに入るか、純化を続けるか、先に耐久を回復するかの判断に使います。',
      gp: '現在の残り GP です。集中検分、バリューフォーカス、プライミングタッチ、耐久回復など GP を使うアクションの条件に使います。',
      scrutinyActive: '集中検分が有効かどうかです。次の純化系アクションを強化し、その後消費されます。',
      collectorsFocusActive: 'バリューフォーカスが有効かどうかです。次の純化系アクションの価値上昇率を上げ、その後消費されます。',
      primingTouchActive: 'プライミングタッチが有効かどうかです。次の慎重純化の耐久消費なし確率だけに影響します。',
      standardActive: '活眼が発動しているかどうかです。活眼ありの分岐を慎重純化など高価値の判断へ分ける時に使います。',
      wiseToTheWorldActive: '理知興起が使用可能かどうかです。発動後にすぐ無料で耐久を 1 回復する判断によく使います。',
      successIActive: '採集成功率 I が適用済みかどうかです。同じ段階の成功率補強を重複使用しないために使います。',
      successIIActive: '採集成功率 II が適用済みかどうかです。同じ段階の成功率補強を重複使用しないために使います。',
      successIIIActive: '採集成功率 III が適用済みかどうかです。同じ段階の成功率補強を重複使用しないために使います。',
      successBonus: '採集場所全体に累積している収集品採集成功率ボーナスです。採集成功率 I/II/III から加算されます。',
      nextCollectSuccessBonus: '次の収集品採集だけに適用される成功率ボーナスです。採集を 1 回試すと消費されます。',
      hasUsedCollectableAction: '純化または収集品採集を使ったことがあるかどうかです。主に上級分岐やデバッグ用の進行フラグです。',
      hasCollected: '収集品採集を押したことがあるかどうかです。主に採集前後を分ける上級の締めルールに使います。'
    },
    nodeState: 'GP {gp} / 耐久 {integrity} / 収集価値 {collectability}',
    chips: {
      scrutinyActive: '集中検分',
      collectorsFocusActive: 'バリューフォーカス',
      primingTouchActive: 'プライミングタッチ',
      standardActive: '活眼',
      wiseToTheWorldActive: '理知興起',
      successBonus: '成功率 +{value}',
      nextCollectSuccessBonus: '次回 +{value}',
      hasUsedCollectableAction: '開始済み',
      hasCollected: '採集済み'
    }
  },
  tomeLibrary: {
    title: '秘伝書ライブラリ',
    subtitle: '保存した採集秘伝書を管理し、アイテム検索からソルバーへ読み戻せます。',
    searchPlaceholder: '秘伝書名またはアイテム名を検索',
    noFood: '食事なし',
    unknownDate: '不明な時刻',
    rotationPreview: '最適手順プレビュー',
    startFromAction: '{action} から開始',
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
    },
    editModeConflict: {
      kicker: 'ソルバーモードが異なります',
      title: 'どのモードでソルバーへ入りますか？',
      desc: 'この秘伝書は「{tomeMode}」、現在の設定は「{currentMode}」です。設定側のモードを上書きするか、現在の設定のまま入れます。',
      useTomeMode: '秘伝書モードで上書き',
      useCurrentMode: '現在のモードを使う',
      cancel: 'キャンセル'
    }
  },
  gearProfiles: {
    title: '装備ステータスプロファイル設定',
    description: 'よく使う採集ステータスをプロファイルとして保存し、必要な時に一方向で読み込めます。',
    back: '戻る',
    listTitle: 'プロファイル一覧',
    unnamed: '無名プロファイル',
    defaultBadge: '既定',
    loadProfile: 'プロファイル読込',
    relicShort: 'レリック',
    defaults: {
      miner: '既定の採掘師',
      botanist: '既定の園芸師'
    },
    jobs: {
      universal: '採掘師 / 園芸師'
    },
    actions: {
      add: '追加',
      save: 'プロファイルを保存',
      saved: '保存しました',
      delete: 'プロファイルを削除'
    },
    editor: {
      newTitle: '新規プロファイル',
      editTitle: 'プロファイル編集',
      defaultLocked: '既定プロファイルは削除できず、職業も固定です。',
      name: 'プロファイル名',
      namePlaceholder: '例：禁断済み採集装備',
      jobs: '適用できる職業',
      currentGp: '現在 GP',
      maxGp: '装備 GP 上限',
      relic: 'レリック道具効果',
      relicDesc: '収集品システムの価値上昇率にのみ影響します。'
    },
    picker: {
      title: '装備プロファイルを読み込む',
      description: '現在のアイテム職業に適用できるプロファイルだけを表示します。',
      empty: 'この職業に適用できるプロファイルはまだありません。',
      manage: 'プロファイル管理'
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
  },
  sponsorModal: {
    title: '冷凍ラビットを支援する',
    description: 'ご支援ありがとうございます！支払方法を選択してください。お問い合わせ：{email}',
    twProvider: '台灣地區 (ECPay)',
    twDesc: '台灣の方向けの決済方法です。',
    globalProvider: '全世界 (Ko-fi / PayPal)',
    globalDesc: '海外のプレイヤーに最適です。'
  }
}
