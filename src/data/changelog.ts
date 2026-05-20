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
