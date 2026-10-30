# CLAUDE.md — orism-ai の作業ルール

## note運用チーム（AI社員10人）

- 「note書きたい」「/note-team」で起動。手順は `.claude/skills/note-team/SKILL.md`、各担当は `.claude/agents/note-*.md`。
- 使い方は `note/README.md`。錦織さんの話し方は `note/nishikori-core.md`（正本は airtight-full の `lib/orism/nishikori-core.md`）。

## 学びと作業ログ

- 作業開始時に `ai-team/note-team/learnings.md` を読む。
- 作業終了時、人間からの指摘・修正・重要な発見があれば `ai-team/note-team/learnings.md` に追記する。
  形式：`| 日付 | 案件名 | 学んだこと（1行） | カテゴリ |`
- 作業終了時、`ai-team/note-team/worklog.md` に1行追記する。形式：`| 日付 | 案件名 | やったこと（1行） |`

## 人間ゲート（人間の承認が必要な操作）

- git push・PR作成・main へのマージは、人間の承認を得てから行う。
- noteの公開・SNS投稿・メール配信・LINE配信など、外に出る操作はAIが行わない。文面までを用意し、人間が確認して実行する。
- 本番環境の設定変更・データ削除・アカウント操作は、人間の承認を得てから行う。
