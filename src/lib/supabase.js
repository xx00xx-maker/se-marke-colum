import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// デモモード判定
export const isDemoMode = !supabaseUrl || !supabaseAnonKey

if (isDemoMode) {
    console.warn('🎭 デモモードで動作中。.env.localにSupabase設定を追加すると本番モードになります。')
}

export const supabase = isDemoMode ? null : createClient(supabaseUrl, supabaseAnonKey)

// デモ用モックデータ
const DEMO_DATA = {
    themes: [
        "偶然の再会から始まる禁断の関係",
        "出張先のホテルバーでの出会い",
        "雨の日の相合傘から始まる物語",
        "幼馴染との思わぬ再会",
        "SNSで見つけた懐かしい人"
    ],
    fragments: [
        "唇", "吐息", "月明かり", "沈黙", "指先",
        "鼓動", "香り", "囁き", "熱", "秘密"
    ]
}

const DEMO_PATTERNS = [
    {
        approach: "直球型",
        titles: ["禁断の夜に溺れて", "あの人との秘密", "運命の再会", "忘れられない夜", "二人だけの時間"],
        content: "あの日、偶然が私たちを引き寄せた。\n\n長い間忘れていたはずの気持ちが、彼の姿を見た瞬間に蘇った。心臓が高鳴り、言葉を失う私。彼もまた、同じように立ち尽くしていた。\n\n「久しぶり」\n\nその一言が、すべての始まりだった。時間は残酷なほど速く過ぎ、気づけば二人きりの空間に。窓の外には煌めく夜景、そして静かに流れるジャズ。\n\n彼の瞳に映る私は、かつてとは違う女になっていた。成熟した魅力、抑えきれない欲望。互いの視線が絡み合い、言葉なき会話が続く。\n\n「今夜だけ、過去に戻れないだろうか」\n\n彼の囁きに、私の理性は音を立てて崩れた。"
    },
    {
        approach: "暗示型",
        titles: ["月明かりの約束", "沈黙が語る想い", "触れられない距離", "時を超えた情熱", "秘密の花園"],
        content: "月明かりが二人を照らしていた。\n\n言葉は必要なかった。ただ、互いの息遣いだけが空間を満たす。彼の指先が、そっと私の頬に触れる。まるで壊れ物を扱うように、優しく、けれど確かな意志を持って。\n\n私は目を閉じた。瞼の裏に浮かぶのは、あの日の記憶。若さゆえの情熱、そして別れ。今、時を経て再び巡り会えた奇跡に、胸が締め付けられる。\n\n「ずっと、探していた」\n\n彼の声が震えていた。強がりの仮面を脱いだ彼は、あの頃と同じ純粋さを宿していた。\n\n私たちは、運命に抗えない。\n\n月が雲に隠れる頃、二人の影は一つになった。"
    },
    {
        approach: "物語型",
        titles: ["雨音のセレナーデ", "ホテルの一夜", "運命という名の偶然", "あの夏の続き", "禁じられた恋路"],
        content: "雨が激しく窓を叩いていた。\n\n出張先のホテルのバー。締め切りに追われる日々から束の間の解放を求めて、私はカウンターに腰を下ろした。バーテンダーが差し出したカクテルに口をつけた瞬間、隣に誰かが座る気配がした。\n\n振り向いた私は、息を呑んだ。\n\n「まさか、こんなところで」\n\n10年ぶりの再会。学生時代、誰にも言えない関係だった彼。結局、何も言えないまま別々の道を歩んだ。\n\n「運命だと思わないか」\n\n彼の言葉に、私は微笑むしかなかった。運命。そう、これは運命なのだ。\n\n雨音が、二人だけの世界を作り出す。グラスを傾けながら、私たちは時間を取り戻すように語り合った。そして、夜が更けるにつれ、距離は縮まっていく。\n\n「部屋、来ないか」\n\n答えは、言葉ではなく、行動で示した。"
    }
]

/**
 * ナレッジ設定を取得
 */
export async function fetchWritingConfig(methodId, templateId) {
    if (isDemoMode) {
        // デモモードではモックデータを返す
        return {
            themes: DEMO_DATA.themes,
            fragments: DEMO_DATA.fragments
        }
    }

    const { data, error } = await supabase
        .from('writing_config')
        .select('*')
        .eq('method_id', methodId)
        .eq('template_id', templateId)
        .single()

    if (error) {
        console.error('ナレッジ取得エラー:', error)
        return null
    }
    return data
}

/**
 * Edge Function経由でコラム生成
 */
export async function generateColumn({ methodId, templateId, selectedItems, mode }) {
    if (isDemoMode) {
        // デモモードではモックデータを返す（少し遅延を入れてローディングを見せる）
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { patterns: DEMO_PATTERNS }
    }

    const { data, error } = await supabase.functions.invoke('generate-column', {
        body: { methodId, templateId, selectedItems, mode }
    })

    if (error) {
        throw new Error(error.message || 'コラム生成に失敗しました')
    }

    return data.result
}

/**
 * Edge Function経由でAI提案を取得
 */
export async function generateSuggestionsFromAI({ methodId, templateId, mode }) {
    if (isDemoMode) {
        // デモモードではモックデータを返す
        await new Promise(resolve => setTimeout(resolve, 500))
        return DEMO_DATA
    }

    const { data, error } = await supabase.functions.invoke('generate-suggestions', {
        body: { methodId, templateId, mode }
    })

    if (error) {
        throw new Error(error.message || '提案取得に失敗しました')
    }

    return data.result
}

/**
 * knowledge_chunksテーブルからキーワードを取得
 */
export async function fetchKeywordsFromKnowledgeChunks(category = 'board_writing_tip') {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return DEMO_DATA.fragments
    }

    const { data, error } = await supabase
        .from('knowledge_chunks')
        .select('content')
        .eq('category', category)
        .limit(20)

    if (error) {
        console.error('キーワード取得エラー:', error)
        return []
    }

    return data.map(item => item.content)
}

/**
 * knowledge_chunksテーブルから全カテゴリのキーワードを取得
 * カテゴリ別にグループ化して返す
 */
export async function fetchAllKeywordsByCategory() {
    if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        return {
            'board_writing_tip': DEMO_DATA.fragments,
            'sample_keywords': ['サンプル1', 'サンプル2', 'サンプル3']
        }
    }

    const { data, error } = await supabase
        .from('knowledge_chunks')
        .select('category, content')
        .order('category')

    if (error) {
        console.error('キーワード取得エラー:', error)
        return {}
    }

    // カテゴリ別にグループ化
    const grouped = {}
    data.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = []
        }
        grouped[item.category].push(item.content)
    })

    return grouped
}

/**
 * Edge Function をストリーミングで呼び出し
 * onChunk(accumulated) が各チャンク到着時に呼ばれる
 * 戻り値は完全なテキスト
 */
export async function generateContentStreaming({
    styleSlug = 'pana_emotion',
    contentType = 'board_template',
    conceptId = null,
    selectedKeywords = [],
    userPrompt = '',
    onChunk,
}) {
    if (isDemoMode) {
        const demoContent = [
            '---パターン1---',
            'タイトル: デモ: 共感・自己開示型',
            '',
            '私も長年、同じ悩みを抱えていました。',
            '',
            'あなたは今、このような状況ではありませんか？',
            '毎日が単調で、もっと深い繋がりを求めている…',
            '',
            '私が学んだのは、小さな変化が大きな違いを生むということです。',
        ].join('\n')

        let i = 0
        let acc = ''
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (i < demoContent.length) {
                    acc += demoContent[i++]
                    onChunk(acc)
                } else {
                    clearInterval(interval)
                    resolve()
                }
            }, 15)
        })
        return demoContent
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/super-processor`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ styleSlug, contentType, conceptId, selectedKeywords, userPrompt }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        let msg = errorText
        try {
            const parsed = JSON.parse(errorText)
            msg = parsed.error || errorText
        } catch (_) {}
        throw new Error(msg || 'コンテンツ生成に失敗しました')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        fullContent += text
        onChunk(fullContent)
    }

    return fullContent
}

