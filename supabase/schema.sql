-- ============================================
-- 言の葉 (KOTONOHA) - Supabase テーブル設定
-- ============================================
-- このSQLをSupabaseダッシュボードのSQL Editorで実行してください

-- 1. writing_config テーブル作成
CREATE TABLE IF NOT EXISTS writing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method_id TEXT NOT NULL,        -- teaser, emotion, mind, instant, agitate
  template_id TEXT NOT NULL,      -- secret, erotic, solve, question, etc.
  themes JSONB DEFAULT '[]',      -- 物語の種（シチュエーション配列）
  fragments JSONB DEFAULT '[]',   -- 感性の断片（キーワード配列）
  system_prompt TEXT,             -- カスタムシステムプロンプト（オプション）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(method_id, template_id)
);

-- 2. RLS（Row Level Security）有効化
ALTER TABLE writing_config ENABLE ROW LEVEL SECURITY;

-- 3. 読み取りポリシー（全ユーザー読み取り可）
CREATE POLICY "Anyone can read writing_config" ON writing_config
  FOR SELECT USING (true);

-- 4. インデックス作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_writing_config_method_template 
  ON writing_config(method_id, template_id);

-- 5. 更新日時自動更新のトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_writing_config_updated_at
  BEFORE UPDATE ON writing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- サンプルデータ（オプション）
-- ============================================

INSERT INTO writing_config (method_id, template_id, themes, fragments, system_prompt) VALUES
(
  'teaser',
  'secret',
  '["偶然の再会から始まる禁断の関係", "出張先のホテルバーでの出会い", "雨の日の相合傘から始まる物語", "幼馴染との思わぬ再会", "SNSで見つけた懐かしい人"]'::jsonb,
  '["唇", "吐息", "月明かり", "沈黙", "指先", "鼓動", "香り", "囁き", "熱", "秘密"]'::jsonb,
  '「言の葉」AIとして、じらし前戯式の手法を用いて、読者の期待を高め、焦らして引き込むような官能的な日記を生成してください。'
),
(
  'emotion',
  'secret',
  '["長い片思いがついに実る夜", "別れを決意した最後のデート", "記念日に伝えられなかった想い", "遠距離恋愛の再会", "親友の結婚式での感情"]'::jsonb,
  '["涙", "抱擁", "温もり", "約束", "永遠", "切なさ", "笑顔", "告白", "想い", "絆"]'::jsonb,
  '「言の葉」AIとして、感情動かし式の手法を用いて、共感と感動で読者の心の壁を溶かすような物語を生成してください。'
)
ON CONFLICT (method_id, template_id) DO UPDATE SET
  themes = EXCLUDED.themes,
  fragments = EXCLUDED.fragments,
  system_prompt = EXCLUDED.system_prompt;

-- ============================================
-- 確認クエリ
-- ============================================
-- SELECT * FROM writing_config;
