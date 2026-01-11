// supabase/functions/generate-column/index.ts
// Supabaseダッシュボードの Edge Functions で作成してください
//
// 必要な環境変数（Supabase Dashboard > Project Settings > Edge Functions で設定）:
// - OPENROUTER_API_KEY: OpenRouterのAPIキー
// - SITE_URL: デプロイ先のURL（例: https://kotonoha.vercel.app）

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
        const { methodId, templateId, selectedItems, mode } = await req.json()

        // バリデーション
        if (!methodId || !templateId || !selectedItems || !mode) {
            throw new Error('必須パラメータが不足しています')
        }

        // Supabaseクライアント作成
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        )

        // ナレッジ取得（カスタムプロンプトがあれば使用）
        const { data: config } = await supabaseClient
            .from('writing_config')
            .select('system_prompt')
            .eq('method_id', methodId)
            .eq('template_id', templateId)
            .single()

        // 文字数制限の設定
        const charLimit = mode === 'diary'
            ? '800〜1000文字の日本語で詳細に'
            : '300〜500文字の日本語で簡潔に'

        const inputText = selectedItems.join('、')

        // プロンプト構築
        const systemPrompt = config?.system_prompt ||
            `「言の葉」AIとして、刺激的な文章を3つ生成してください。
【重要】日記モードは一編あたり必ず800文字以上のボリュームを確保してください。回答はJSONのみ。`

        const userPrompt = `
選択された要素: ${inputText}
モード: ${mode}, 要求文字数: ${charLimit}

以下のJSON形式で3つのパターンを生成してください:
{
  "patterns": [
    {
      "approach": "アプローチ名（例：直球型、暗示型、物語型）",
      "titles": ["メインタイトル", "サブタイトル案1", "サブタイトル案2", "サブタイトル案3", "サブタイトル案4"],
      "content": "本文（指定文字数を守ること）"
    }
  ]
}
`

        // OpenRouter (Grok) API呼び出し
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
                'X-Title': 'Kotonoha Column Generator',
            },
            body: JSON.stringify({
                model: 'x-ai/grok-3-fast',  // Grok 4.1 Fast
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.9,
                max_tokens: 8000,
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
            // JSONが不完全な場合、マッチを試みる
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
