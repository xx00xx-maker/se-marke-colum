-- ============================================
-- knowledge_chunks シード（キーワード・ライティングTips）
-- ============================================
-- schema.sql → board_styles.sql の順に実行後、このファイルを実行してください

-- ライティングTips（タイトル作成テクニック）
INSERT INTO public.knowledge_chunks (category, content) VALUES
  ('board_writing_tip', 'タイトルに「？」マークをつける（認知的不協和で開封率アップ）例: スローセックスで中イキしやすい？'),
  ('board_writing_tip', 'タイトルを途中で切る（ザイガニック効果）例: 究極のスローセック◯を知って…'),
  ('board_writing_tip', 'タイトルに小数点の数字を入れる（説得力アップ）例: 中イキ確率82.5％アップのスローセック◯'),
  ('board_writing_tip', '言い切り表現でアピールする（断言効果）例: スローセック◯で中イキさせます！'),
  ('board_writing_tip', '反対・無関係の言葉を組み合わせてインパクトを出す 例: スローセック◯！でもイク！'),
  ('board_writing_tip', '使える文字数を目一杯使う（PCMAX20文字・ハッピーメール30文字・ワクワクメール30文字）');

-- 感情・気持ちキーワード
INSERT INTO public.knowledge_chunks (category, content) VALUES
  ('emotion', '欲求不満'),
  ('emotion', '孤独感'),
  ('emotion', 'セックスレスの不安'),
  ('emotion', 'プライドを傷つけられた'),
  ('emotion', '満たされない'),
  ('emotion', 'パートナーに言えない'),
  ('emotion', 'ストレス発散したい'),
  ('emotion', '恥ずかしい願望がある'),
  ('emotion', 'スリルへの渇望'),
  ('emotion', '非日常への憧れ');

-- シチュエーションキーワード
INSERT INTO public.knowledge_chunks (category, content) VALUES
  ('situation', 'クンニ'),
  ('situation', '長時間前戯'),
  ('situation', 'スローセックス'),
  ('situation', '痴漢プレイ'),
  ('situation', '露出プレイ'),
  ('situation', 'おもちゃ体験'),
  ('situation', '犯されるシチュエーション'),
  ('situation', '見られたい願望'),
  ('situation', '秘密の関係'),
  ('situation', 'ホテルでの直会い');

-- テクニックキーワード
INSERT INTO public.knowledge_chunks (category, content) VALUES
  ('technique', 'アダムタッチ30分'),
  ('technique', 'レインボーキス7種'),
  ('technique', 'じらしスローセックス'),
  ('technique', 'Gスポット刺激'),
  ('technique', 'クリ責め'),
  ('technique', 'スロークンニ20分'),
  ('technique', '中イキ開発'),
  ('technique', 'ポルチオ刺激'),
  ('technique', 'バイブ・電マ使用'),
  ('technique', '連続イキ');

-- ============================================
-- 確認クエリ
-- ============================================
-- SELECT category, COUNT(*) as count FROM knowledge_chunks GROUP BY category ORDER BY category;
