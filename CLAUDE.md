# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要

タスク管理用のかんばんアプリ（task-kanban）。現状は Create Next App の初期テンプレートのままで、アプリ固有の実装はまだない。

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
- Supabase MCP（`.mcp.json`）は読み取り専用・`database`/`docs` 機能のみ。プロジェクト一覧を取得する機能はないため、ツールには project_id `fqcafnxpyhsqeqcjfghb` を直接渡す。スキーマ変更（マイグレーション）は MCP からは行えない

## テスト

- Vitest 4 + React Testing Library + jsdom。設定は `vitest.config.mts`
- `@/*` エイリアスは `vite-tsconfig-paths` プラグインではなく Vite 標準の `resolve.tsconfigPaths: true` で解決している（プラグインは非推奨警告が出るため不採用）
- vitest 5 は `@types/node` 22 以上を要求し、現在の `@types/node@^20` と衝突するため 4 系に固定している
- テストファイルは `__tests__/` に置いている（`src/app` 内に同じ場所で置くことも可能）
- `globals` は無効なので `describe`/`test`/`expect` は `vitest` から明示的に import し、`afterEach(cleanup)` も各テストで呼ぶ
- `async` な Server Component は Vitest で描画できない。その種のコンポーネントは E2E で検証する

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
