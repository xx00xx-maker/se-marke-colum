import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: Deno.env.get('XAI_API_KEY') ?? '',
});

const MODEL_NAME = 'x-ai/grok-4.1-fast';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const {
            styleSlug = 'pana_emotion',
            contentType = 'board_template',
            conceptId = null,
            selectedKeywords = [],
            userPrompt = '',
            patternCount = 3
        } = await req.json();

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );

        // 共通変数
        let systemPrompt = '';
        let examplesText = '';
        let writingTip = '';

        // 掲示板モードでコンセプトIDが指定されている場合
        if (contentType === 'board_template' && conceptId) {
            // 1. 共通スタイルを取得
            const { data: common, error: commonError } = await supabaseClient
                .from('writing_styles')
                .select('*')
                .eq('slug', 'board_common')
                .single();

            if (commonError) {
                console.error('共通スタイル取得エラー:', commonError);
            }

            // 2. 選択されたコンセプトを取得
            const conceptSlug = `board_concept_${conceptId}`;
            const { data: concept, error: conceptError } = await supabaseClient
                .from('writing_styles')
                .select('*')
                .eq('slug', conceptSlug)
                .single();

            if (conceptError) {
                console.error('コンセプト取得エラー:', conceptError);
            }

            // 3. コンセプトに紐づくテンプレートを取得
            let conceptData = {};
            try {
                conceptData = JSON.parse(concept?.system_prompt || '{}');
            } catch (e) {
                console.error('JSON解析エラー:', e);
            }

            const baseTemplates = conceptData.base_templates || [];

            // reference_diariesからテンプレートタイトルに一致するものを取得
            const { data: templates, error: templatesError } = await supabaseClient
                .from('reference_diaries')
                .select('*')
                .eq('content_type', 'board_temp')
                .limit(10);

            if (templatesError) {
                console.error('テンプレート取得エラー:', templatesError);
            }

            // タイトルでフィルタリング
            const matchedTemplates = templates?.filter(t =>
                baseTemplates.some(bt => t.title?.includes(bt))
            ) || [];

            // ランダムに2つ選択
            const shuffledTemplates = matchedTemplates.sort(() => Math.random() - 0.5).slice(0, 2);

            if (shuffledTemplates.length > 0) {
                shuffledTemplates.forEach((ex, i) => {
                    examplesText += `\n=== 参考例${i + 1} ===\nタイトル: ${ex.title}\n${ex.body}\n`;
                });
            }

            // 4. 共通スタイル + コンセプト情報でシステムプロンプト構築
            let commonData = {};
            try {
                commonData = JSON.parse(common?.system_prompt || '{}');
            } catch (e) {
                console.error('共通JSON解析エラー:', e);
            }

            // フレームワーク構造を取得
            const framework = commonData.framework || {};
            const frameworkText = Object.keys(framework).sort().map(key => {
                const section = framework[key];
                return `【${section.name}】\n${section.description}`;
            }).join('\n\n');

            systemPrompt = `あなたは日本語表現に優れた心理的コピーライターです。
掲示板投稿文を作成してください。

【絶対に守るべきルール】
**書き手は男性です。読み手は女性です。**
- 男性が女性に向けて書いている文章にしてください
- 「私も女として...」のような女性視点の表現は絶対に使わないでください
- 男性が女性の悩みに寄り添い、解決を提案する立場で書いてください

【共通ルール】
${commonData.rules || '質問形式でエンゲージ。箇点多用。'}

【必須の5段階構成フレームワーク】
以下の構成に従って文章を作成してください：

${frameworkText}

【キー要素】
- トーン: ${commonData.key_elements?.tone || '共感的・丁寧'}
- 女性の悩み例: ${(commonData.key_elements?.dilemmas || []).join('、')}
- 提供するテクニック例: ${(commonData.key_elements?.techniques || []).join('、')}

【今回のコンセプト: ${concept?.name || ''}】
- フォーカス: ${conceptData.focus || ''}
- トーン: ${conceptData.tone || ''}
- キーワード例: ${(conceptData.example_keywords || []).join('、')}

日本語で自然な会話口調で生成してください。`;

        } else {
            // 既存のロジック（日記モード等）
            const { data: style, error: styleError } = await supabaseClient
                .from('writing_styles')
                .select('*')
                .eq('slug', styleSlug)
                .single();

            if (styleError || !style) throw new Error('Writing style not found');

            const { data: examples, error: exError } = await supabaseClient
                .from('reference_diaries')
                .select('*')
                .eq('style_id', style.id)
                .eq('content_type', contentType)
                .limit(10);

            if (exError) throw exError;
            const shuffledExamples = examples ? examples.sort(() => Math.random() - 0.5).slice(0, 2) : [];

            if (contentType === 'board_template') {
                const { data: tips } = await supabaseClient
                    .from('knowledge_chunks')
                    .select('content')
                    .eq('style_id', style.id)
                    .eq('category', 'board_writing_tip')
                    .limit(10);

                if (tips && tips.length > 0) {
                    const randomTip = tips[Math.floor(Math.random() * tips.length)];
                    writingTip = `【今回適用するテクニック】"${randomTip.content}"`;
                }
            }

            if (shuffledExamples.length > 0) {
                shuffledExamples.forEach((ex, i) => {
                    examplesText += `\n=== 参考例${i + 1} ===\nタイトル: ${ex.title}\n${ex.body}\n`;
                });
            }

            systemPrompt = style.system_prompt + `

【絶対に守るべきルール】
**書き手は男性です。読み手は女性です。**
- 男性が女性に向けて書いている文章にしてください
- 「私も女として...」のような女性視点の表現は絶対に使わないでください
- 男性が女性の悩みに寄り添う立場で書いてください

日本語で自然な会話口調で生成してください。`;
        }

        // ライティングTip取得（掲示板モード共通）
        if (contentType === 'board_template' && !writingTip) {
            const { data: tips } = await supabaseClient
                .from('knowledge_chunks')
                .select('content')
                .eq('category', 'board_writing_tip')
                .limit(10);

            if (tips && tips.length > 0) {
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                writingTip = `【今回適用するテクニック】"${randomTip.content}"`;
            }
        }

        const userMessage = `
${contentType === 'diary_logic' ? '日記記事' : '掲示板投稿文'}を**${patternCount}パターン**作成してください。

# 条件
- キーワード: ${selectedKeywords.length > 0 ? selectedKeywords.join(', ') : '自由'}
  ※キーワードはそのまま使う必要はありません。前後の文脈や内容に合わせて自然な形に変化させてください。
${writingTip}

# 参考例
${examplesText}

# 重要な指示（必ず守ること）
1. **${patternCount}パターン**の**全く異なる内容**を作成してください。
2. 各パターンは「---パターン1---」「---パターン2---」のように区切ってください。
3. PANAフレームワークの流れを意識しつつ、(Problem)(Agitation)などのラベルは**絶対に含めないでください**。
4. 各パターンの構成:
   - 1行目: 「タイトル: 〇〇〇」
   - 2行目: 空行
   - 3行目以降: 本文
5. **本文は300〜500文字程度で書いてください。**
6. **本文は読みやすいように適切な位置で改行を入れてください。**1〜2文ごとに改行し、段落の区切りでは空行を入れてください。
7. 性的な表現は「◯」などの伏せ字を使ってください。
8. **絶対禁止事項:**
   - 文字数を本文に記載しない（「(428文字)」「(合計文字数: 428)」など禁止）
   - 連絡先情報を含めない（メールアドレス、電話番号、LINE ID、SNSアカウントなど禁止）

# 【超重要】各パターンの書き出しスタイル
**必ず以下の異なるスタイルで書き始めてください：**
- **パターン1（共感型）**: 「私も同じ悩みを抱えていました...」のように自分の経験や悩みの共感から始める
- **パターン2（提案型）**: 「こんな体験ができます」「〇〇を実現しませんか」のようにメリットや解決策から始める  
- **パターン3（質問型）**: 「〇〇で悩んでいませんか？」「〇〇を知っていますか？」のように読者への質問から始める

**各パターンは冒頭のアプローチだけでなく、全体の構成・流れも変えてください。同じ内容の言い換えはNGです。**

# 出力フォーマット例
---パターン1---
タイトル: 魅力的なタイトルをここに

本文の最初の段落。
ここで一度改行。

次の段落はこのように空行を挟みます。
読みやすさを意識した文章を心がけてください。

---パターン2---
タイトル: 別のアプローチのタイトル

（以下同様）

${userPrompt ? `# 追加指示\n${userPrompt}` : ''}
`;

        const completion = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.9,
            max_tokens: 4000,
        });

        const generatedContent = completion.choices[0].message.content;

        const patterns = generatedContent
            .split(/---パターン\d+---/)
            .filter(p => p.trim().length > 0)
            .map(p => p.trim());

        return new Response(JSON.stringify({
            success: true,
            content: generatedContent,
            patterns: patterns.length > 0 ? patterns : [generatedContent],
            model: MODEL_NAME,
            appliedTip: writingTip || "なし"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
