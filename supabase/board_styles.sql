-- ============================================
-- 掲示板ライティングスタイル設定
-- ============================================
-- Supabase DashboardのSQL Editorで実行してください
-- ※ schema.sql を先に実行してテーブルを作成してください

-- 1. 共通ライティングスタイル（PASTORフォーミュラ）
INSERT INTO public.writing_styles (slug, title, system_prompt, content_type)
VALUES (
  'board_common',
  '掲示板共通ライティングスタイル',
  '{
    "framework": {
      "1_person":         { "name": "人 (Person)",          "description": "ターゲット女性の状況・願望を明示。「〜しているあなたへ」「〜な願望をお持ちの方へ」" },
      "2_problem":        { "name": "問題 (Problem)",        "description": "女性の具体的な悩みをリスト形式で共感的に提示。「〜と感じていませんか？」" },
      "3_amplify":        { "name": "痛み (Amplify)",        "description": "問題が解決されないと生じる悪影響・不安を描写し感情を揺さぶる" },
      "4_solution":       { "name": "解決策 (Solution)",     "description": "具体的なプレイ内容・流れをリスト形式（箇点）で明示。何ができるか具体的に" },
      "5_transformation": { "name": "変革 (Transformation)", "description": "体験後の変化・得られる快感・心身の満足感・日常への好影響を描写" },
      "6_offer":          { "name": "提供 (Offer)",          "description": "安心感の提供。秘密厳守・年齢不問・解散OK・清潔感等をアピール" },
      "7_response":       { "name": "行動 (Response)",       "description": "行動を促す。「興味あり」一言でOK・日記も読んでほしいなど" }
    },
    "rules": "質問形式でエンゲージ。箇点多用。伏字使用（セッ◯ス等）。500文字程度。二人称は必ず「あなた」を使い「君」は絶対に使わない。",
    "key_elements": {
      "tone": "共感的・丁寧",
      "dilemmas": ["セックスレス", "前戯不足", "満足できないセックス", "パートナーに言えない"],
      "techniques": ["クンニ", "スローセックス", "アダムタッチ", "Gスポット", "中イキ"]
    }
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
    "focus": "スローセックス専門家としての全体像を紹介。講座修了と基本的な流れ（アダムタッチ・クンニ・挿入）を強調。",
    "example_keywords": ["心身癒し", "アダムタッチ30分", "スロークンニ", "平日昼間", "専門家"],
    "base_templates": ["スローセックス探求", "専門家スローセックス"],
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
    "focus": "セックスレス・前戯不足への共感訴求。自己経験を共有することで親近感を醸成。",
    "example_keywords": ["セックスレス", "前戯が痛い", "じらし前戯", "女として終わる怖さ", "欲求不満"],
    "base_templates": ["セックスレス解消", "焦らしスローセックス"],
    "tone": "共感と優しさを前面に出す"
  }',
  'board_concept'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  content_type = EXCLUDED.content_type;

-- 4. コンセプト3: テクニック特化型
INSERT INTO public.writing_styles (slug, title, system_prompt, content_type)
VALUES (
  'board_concept_3',
  '掲示板コンセプト: テクニック特化型',
  '{
    "focus": "クンニ・中イキ・Gスポット等テクニックの具体的な訴求。できることを詳細にアピール。",
    "example_keywords": ["長時間クンニ", "中イキ", "Gスポット", "連続イキ", "クリ責め", "手マン"],
    "base_templates": ["クンニ訴求", "感情揺さぶりクンニ", "こんなセックスがしたい"],
    "tone": "テクニックの具体性と相手への奉仕精神を強調"
  }',
  'board_concept'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  system_prompt = EXCLUDED.system_prompt,
  content_type = EXCLUDED.content_type;

-- 5. コンセプト4: プレイ特化型（新規）
INSERT INTO public.writing_styles (slug, title, system_prompt, content_type)
VALUES (
  'board_concept_4',
  '掲示板コンセプト: プレイ特化型',
  '{
    "focus": "非日常プレイへの願望に応える。痴漢・露出・おもちゃ・シチュエーション特化。安全性と秘密厳守も強調。",
    "example_keywords": ["痴漢プレイ", "露出プレイ", "大人のおもちゃ", "スリル", "犯されるプレイ", "見られたい願望"],
    "base_templates": ["痴漢プレイ", "露出プレイ", "大人のおもちゃ", "犯されるプレイ", "イクところ"],
    "tone": "刺激的・スリルを前面に。安全性と秘密厳守を同時強調"
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
-- SELECT slug, title, content_type FROM writing_styles WHERE content_type IN ('board_common', 'board_concept') ORDER BY slug;
