# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要

タスク管理用のかんばんアプリ（task-kanban）。トップページ（`src/app/page.tsx`）に看板（`src/components/task-board.tsx`）を置き、「未着手 / 進行中 / 完了」の3列でタスクの CRUD を行う。認証はまだない。

- Next.js 16（App Router）/ React 19 / TypeScript（strict）
- スタイリングは Tailwind CSS v4（`tailwind.config` は無く、`src/app/globals.css` の `@import "tailwindcss"` と `@theme inline` でテーマを定義。PostCSS 経由）
- パッケージマネージャは npm（`package-lock.json`）

## コマンド

```bash
npm run dev        # 開発サーバー（http://localhost:3000）
npm run build      # 本番ビルド
npm run lint       # ESLint（flat config: eslint.config.mjs）
npx tsc --noEmit   # 型チェック

npm test                                  # Vitest をウォッチモードで実行
npm run test:run                          # 1回だけ実行（CI 向け）
npx vitest run __tests__/page.test.tsx    # 単一ファイルだけ実行
npx vitest run -t "見出し"                # テスト名で絞り込み
```

## 構成メモ

- ソースは `src/` 配下。パスエイリアス `@/*` → `./src/*`（`tsconfig.json`）
- ルートレイアウトの props には Next 16 のグローバル型 `LayoutProps<"/">` を使っている（ページ側は `PageProps<...>`）

## Supabase

- 環境変数は `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。実際の値は `.env.local` に書く（テンプレートは `.env.example`）。`.env.local` は `.claude/settings.json` で読み取りを禁止している
- 環境変数の読み取りは `src/lib/supabase/env.ts` の `getSupabaseEnv()` に集約している。`NEXT_PUBLIC_` 変数はビルド時に文字列置換されるため、`process.env.XXX` と直接書くこと（動的なキー参照は不可）
- クライアントは用途で使い分ける
  - Client Component: `@/lib/supabase/client` の `createClient()`
  - Server Component / Server Function / Route Handler: `@/lib/supabase/server` の `await createClient()`。cookie を使うため、リクエストごとに生成しモジュールスコープで共有しない
- `src/instrumentation.ts` の `register()` がサーバー起動時に `checkSupabaseConnection()`（Auth の `/auth/v1/health` を叩く）で疎通確認し、失敗時のみ `console.error` を出す。起動はブロックされるがタイムアウトは 5 秒
- Supabase MCP（`.mcp.json`）は通常 `read_only=true`・`database`/`docs` 機能のみ。プロジェクト一覧を取得する機能はないため、ツールには project_id `fqcafnxpyhsqeqcjfghb` を直接渡す

### DB スキーマ

- `public.tasks`（マイグレーション: `supabase/migrations/20260928192749_create_tasks_table.sql`）
  - `id` uuid（`gen_random_uuid()`）/ `title` text（trim 後 1〜100文字）/ `description` text（既定 `''`、1000文字以内）/ `status` text（`todo`/`in_progress`/`done`、既定 `todo`）/ `created_at` / `updated_at`
  - `updated_at` はトリガー `tasks_set_updated_at`（関数 `public.set_updated_at()`）が自動更新する。クライアントから送らない
  - RLS は有効だが、認証導入前のため anon / authenticated に全操作を許可するポリシーになっている。認証を入れるときは `user_id` 列を追加し、`(select auth.uid()) = user_id` でポリシーを締め直すこと
- 生成された `Database` 型は使っておらず、行の型は `src/lib/tasks/types.ts` に手書きしている。スキーマを変えたら次をまとめて揃える
  - `types.ts` の型 / `validation.ts` の上限値（DB の check 制約と一致させる）/ `__tests__/helpers/fake-supabase.ts`
  - ステータスを増やす場合は `taskStatuses`（列の順序と表示名の唯一の定義）と DB の check 制約の両方を変える

### スキーマ変更の手順（MCP 経由）

1. `.mcp.json` の URL から `read_only=true` を外し、ユーザーに `/mcp` で再接続してもらう（`apply_migration` は再接続するまで使えない。認証が拒否されたら再認証、それでもだめなら Claude Code を再起動）
2. `list_tables` で現状を確認してから `apply_migration` を実行。同じ SQL を `supabase/migrations/` にも保存する
3. Supabase が記録するバージョンはローカルで付けた日時と異なるため、`list_migrations` で確認してファイル名の先頭を合わせる
4. `list_tables(verbose)` と `execute_sql`（`pg_policies` / `has_table_privilege`）で RLS・ポリシー・権限を確認
5. `.mcp.json` を `read_only=true` に戻し、再度 `/mcp` で再接続してもらう

SQL を書くときの注意
- 新しいテーブルには `grant ... to anon, authenticated` を明示する（Supabase は新規テーブルへの自動 grant を廃止する方向のため）。grant と RLS 有効化・ポリシーは同じマイグレーションにまとめる
- 関数には `set search_path = ''` を付け、API から呼ばせない関数は `revoke execute ... from public, anon, authenticated` する

## アプリ構成（タスク看板）

- `src/app/page.tsx`（Server Component）が見出しと `<TaskBoard />` を描画する。データ取得・更新はすべてクライアント側で行う
- `src/lib/tasks/repository.ts`: `fetchTasks` / `createTask` / `updateTask` / `deleteTask`。ブラウザ用 `createClient()` を使い、失敗時は画面にそのまま出せる日本語メッセージの `Error` を throw する。insert/update は `.select().single()` で保存後の行を返す
- `src/components/task-board.tsx`: マウント時に一覧を取得。追加・更新・削除が成功したら、返ってきた行で state を直接書き換えて即反映する（再取得しない）。取得・削除のエラーは看板上部の `role="alert"` に出す
- `src/components/task-form.tsx`: 追加・編集共用。送信前に `validateTaskInput()` を通し、`onSubmit` が throw したメッセージをフォーム内の `role="alert"` に出す（失敗時は入力内容を残す）
- `src/components/task-card.tsx`: 表示 / 編集モードの切り替え。編集中のみステータスを選べる（列の移動はこれで行う）
- `src/components/confirm-dialog.tsx`: 削除前の確認ダイアログ。初期フォーカスはキャンセル、Escape で閉じる
- テストが次のアクセシブルネームに依存しているため、変えるときはテストも合わせて直す
  - 列: `h2` の見出しで名前が付いた `region`（件数表示は名前に混ざらないよう `h2` の外に置いている）
  - フォーム: `aria-label` が「タスクを追加」「タスクを編集」
  - カードのボタン: 「「<タイトル>」を編集」「「<タイトル>」を削除」
  - ダイアログ: 名前「タスクを削除しますか？」、ボタン「削除する」「キャンセル」

## テスト

- Vitest 4 + React Testing Library + jsdom。設定は `vitest.config.mts`
- `@/*` エイリアスは `vite-tsconfig-paths` プラグインではなく Vite 標準の `resolve.tsconfigPaths: true` で解決している（プラグインは非推奨警告が出るため不採用）
- vitest 5 は `@types/node` 22 以上を要求し、現在の `@types/node@^20` と衝突するため 4 系に固定している
- テストファイルは `__tests__/` に置いている（`src/app` 内に同じ場所で置くことも可能）
- `globals` は無効なので `describe`/`test`/`expect` は `vitest` から明示的に import し、`afterEach(cleanup)` も各テストで呼ぶ
- `async` な Server Component は Vitest で描画できない。その種のコンポーネントは E2E で検証する
- `@testing-library/user-event` は未導入。操作は `@testing-library/react` の `fireEvent` を使い、非同期の反映は `findBy*` や `vi.waitFor` で待つ
- Supabase を使うテストは、外部依存である `@/lib/supabase/client` だけをモックし、`__tests__/helpers/fake-supabase.ts` の `createFakeSupabase()`（インメモリの tasks テーブル）を返す。`repository.ts` や自前のコンポーネントはモックしない
  - テストごとにフェイクを作り直せるよう、`vi.hoisted` で保持用のオブジェクトを作り `beforeEach` で差し替える（`__tests__/task-board.test.tsx` 参照）
  - `failNext("select" | "insert" | "update" | "delete")` で次の1回だけ失敗させられる。`calls` で DB が呼ばれたかどうかを確認できる
  - フェイクが対応しているのは `select` / `insert` / `update` / `delete` / `eq("id")` / `order` / `single` のみ。`repository.ts` で新しいメソッド（`in`、`range` など）を使うときはフェイクにも追加する
- `TaskBoard` を含むページのテスト（`__tests__/page.test.tsx`）も、マウント時に取得処理が走るため Supabase クライアントのモックが必要

## コーディングルール
- 変更後は必ず`npm run test:run`でテストが通ることを確認してください
- 変更は1つの関心事に絞り、小さい単位で行ってください
- 指示された範囲以外のコードを変更しないでください

## コーディング規約
- コンポーネントは、関数コンポーネントで記述してください
- 変数名、関数名はキャメルケースで書いてください
- コミットメッセージは日本語で書いてください

## テストルール 
- 網羅性：正常系、異常系、境界値を検討してください
- 可読性：テスト名に条件と期待する結果を明示してください
- 保守性：実装の内部構造ではなく、ユーザから見た振る舞いをテストしてください
- 独立性：テスト間で状態を共有しないでください
- 状態遷移：画面遷移の順方向、逆方向を検証してください
- モック方針：外部依存のみモック化してください

## 禁止事項 
- console.logを本番コードに残さないでください
- 既存テストを削除しないでください
- any型を使用しないでください

## MCP活用ルール
- next.js, supabase, Vitestなどの最新仕様は、context7 MCPを使って公式ドキュメントを確認してください
- ただし Next.js は、インストール済みバージョンに対応した `node_modules/next/dist/docs/` を優先して参照してください（AGENTS.md の指示）。context7 は Next.js 以外のライブラリ、または同梱ドキュメントに記載がない場合に使ってください
