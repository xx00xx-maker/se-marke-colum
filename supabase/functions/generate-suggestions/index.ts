// supabase/functions/generate-suggestions/index.ts
// AI提案生成用のEdge Function
//
// 必要な環境変数（Supabase Dashboard > Project Settings > Edge Functions で設定）:
// - OPENROUTER_API_KEY: OpenRouterのAPIキー

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { methodId, templateId, mode } = await req.json()

        // バリデーション
        if (!methodId || !templateId || !mode) {
            throw new Error('必須パラメータが不足しています')
        }

        const methodNames: Record<string, string> = {
            'teaser': 'じらし前戯式',
            'emotion': '感情動かし式',
            'mind': 'マインド操作式',
            'instant': '即セク式',
            'agitate': '感情煽り式'
        }

        const templateNames: Record<string, string> = {
            'secret': '密会体験日記',
            'erotic': 'エロ体験日記',
            'solve': '問題解決型',
            'question': '疑問形タイトル',
            'seven_steps': '7ステップ',
            'impact': 'インパクト',
            'healing': '癒しパートナー募集',
            'kink': '性癖推し'
        }

        const systemPrompt = `あなたは官能的かつ知的なライターです。
ユーザーがキーワードを選べるよう、短く刺激的なテーマと断片を提案してください。
回答は必ずJSON形式のみで出力してください。`

        const userPrompt = `
モード: ${mode}
手法: ${methodNames[methodId] || methodId}
型: ${templateNames[templateId] || templateId}

以下のJSON形式で提案を生成してください:
{
  "themes": ["シチュエーション案1", "シチュエーション案2", "シチュエーション案3", "シチュエーション案4", "シチュエーション案5"],
  "fragments": ["五感キーワード1", "感情キーワード2", "シチュエーション3", "官能的単語4", "形容詞5", "動詞6", "名詞7", "副詞8", "擬態語9", "雰囲気10"]
}

themes: その手法と型に最適なシチュエーション案（5つ）- 具体的で刺激的な状況設定
fragments: 五感、シチュエーション、官能的な単語（10個）- 短い単語やフレーズ
`

        // OpenRouter API呼び出し
        const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
        if (!openrouterApiKey) {
            throw new Error('OPENROUTER_API_KEY が設定されていません')
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openrouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': Deno.env.get('SITE_URL') || 'https://kotonoha.vercel.app',
                'X-Title': 'Kotonoha Suggestions',
            },
            body: JSON.stringify({
                model: 'x-ai/grok-3-fast',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.9,
                max_tokens: 1000,
                response_format: { type: 'json_object' }
            })
        })

        if (!response.ok) {
            const errorData = await response.text()
            console.error('OpenRouter API Error:', errorData)
            throw new Error(`OpenRouter API エラー: ${response.status}`)
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content

        if (!content) {
            throw new Error('AIからの応答が空です')
        }

        // JSONパース
        let parsedResult
        try {
            parsedResult = JSON.parse(content)
        } catch (e) {
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                parsedResult = JSON.parse(jsonMatch[0])
            } else {
                throw new Error('JSON解析に失敗しました')
            }
        }

        return new Response(
            JSON.stringify({ result: parsedResult }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )

    } catch (error) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Unknown error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
