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
