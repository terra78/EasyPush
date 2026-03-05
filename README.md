# 在庫監視通知（LINE優先 / メール最終手段）

対象ページを10分おきに確認し、`在庫確認中` が消えたときに通知します。

## 構成

- 実行: GitHub Actions（10分ごと）
- 状態保存: Supabase（`product_watch_status`）
- 通知: LINE Messaging API（通知先はSupabase管理、失敗時のみResendメール）

## 判定ルール

1. ページ本文に `在庫確認中` がある -> `checking`
2. `在庫確認中` がない -> `non_checking`（販売開始候補）
3. 一時的なHTMLゆらぎ対策として、`non_checking` を2回連続検知したら通知
4. リング2商品は `13` サイズ行を優先判定（他サイズの `在庫確認中` は無視）

## 事前準備

### 1) Supabaseテーブル作成

Supabase SQL Editor で [`supabase/schema.sql`](supabase/schema.sql) を実行してください。
`line_recipients` テーブルも同時に作成されます。

### 2) LINE Messaging API準備

1. LINE Developers で Messaging API チャネルを作成
2. チャネルアクセストークン（長期）を発行
3. 通知先ユーザーの `userId` を取得（Webhook経由など）
4. `line_recipients` に通知先を登録

例:

```sql
insert into public.line_recipients (line_user_id, display_name, is_active)
values
  ('Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'my-main-account', true),
  ('Uyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy', 'sub-account', true);
```

GitHub Secrets に以下を設定します。

- `LINE_CHANNEL_ACCESS_TOKEN`

### 3) （任意）メールフォールバック

LINE送信失敗時だけメール通知を使う場合:

- `ENABLE_EMAIL_FALLBACK=true`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_TO_EMAIL`

使わない場合は `ENABLE_EMAIL_FALLBACK=false` のままでOKです。

### 4) GitHub Secrets（必須）

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LINE_CHANNEL_ACCESS_TOKEN`

## 実行

ローカル:

```bash
cp .env.example .env
npm install
npm run watch
```

GitHub Actions:

- [`stock-watch.yml`](.github/workflows/stock-watch.yml) が10分間隔で自動実行
- Actions画面から `workflow_dispatch` で手動実行も可能
- 手動実行時に `force_test_notification=true` を指定すると、在庫変化がなくてもテスト通知を送信

## 通知仕様

- 通知条件: `checking -> non_checking` への変化を2回連続で確認
- 通知先: `line_recipients` の `is_active=true` 全員
- 重複抑止: `notified_available=true` の間は再通知しない
- 状態が `checking` に戻ったら通知フラグをリセット
- 通知本文には対象販売ページURL（全件）を常に掲載

## 対象商品

- 一味徒党 vocalist's ring(13号)
- 一味徒党 guitarist's ring(13号)
- 一味徒党 nut ear cuff
- 一味徒党 spanner top
- 一味徒党 whistle
- ボールチェーン

URL定義は [`src/config.js`](src/config.js) にあります。
