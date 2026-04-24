import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: Deno.env.get('deepseek_API_KEY') ?? '',
});

const MODEL_NAME = 'deepseek/deepseek-v3.2';

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

        let systemPrompt = '';
        let examplesText = '';
        let writingTip = '';

        // ================================================================
        // 掲示板モード
        // ================================================================
        if (contentType === 'board_template') {
            const effectiveConceptId = conceptId ?? '1';

            // DBクエリを並列実行
            const [
                { data: common },
                { data: concept },
                { data: allTemplates },
                { data: tips }
            ] = await Promise.all([
                supabaseClient.from('writing_styles').select('*').eq('slug', 'board_common').single(),
                supabaseClient.from('writing_styles').select('*').eq('slug', `board_concept_${effectiveConceptId}`).single(),
                supabaseClient.from('reference_diaries').select('*').eq('content_type', 'board_temp').limit(50),
                supabaseClient.from('knowledge_chunks').select('content').eq('category', 'board_writing_tip').limit(10),
            ]);

            let commonData: Record<string, any> = {};
            let conceptData: Record<string, any> = {};
            try { commonData = JSON.parse(common?.system_prompt || '{}'); } catch (_) {}
            try { conceptData = JSON.parse(concept?.system_prompt || '{}'); } catch (_) {}

            const baseTemplates: string[] = conceptData.base_templates || [];
            const matched = (allTemplates || []).filter(t =>
                baseTemplates.some(bt => t.title?.includes(bt))
            );
            const pickedExamples = matched.sort(() => Math.random() - 0.5).slice(0, 2);

            pickedExamples.forEach((ex, i) => {
                examplesText += `\n=== 参考例${i + 1} ===\nタイトル: ${ex.title}\n${ex.body}\n`;
            });

            if (tips && tips.length > 0) {
                const tip = tips[Math.floor(Math.random() * tips.length)];
                writingTip = `【今回適用するタイトルテクニック】"${tip.content}"`;
            }

            const framework = commonData.framework || {};
            const frameworkText = Object.keys(framework).sort().map(key => {
                const s = framework[key];
                return `【${s.name}】\n${s.description}`;
            }).join('\n\n');

            systemPrompt = `あなたは日本語表現に優れた心理的コピーライターです。
掲示板投稿文を作成してください。

【絶対に守るべきルール】
- 書き手は男性、読み手は女性です
- 男性が女性の悩みに寄り添い、解決を提案する立場で書いてください
- 「私も女として...」のような女性視点の表現は絶対に使わないでください
- 二人称は必ず「あなた」を使ってください。「君」「彼女」は絶対に使わないでください

【主語の一貫性（必ず守ること）】
- 「私（男性）」が主語のとき: 私が経験したこと・感じたことを書く
  例: 「私も妻に拒絶され続け、自分の自信が砕けました」→「自分の」であって「彼女の」はNG
- 「あなた（女性読者）」が主語のとき: あなたの悩み・感情・体験を書く
  例: 「あなたは毎晩拒絶されて、自信を失っていませんか？」
- 「私が〜される → 彼女が〜する/される」という主語のすり替えは絶対禁止
- 文章内で主語が変わるときは読者が混乱しないよう明示すること

【共通ルール】
${commonData.rules || '質問形式でエンゲージ。箇点多用。伏字使用（セッ◯ス等）。500文字程度。'}

【PASTORフォーミュラ（必須の7段階構成）】
${frameworkText || '※ board_common の framework データが見つかりません。PASTORフォーミュラ（人→問題→痛み→解決策→変革→提供→行動）の流れで書いてください。'}

【今回のコンセプト: ${concept?.title || `board_concept_${effectiveConceptId}`}】
- フォーカス: ${conceptData.focus || ''}
- 関連キーワード例: ${(conceptData.example_keywords || []).join('、')}

【キー要素】
- 女性の悩み例: ${(commonData.key_elements?.dilemmas || []).join('、')}
- 提供するテクニック例: ${(commonData.key_elements?.techniques || []).join('、')}

【絶対厳守】口調・文体・語尾はユーザーメッセージ内の各パターン定義にのみ従うこと。このシステムプロンプトは口調を指定しない。パターンごとに完全に異なる語り口で書くこと。`;

        // ================================================================
        // 日記モード
        // ================================================================
        } else {
            const { data: style, error: styleError } = await supabaseClient
                .from('writing_styles')
                .select('*')
                .eq('slug', styleSlug)
                .single();

            if (styleError || !style) {
                throw new Error(`Writing style not found: slug=${styleSlug}`);
            }

            const { data: diaryExamples } = await supabaseClient
                .from('reference_diaries')
                .select('*')
                .eq('style_id', style.id)
                .eq('content_type', 'diary_logic')
                .limit(10);

            const pickedDiary = (diaryExamples || []).sort(() => Math.random() - 0.5).slice(0, 2);

            pickedDiary.forEach((ex, i) => {
                examplesText += `\n=== 参考例${i + 1} ===\nタイトル: ${ex.title}\n${ex.body}\n`;
            });

            systemPrompt = `${style.system_prompt}

【絶対に守るべきルール】
- 書き手は男性、読み手は女性です
- 男性が女性に向けて書いている文章にしてください
- 「私も女として...」のような女性視点の表現は絶対に使わないでください
- 二人称は必ず「あなた」を使ってください。「君」「彼女」は絶対に使わないでください

【主語の一貫性（必ず守ること）】
- 「私（男性）」が主語のとき: 私が経験したこと・感じたことを書く
  例: 「私も拒絶され続け、自分の自信が砕けました」→「自分の」であって「彼女の」はNG
- 「あなた（女性読者）」が主語のとき: あなたの悩み・感情・体験を書く
- 「私が〜される → 彼女が〜する/される」という主語のすり替えは絶対禁止

日本語で自然な会話口調で生成してください。`;
        }

        // ================================================================
        // ユーザーメッセージ（共通）
        // ================================================================
        const isBoardMode = contentType === 'board_template';

        const userMessage = `
${isBoardMode ? '掲示板投稿文' : '日記記事'}を**${patternCount}パターン**作成してください。

# 条件
- キーワード: ${selectedKeywords.length > 0 ? selectedKeywords.join(', ') : '自由'}
  ※キーワードはそのまま使う必要はありません。前後の文脈や内容に合わせて自然な形に変化させてください。
${writingTip}

# 参考例（このスタイル・文体・構成を参考にしてください）
${examplesText || '（参考例なし — データベースから取得できませんでした）'}

# 重要な指示（必ず守ること）
1. **${patternCount}パターン**の**全く異なる内容**を作成してください。
2. 各パターンは「---パターン1---」「---パターン2---」のように区切ってください。
3. ${isBoardMode ? 'PASTORフォーミュラの流れに従いつつ' : 'じらし前戯式の流れを意識しつつ'}、構成段落のラベル（「人(Person)」「問題(Problem)」等）は**本文中に含めないでください**。
4. 各パターンの構成:
   - 1行目: 「タイトル: 〇〇〇」
   - 2行目: 空行
   - 3行目以降: 本文
5. **本文は300〜500文字程度で書いてください。**
6. 1〜2文ごとに改行し、段落の区切りでは空行を入れてください。
7. 性的な表現は「◯」などの伏せ字を使ってください。
8. **絶対禁止事項:**
   - 文字数を本文に記載しない（「(428文字)」「(合計文字数: 428)」など禁止）
   - 連絡先情報を含めない（メールアドレス、電話番号、LINE ID、SNSアカウントなど禁止）

# 3パターンの差別化（書き出しだけでなく構成全体を変えること）

## パターン1: 共感・自己開示型
- **口調**: 丁寧・誠実。「〜ました」「〜ています」「〜ではないでしょうか」調。落ち着いた先輩のような語り口
- **書き出し**: 「私も〜で悩み抜きました」など、書き手（男性）の過去の失敗・挫折から始める
- **構成の重点**: Person（自分の体験談）→ Problem（自分が抱えた問題を女性の悩みと重ねる）→ Solution（その経験から得た解決策）→ Offer（信頼感の提示）→ Response
- **禁止**: 主語のすり替え。「私が拒絶された」なら「私の自信が傷ついた」が正しい。「彼女の自信が削がれた」は絶対NG

## パターン2: 願望・欲求リスト型
- **口調**: 男性カジュアル・フランク。「〜だよ」「〜じゃん」「〜してみて」「正直に言う」など、男性的なタメ口のみ使うこと
- **絶対禁止の語尾・表現**: 「〜だよね」「〜じゃない？」「〜かな」「〜な」「〜てる」「〜ちゃう」など女性的・中性的な語尾。「ねえ、あなた。」「ねえ。」で始まる呼びかけ。柔らかい誘い口調全般
- **書き出しの形式（必ずこの形式で始めること）**: 願望リストを直接提示する一文から始める。OK例→「こんな願望、ない？」「正直に聞く。」「一つ聞いていい？」 NG例→「ねえ、あなた。」「あなたに聞きたいことがある。」
- **構成の重点**: Person（欲求のリストアップ）→ Amplify（叶えられない日々の痛み）→ Solution（具体的なプレイ内容の箇条書き）→ Transformation（体験後の変化）→ Response
- **特徴**: 箇条書き多用。女性が「これ私のことだ」と感じるリスト形式
- **厳守**: 冒頭から一貫して**女性読者の願望・欲求を問いかける形**で書くこと。「俺はこうしたい」のような男性の欲求を先に語る前置き段落は絶対禁止。最初の一文から女性に向けて話しかけること

## パターン3: 問題提起・共感痛み型
- **口調**: 自信家・頼もしい。「絶対に〜できる」「任せてほしい」「俺なら〜する」など、強めの断言口調。頼りがいのある男性像を打ち出す
- **書き出し**: 「〜で悩んでいませんか？」など、女性の現在の不満や問題への問いかけから始める
- **構成の重点**: Problem（女性の具体的な不満の描写）→ Amplify（このまま続けばどうなるかの恐怖）→ Solution（解決策）→ Offer（安心感）→ Response
- **特徴**: 女性の痛みに寄り添う描写が中心。「わかってる」という共感を前面に出す

**3パターンは同じテーマでも、切り口・構成・文章のリズムがまったく異なるものにしてください。**

# 出力フォーマット例
---パターン1---
タイトル: ここにタイトル

本文の最初の段落。

次の段落はこのように空行を挟みます。

---パターン2---
タイトル: 別のアプローチのタイトル

（以下同様）

${userPrompt ? `# 追加指示\n${userPrompt}` : ''}
`;

        // ================================================================
        // ストリーミングで生成・返却
        // ================================================================
        const stream = await openai.chat.completions.create({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 2500,
            stream: true,
        });

        const encoder = new TextEncoder();
        const body = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const delta = chunk.choices[0]?.delta?.content;
                        if (delta) {
                            controller.enqueue(encoder.encode(delta));
                        }
                    }
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(body, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
            },
        });

    } catch (error) {
        console.error('[super-processor error]', error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
