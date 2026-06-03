export interface LocalizedString {
  tw: string;
  cn: string;
  en: string;
  ja: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: (string | LocalizedString)[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2026-06-03',
    changes: [
      {
        tw: '新增開拓研究模式。',
        cn: '新增开拓研究模式。',
        en: 'Added Frontier Research mode.',
        ja: '開拓研究モードを追加しました。',
      },
      {
        tw: '修正藏書庫與資料庫的模型過期判定。',
        cn: '修正藏书库与数据库的模型过期判定。',
        en: 'Fixed model staleness checks in the Tome Library and databases.',
        ja: '蔵書庫とデータベースのモデル期限切れ判定を修正しました。',
      },
      {
        tw: '放鬆分析器的節點上限限制。',
        cn: '放宽分析器的节点上限限制。',
        en: 'Relaxed analyzer node limit constraints.',
        ja: 'アナライザーのノード上限制限を緩和しました。',
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-27',
    changes: [
      {
        tw: '移植求解器至 WASM，大幅加速運算。',
        cn: '将求解器移植至 WASM，大幅加速运算。',
        en: 'Moved the solvers to WASM for much faster calculation.',
        ja: 'ソルバーを WASM に移植し、計算速度を大幅に向上しました。',
      },
      {
        tw: '支援秘笈與實驗的 JSON 匯出與匯入。',
        cn: '支持秘笈与实验的 JSON 导出与导入。',
        en: 'Added JSON export and import support for Tomes and Experiments.',
        ja: '秘笈と実験の JSON エクスポート / インポートに対応しました。',
      },
      {
        tw: '強化實驗台的策略編輯 UI/UX。',
        cn: '强化实验台的策略编辑 UI/UX。',
        en: 'Improved the Strategy Lab editing UI/UX.',
        ja: '実験台のストラテジー編集 UI/UX を改善しました。',
      },
      {
        tw: '新增匯出互動式決策樹功能。',
        cn: '新增导出互动式决策树功能。',
        en: 'Added interactive decision tree export.',
        ja: 'インタラクティブな意思決定ツリーのエクスポート機能を追加しました。',
      },
      {
        tw: '改善多處的 UI/UX 統一和表現。',
        cn: '改善多处 UI/UX 的统一性与表现。',
        en: 'Improved UI/UX consistency and presentation across multiple areas.',
        ja: '複数箇所の UI/UX の統一感と見せ方を改善しました。',
      },
    ],
  },
  {
    version: '0.9.1',
    date: '2026-05-20',
    changes: [
      {
        tw: '物品搜尋欄現在會在貼上遊戲內複製的收藏品名稱時，自動移除附帶的特殊字元，讓搜尋更穩定。',
        cn: '物品搜索栏现在会在粘贴游戏内复制的收藏品名称时，自动移除附带的特殊字符，让搜索更稳定。',
        en: 'Item search now removes special characters from pasted in-game collectable item names for more reliable search behavior.',
        ja: 'アイテム検索欄でゲーム内からコピーした収集品名を貼り付けた際、付随する特殊文字を自動で取り除き、検索がより安定するようになりました。',
      },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-05-20',
    changes: [
      {
        tw: '完成網頁核心功能，開始 alpha 推出與接收回饋',
        cn: '完成网页核心功能，开始 alpha 推出与接收反馈',
        en: 'Completed the website core features and began the alpha rollout and feedback phase',
        ja: 'ウェブサイトの主要機能が完成し、alpha 公開とフィードバック受付を開始しました',
      },
    ],
  },
];
