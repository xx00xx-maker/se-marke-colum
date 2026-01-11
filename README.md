# 言の葉 (KOTONOHA) - AIライティングアシスタント

禅をテーマにした美しいUIで、心理技術×テンプレートによるコラム生成を実現するWebアプリ。

## 技術スタック

- **フロントエンド**: Vite + React
- **AI**: Grok 4.1 Fast (OpenRouter経由)
- **バックエンド**: Supabase (PostgreSQL + Edge Functions)
- **デプロイ**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして値を設定:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabaseの設定

#### テーブル作成

Supabase Dashboard > SQL Editor で `supabase/schema.sql` を実行

#### Edge Functions作成

Supabase Dashboard > Edge Functions で以下の2つを作成:

1. **generate-column** - `supabase/functions/generate-column/index.ts`
2. **generate-suggestions** - `supabase/functions/generate-suggestions/index.ts`

#### Edge Functions環境変数

Project Settings > Edge Functions で設定:

- `OPENROUTER_API_KEY`: OpenRouterのAPIキー
- `SITE_URL`: デプロイ先URL（例: <https://kotonoha.vercel.app）>

### 4. ローカル開発

```bash
npm run dev
```

<http://localhost:3000> でアプリが起動

### 5. ビルド

```bash
npm run build
```

## Vercelデプロイ

1. GitHubリポジトリをVercelに接続
2. 環境変数を設定:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. デプロイ実行

## プロジェクト構成

```
se-marke_colum/
├── src/
│   ├── App.jsx           # メインコンポーネント
│   ├── main.jsx          # エントリーポイント
│   ├── index.css         # グローバルスタイル
│   └── lib/
│       └── supabase.js   # Supabaseクライアント
├── supabase/
│   ├── schema.sql        # テーブル定義SQL
│   └── functions/
│       ├── generate-column/       # コラム生成
│       └── generate-suggestions/  # 提案生成
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── .env.example
```

## ライセンス

Private
