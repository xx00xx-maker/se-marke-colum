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

-- ============================================
-- 2. writing_styles テーブル作成
-- ============================================
CREATE TABLE IF NOT EXISTS writing_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  system_prompt TEXT,
  content_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE writing_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read writing_styles" ON writing_styles
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_writing_styles_slug ON writing_styles(slug);
CREATE INDEX IF NOT EXISTS idx_writing_styles_content_type ON writing_styles(content_type);

CREATE TRIGGER update_writing_styles_updated_at
  BEFORE UPDATE ON writing_styles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. reference_diaries テーブル作成
-- ============================================
CREATE TABLE IF NOT EXISTS reference_diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id UUID REFERENCES writing_styles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reference_diaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reference_diaries" ON reference_diaries
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_reference_diaries_content_type ON reference_diaries(content_type);
CREATE INDEX IF NOT EXISTS idx_reference_diaries_style_id ON reference_diaries(style_id);

CREATE TRIGGER update_reference_diaries_updated_at
  BEFORE UPDATE ON reference_diaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. knowledge_chunks テーブル作成
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_id UUID REFERENCES writing_styles(id),
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read knowledge_chunks" ON knowledge_chunks
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_category ON knowledge_chunks(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_style_id ON knowledge_chunks(style_id);

CREATE TRIGGER update_knowledge_chunks_updated_at
  BEFORE UPDATE ON knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 確認クエリ
-- ============================================
-- SELECT * FROM writing_styles;
-- SELECT * FROM reference_diaries;
-- SELECT * FROM knowledge_chunks;
