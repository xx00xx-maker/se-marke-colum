-- ============================================
-- 掲示板ライティングスタイル追加
-- ============================================
-- Supabase DashboardのSQL Editorで実行してください

-- 1. 共通ライティングスタイル
INSERT INTO public.writing_styles (slug, title, system_prompt, content_type)
VALUES (
  'board_common',
  '掲示板共通ライティングスタイル',
  '{
    "structure": [
      "導入部: スローセックス探求とパートナー募集を明記。講座修了をアピール。",
      "問題提起部: 女性の悩みをリスト (セックスレス、前戯不足など)。",
      "解決提案部: 流れ説明 (アダムタッチ30分、クンニ20分、挿入30分)。メリット: 癒し、満足感。",
      "条件部: 年齢不問、秘密厳守、平日昼間、解散OK。",
      "呼びかけ部: メール促し、日記推奨。"
    ],
    "key_elements": {
      "tone": "共感的・丁寧。伏字使用 (セッ◯ス)。",
      "dilemmas": ["セックスレス恐怖", "前戯痛み", "中イキ未経験"],
      "techniques": ["アダムタッチ", "じらし", "Gスポット開発"]
    },
    "rules": "質問形式でエンゲージ。箇点多用。"
  }',
  'board_common'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  content_type = EXCLUDED.content_type;

-- 2. コンセプト1: 基本募集・探求型
INSERT INTO public.writing_styles (slug, title, system_prompt, content_type)
VALUES (
  'board_concept_1',
  '掲示板コンセプト: 基本募集・探求型',
  '{
    "focus": "スローセックスの全体像を紹介。講座修了と基本流れを強調。",
    "example_keywords": ["心身癒し", "アダムタッチ", "クンニ", "平日昼間"],
    "base_templates": ["スローセックス探求", "パートナー募集", "専門家スローセックス"],
    "tone": "誠実で信頼感のある語り口"
  }',
  'board_concept'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  content_type = EXCLUDED.content_type;

-- 3. コンセプト2: 悩み解消・共感型
INSERT INTO public.writing_styles (slug, title, system_prompt, content_type)
VALUES (
  'board_concept_2',
  '掲示板コンセプト: 悩み解消・共感型',
  '{
    "focus": "セックスレスの痛みをリスト。自己経験共有で親近感。",
    "example_keywords": ["手を払われた", "前戯痛み", "じらし", "女として終わる怖さ"],
    "base_templates": ["セックスレス解消", "味気ないセックス", "手足わされた体験", "焦らしスローセックス"],
    "tone": "共感と優しさを前面に出す"
  }',
  'board_concept'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  content_type = EXCLUDED.content_type;

-- 4. コンセプト3: イキ開発・テクニック特化型
INSERT INTO public.writing_styles (slug, title, system_prompt, content_type)
VALUES (
  'board_concept_3',
  '掲示板コンセプト: イキ開発・テクニック特化型',
  '{
    "focus": "連続イキ、中イキ、ポルチオの技をレッスン形式。方法・コツ詳細。",
    "example_keywords": ["連続イキ", "中イキ", "Gスポット", "ポルチオ", "リラックス法", "体位"],
    "base_templates": ["連続イキ", "中イキ開発", "中イキ・ポルチオ刺激"],
    "tone": "専門的かつ分かりやすい解説調"
  }',
  'board_concept'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  content_type = EXCLUDED.content_type;

-- ============================================
-- 確認クエリ
-- ============================================
-- SELECT * FROM writing_styles WHERE content_type IN ('board_common', 'board_concept');
