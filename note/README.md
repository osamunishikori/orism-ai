# note運用チーム（AI社員10人）

Claude Code で **「note書きたい」** と話しかけるか、**`/note-team`** と打つと動きます。
ディレクターが1問ずつ質問し、各担当に仕事を振って、公開できる状態まで仕上げます。

## チーム

| No | 担当 | ルールの置き場所 |
|---|---|---|
| 01 | ディレクター（質問・段取り） | `.claude/skills/note-team/SKILL.md` |
| 02 | 秘書（カレンダー・ネタ帳） | `.claude/agents/note-secretary.md` |
| 03 | リサーチ（出典つきで調べる） | `.claude/agents/note-research.md` |
| 04 | 壁打ち（本人の体験を引き出す） | `.claude/agents/note-sparring.md` |
| 05 | 企画（タイトル・構成） | `.claude/agents/note-planner.md` |
| 06 | 記事作成（錦織さんの声で書く） | `.claude/agents/note-writer.md` |
| 07 | レビュー（NGリストで点検） | `.claude/agents/note-reviewer.md` |
| 08 | デザイン（見出し画像） | `.claude/agents/note-designer.md` |
| 09 | マーケティング（告知文・タグ） | `.claude/agents/note-marketer.md` |
| 10 | 分析（見る数字・次の一手） | `.claude/agents/note-analyst.md` |

ルールを変えたいときは、上のファイルを書き換えるだけです（例：レビューのNGリストに1行足す）。

## このフォルダ

- `nishikori-core.md` … 錦織さんの話し方・考え方（記事作成・レビュー・告知文が読む）
- `profile.md` … アカウント設計（誰に・何を約束するか）。初回にディレクターが質問して埋めます
- `calendar.md` … 投稿予定と進捗（秘書が管理）
- `ideas.md` … ネタ帳（秘書が管理）
- `articles/<公開予定日>_<名前>/` … 1記事1フォルダ（brief → research／sparring → plan → draft → review → design／marketing）
- `analytics/<年-月>.md` … 公開後の数字（分析担当が記録）

## 人間がやること

- 壁打ちの質問に答える（記事の芯になります）
- タイトルと構成を選ぶ
- noteへの貼り付け・公開、SNS投稿、LINE配信（AIは文面まで。送信はしません）
- 公開7日後に、noteの数字を貼る（スクショでOK）

## 学び

指摘・修正は `ai-team/note-team/learnings.md` に貯まり、次の記事から反映されます。
