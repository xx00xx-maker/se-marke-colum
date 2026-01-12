import React, { useState, useEffect, useRef } from 'react';
import {
    Leaf,
    Wind,
    PenTool,
    Layers,
    Check,
    LayoutGrid,
    MessageSquare,
    Send,
    Sparkles,
    RefreshCw,
    Copy,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { fetchAllKeywordsByCategory, generateContent, isDemoMode } from './lib/supabase';

// --- 定数定義 ---
// styleSlugは固定で使用（テスト用）
const STYLE_SLUG = 'pana_emotion';

const TEMPLATES = {
    diary: [
        { id: 'diary_logic', name: '日記誘導基本構成(PANA)' },
    ],
    board: [
        { id: 'board_template_1', name: 'スローセックス探求' },
        { id: 'board_template_2', name: 'セックスレス解消' },
        { id: 'board_template_3', name: 'パートナー募集' },
        { id: 'board_template_4', name: '味気ないセックス' },
        { id: 'board_template_5', name: '手足わされた体験' },
        { id: 'board_template_6', name: '専門家スローセックス' },
        { id: 'board_template_7', name: '焦らしスローセックス' },
        { id: 'board_template_8', name: '連続イキ' },
        { id: 'board_template_9', name: '中イキ開発' },
        { id: 'board_template_10', name: '中イキ・ポルチオ刺激' },
    ]
};

// --- タイピング演出コンポーネント ---
const TypewriterText = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [isFinished, setIsFinished] = useState(false);
    const indexRef = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => {
        setDisplayedText("");
        setIsFinished(false);
        indexRef.current = 0;
        const speed = text.length > 500 ? 3 : 8;

        timerRef.current = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayedText(prev => prev + text.charAt(indexRef.current));
                indexRef.current += 1;
            } else {
                clearInterval(timerRef.current);
                setIsFinished(true);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(timerRef.current);
    }, [text, onComplete]);

    return (
        <div className={`leading-[2] whitespace-pre-wrap text-[15px] transition-colors duration-500 ${isFinished ? 'text-[#2C2C2C]' : 'text-[#9A9A9A]'
            }`}>
            {displayedText}
            {!isFinished && <span className="inline-block w-0.5 h-4 bg-[#6B7C6B] ml-0.5 animate-pulse" />}
        </div>
    );
};

// カテゴリ名の日本語マッピング
const CATEGORY_NAMES = {
    'board_writing_tip': 'ライティングTips',
    'emotion': '感情・気持ち',
    'situation': 'シチュエーション',
    'technique': 'テクニック',
};

// --- メインコンポーネント ---
export default function App() {
    const [mode, setMode] = useState('diary');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [isGeneratingPatterns, setIsGeneratingPatterns] = useState(false);
    const [results, setResults] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    const [keywordsByCategory, setKeywordsByCategory] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [displayStartIndex, setDisplayStartIndex] = useState({}); // 各カテゴリの表示開始インデックス

    const KEYWORDS_PER_PAGE = 10; // 1カテゴリあたりの表示数

    const toggleItem = (item) => {
        if (selectedItems.includes(item)) {
            setSelectedItems(prev => prev.filter(i => i !== item));
        } else {
            setSelectedItems(prev => [...prev, item]);
        }
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // 次の10件を表示
    const nextCategory = (category) => {
        const keywords = keywordsByCategory[category] || [];
        if (keywords.length <= KEYWORDS_PER_PAGE) return;

        const currentStart = displayStartIndex[category] || 0;
        const nextStart = (currentStart + KEYWORDS_PER_PAGE) % keywords.length;

        setDisplayStartIndex(prev => ({
            ...prev,
            [category]: nextStart
        }));
    };

    // 前の10件を表示
    const prevCategory = (category) => {
        const keywords = keywordsByCategory[category] || [];
        if (keywords.length <= KEYWORDS_PER_PAGE) return;

        const currentStart = displayStartIndex[category] || 0;
        let prevStart = currentStart - KEYWORDS_PER_PAGE;
        if (prevStart < 0) prevStart = keywords.length + prevStart;

        setDisplayStartIndex(prev => ({
            ...prev,
            [category]: prevStart
        }));
    };

    // カテゴリの表示用キーワードを取得（10個）
    const getDisplayKeywords = (category) => {
        const keywords = keywordsByCategory[category] || [];
        if (keywords.length <= KEYWORDS_PER_PAGE) return keywords;

        const start = displayStartIndex[category] || 0;
        const result = [];
        for (let i = 0; i < KEYWORDS_PER_PAGE; i++) {
            result.push(keywords[(start + i) % keywords.length]);
        }
        return result;
    };

    const copyToClipboard = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    // knowledge_chunksからカテゴリ別キーワードを取得
    const loadKeywords = async () => {
        setIsGeneratingSuggestions(true);
        setKeywordsByCategory({});

        try {
            const fetched = await fetchAllKeywordsByCategory();
            setKeywordsByCategory(fetched);
            // 全カテゴリを最初は開いた状態にする
            const expanded = {};
            Object.keys(fetched).forEach(cat => {
                expanded[cat] = true;
            });
            setExpandedCategories(expanded);
        } catch (err) {
            console.error('キーワード取得エラー:', err);
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    // テンプレート選択時にキーワードを読み込み
    const handleTemplateSelect = async (tpl) => {
        setSelectedTemplate(tpl);
        setSelectedItems([]);
        await loadKeywords();
    };

    // コンテンツ生成
    const generateContentHandler = async () => {
        if (selectedItems.length === 0 || !selectedTemplate) return;
        setIsGeneratingPatterns(true);
        setResults([]);

        try {
            // contentType を決定
            const contentType = mode === 'diary' ? 'diary_logic' : 'board_template';

            const result = await generateContent({
                styleSlug: STYLE_SLUG,
                contentType,
                selectedKeywords: selectedItems,
                userPrompt: ''
            });

            // レスポンスを結果配列に変換
            if (result && result.content) {
                // パターンを分割（---パターンN---で区切る）
                const patternTexts = result.content
                    .split(/---パターン\d+---/)
                    .filter(p => p.trim().length > 0)
                    .map(p => p.trim());

                // パターンがなければ全体を1つのパターンとして扱う
                const patterns = patternTexts.length > 0 ? patternTexts : [result.content];

                // 各パターンをタイトルと本文に分割
                const parsedResults = patterns.map((text, idx) => {
                    // タイトル行を検出
                    const titleMatch = text.match(/^タイトル[:：]\s*(.+)/m);
                    const title = titleMatch ? titleMatch[1].trim() : `パターン ${idx + 1}`;

                    // タイトル行を除いた本文
                    let body = text;
                    if (titleMatch) {
                        body = text.replace(/^タイトル[:：]\s*.+\n?/m, '').trim();
                    }

                    return {
                        approach: 'じらし前戯式',
                        title: title,
                        content: body,
                        model: result.model,
                        appliedTip: result.appliedTip
                    };
                });

                setResults(parsedResults);
            }

            setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } catch (err) {
            console.error('生成エラー:', err);
        } finally {
            setIsGeneratingPatterns(false);
        }
    };

    useEffect(() => {
        setSelectedTemplate(null);
        setKeywordsByCategory({});
        setExpandedCategories({});
        setResults([]);
        setSelectedItems([]);
    }, [mode]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FAFAF8' }}>

            {/* ローディングオーバーレイ */}
            {isGeneratingPatterns && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    backgroundColor: 'rgba(250, 250, 248, 0.98)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="animate-pulse-grow" style={{ position: 'relative', marginBottom: '40px' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: '1px solid #E0DED8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}>
                            <div className="animate-breathe" style={{
                                position: 'absolute',
                                inset: '-12px',
                                borderRadius: '50%',
                                border: '2px solid #C5C3BD'
                            }} />
                            <div className="animate-breathe" style={{
                                position: 'absolute',
                                inset: '-24px',
                                borderRadius: '50%',
                                border: '1px solid #D8D6D0',
                                animationDelay: '0.5s'
                            }} />
                            <Leaf className="animate-float" style={{ width: '36px', height: '36px', color: '#6B7C6B' }} />
                        </div>
                    </div>
                    <p className="animate-pulse" style={{
                        fontSize: '22px',
                        letterSpacing: '0.3em',
                        color: '#5A5A5A',
                        marginBottom: '12px',
                        fontFamily: "'Noto Serif JP', serif"
                    }}>
                        言葉を紡いでいます...
                    </p>
                    <p style={{ fontSize: '12px', color: '#9A9A9A', letterSpacing: '0.1em' }}>
                        禅の静寂の中で、想いを形にしています
                    </p>
                </div>
            )}

            {/* サイドバー */}
            <aside style={{
                width: '200px',
                backgroundColor: '#F5F4F0',
                borderRight: '1px solid #E8E6E0',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
            }}>
                <div style={{ padding: '32px 24px' }}>
                    <h1 style={{
                        fontSize: '20px',
                        fontWeight: 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: "'Noto Serif JP', serif"
                    }}>
                        <Leaf style={{ width: '18px', height: '18px', color: '#6B7C6B' }} />
                        言の葉
                    </h1>
                </div>

                <nav style={{ flex: 1, padding: '0 12px' }}>
                    <p style={{
                        padding: '12px 16px',
                        fontSize: '11px',
                        color: '#8A8A8A',
                        fontWeight: 500,
                        letterSpacing: '0.05em'
                    }}>
                        スタイル
                    </p>
                    <div style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        fontSize: '14px',
                        color: '#2C2C2C',
                        fontWeight: 500,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '3px',
                            height: '20px',
                            backgroundColor: '#6B7C6B',
                            borderRadius: '0 2px 2px 0'
                        }} />
                        じらし前戯式
                    </div>
                    <p style={{
                        padding: '16px 16px 8px',
                        fontSize: '10px',
                        color: '#AAAAAA',
                    }}>
                        ※ テスト用に固定
                    </p>
                </nav>
            </aside>

            {/* メイン */}
            <main style={{ flex: 1, overflowY: 'auto' }}>
                {/* ヘッダー */}
                <header style={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'rgba(250, 250, 248, 0.9)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10,
                    borderBottom: '1px solid #ECEAE4',
                    padding: '16px 0'
                }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            display: 'flex',
                            padding: '4px',
                            backgroundColor: '#EFEEE8',
                            borderRadius: '24px'
                        }}>
                            <button
                                onClick={() => setMode('diary')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 24px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    backgroundColor: mode === 'diary' ? '#FFFFFF' : 'transparent',
                                    color: mode === 'diary' ? '#2C2C2C' : '#8A8A8A',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: mode === 'diary' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                <LayoutGrid size={16} />
                                日記
                            </button>
                            <button
                                onClick={() => setMode('board')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '10px 24px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    backgroundColor: mode === 'board' ? '#FFFFFF' : 'transparent',
                                    color: mode === 'board' ? '#2C2C2C' : '#8A8A8A',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: mode === 'board' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                                }}
                            >
                                <MessageSquare size={16} />
                                掲示板
                            </button>
                        </div>
                    </div>
                </header>

                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 32px 120px' }}>
                    {/* STEP 01 */}
                    <section style={{ marginBottom: '48px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#2C2C2C',
                                color: '#FFFFFF',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                letterSpacing: '0.05em'
                            }}>
                                STEP 01
                            </span>
                            <h2 style={{ fontSize: '18px', fontWeight: 500, fontFamily: "'Noto Serif JP', serif" }}>
                                型の選択
                            </h2>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {TEMPLATES[mode].map((tpl) => (
                                <button
                                    key={tpl.id}
                                    onClick={() => handleTemplateSelect(tpl)}
                                    style={{
                                        padding: '16px 32px',
                                        border: selectedTemplate?.id === tpl.id ? '2px solid #2C2C2C' : '1px solid #E0DED8',
                                        borderRadius: '8px',
                                        backgroundColor: selectedTemplate?.id === tpl.id ? '#F8F8F6' : '#FFFFFF',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: selectedTemplate?.id === tpl.id ? 500 : 400
                                    }}
                                >
                                    {tpl.name}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* STEP 02 */}
                    <section style={{
                        marginBottom: '48px',
                        opacity: selectedTemplate ? 1 : 0.3,
                        pointerEvents: selectedTemplate ? 'auto' : 'none',
                        transition: 'opacity 0.3s'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: '#2C2C2C',
                                    color: '#FFFFFF',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    letterSpacing: '0.05em'
                                }}>
                                    STEP 02
                                </span>
                                <h2 style={{ fontSize: '18px', fontWeight: 500, fontFamily: "'Noto Serif JP', serif" }}>
                                    感性を刺激する
                                </h2>
                            </div>
                            <button
                                onClick={loadKeywords}
                                disabled={isGeneratingSuggestions}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    color: '#6B7C6B',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                再読み込み
                                <RefreshCw size={14} className={isGeneratingSuggestions ? 'animate-spin' : ''} />
                            </button>
                        </div>


                        {/* カテゴリ別キーワード選択 */}
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{
                                fontSize: '12px',
                                color: '#8A8A8A',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Sparkles size={12} />
                                カテゴリからキーワードを選択
                            </p>

                            {isGeneratingSuggestions ? (
                                <div style={{
                                    padding: '20px',
                                    backgroundColor: '#F8F7F4',
                                    borderRadius: '12px',
                                    border: '1px solid #E8E6E0'
                                }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {Array(10).fill(0).map((_, i) => (
                                            <div key={i} style={{
                                                height: '36px',
                                                width: '100px',
                                                backgroundColor: '#FFFFFF',
                                                borderRadius: '6px'
                                            }} className="animate-pulse" />
                                        ))}
                                    </div>
                                </div>
                            ) : Object.keys(keywordsByCategory).length === 0 ? (
                                <div style={{
                                    padding: '40px 20px',
                                    backgroundColor: '#F8F7F4',
                                    borderRadius: '12px',
                                    border: '1px solid #E8E6E0',
                                    textAlign: 'center',
                                    color: '#9A9A9A',
                                    fontSize: '14px'
                                }}>
                                    テンプレートを選択するとキーワードが表示されます
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {Object.entries(keywordsByCategory).map(([category, allKeywords]) => (
                                        <div key={category} style={{
                                            backgroundColor: '#F8F7F4',
                                            borderRadius: '12px',
                                            border: '1px solid #E8E6E0',
                                            overflow: 'hidden'
                                        }}>
                                            {/* カテゴリヘッダー */}
                                            <button
                                                onClick={() => toggleCategory(category)}
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '14px 16px',
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                    color: '#4A4A4A',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Layers size={14} style={{ color: '#6B7C6B' }} />
                                                    {CATEGORY_NAMES[category] || category}
                                                </span>
                                                {expandedCategories[category] ? (
                                                    <ChevronUp size={16} style={{ color: '#8A8A8A' }} />
                                                ) : (
                                                    <ChevronDown size={16} style={{ color: '#8A8A8A' }} />
                                                )}
                                            </button>

                                            {/* キーワード一覧 */}
                                            {expandedCategories[category] && (
                                                <div style={{ padding: '0 16px 16px' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap: '8px',
                                                        marginBottom: allKeywords.length > KEYWORDS_PER_PAGE ? '12px' : '0'
                                                    }}>
                                                        {getDisplayKeywords(category).map((keyword, i) => (
                                                            <button
                                                                key={`${category}-${i}-${keyword}`}
                                                                onClick={() => toggleItem(keyword)}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    border: selectedItems.includes(keyword) ? '1px solid #2C2C2C' : '1px solid #E0DED8',
                                                                    borderRadius: '6px',
                                                                    backgroundColor: selectedItems.includes(keyword) ? '#2C2C2C' : '#FFFFFF',
                                                                    color: selectedItems.includes(keyword) ? '#FFFFFF' : '#4A4A4A',
                                                                    fontSize: '13px',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {keyword}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {/* ナビゲーションボタン */}
                                                    {allKeywords.length > KEYWORDS_PER_PAGE && (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {(displayStartIndex[category] || 0) > 0 && (
                                                                <button
                                                                    onClick={() => prevCategory(category)}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '6px',
                                                                        padding: '6px 12px',
                                                                        border: '1px dashed #C5C3BD',
                                                                        borderRadius: '6px',
                                                                        backgroundColor: 'transparent',
                                                                        color: '#6B7C6B',
                                                                        fontSize: '12px',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    <ChevronUp size={12} />
                                                                    前の10件
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => nextCategory(category)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '6px 12px',
                                                                    border: '1px dashed #C5C3BD',
                                                                    borderRadius: '6px',
                                                                    backgroundColor: 'transparent',
                                                                    color: '#6B7C6B',
                                                                    fontSize: '12px',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                次の10件
                                                                <ChevronDown size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 選択中のキーワード表示 */}
                            {selectedItems.length > 0 && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px 16px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '8px',
                                    border: '1px solid #6B7C6B',
                                }}>
                                    <p style={{
                                        fontSize: '11px',
                                        color: '#6B7C6B',
                                        marginBottom: '8px',
                                        fontWeight: 500
                                    }}>
                                        選択中: {selectedItems.length}個
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {selectedItems.map((item, i) => (
                                            <span key={i} style={{
                                                padding: '4px 10px',
                                                backgroundColor: '#2C2C2C',
                                                color: '#FFFFFF',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 生成ボタン */}

                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '16px' }}>
                            <button
                                onClick={generateContentHandler}
                                disabled={selectedItems.length === 0 || isGeneratingPatterns}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '18px 48px',
                                    borderRadius: '32px',
                                    border: 'none',
                                    backgroundColor: selectedItems.length === 0 ? '#CCCCCC' : '#2C2C2C',
                                    color: '#FFFFFF',
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    letterSpacing: '0.1em'
                                }}
                            >
                                コンテンツを生成する
                                <Send size={18} />
                            </button>
                        </div>
                    </section>

                    {/* 結果表示 */}
                    {results.length > 0 && (
                        <section id="results-section" style={{ paddingTop: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    backgroundColor: '#2C2C2C',
                                    color: '#FFFFFF',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    letterSpacing: '0.05em'
                                }}>
                                    RESULT
                                </span>
                                <h2 style={{ fontSize: '18px', fontWeight: 500, fontFamily: "'Noto Serif JP', serif" }}>
                                    紡ぎ出された三つの言葉
                                </h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {results.map((pattern, idx) => (
                                    <div
                                        key={idx}
                                        className="animate-fade-in"
                                        style={{
                                            backgroundColor: '#FFFFFF',
                                            borderRadius: '16px',
                                            border: '1px solid #E8E6E0',
                                            padding: '32px',
                                            animationDelay: `${idx * 0.1}s`
                                        }}
                                    >
                                        {/* APPROACH ラベル */}
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#9A9A9A',
                                            marginBottom: '8px',
                                            letterSpacing: '0.15em',
                                            fontWeight: 500
                                        }}>
                                            APPROACH: {pattern.approach}
                                        </p>

                                        {/* タイトル */}
                                        <h3 style={{
                                            fontSize: '18px',
                                            fontWeight: 500,
                                            color: '#2C2C2C',
                                            fontFamily: "'Noto Serif JP', serif",
                                            marginBottom: '24px',
                                            lineHeight: 1.5
                                        }}>
                                            {pattern.title}
                                        </h3>

                                        {/* 本文（左ボーダー付き） */}
                                        <div style={{
                                            borderLeft: '3px solid #E8E6E0',
                                            paddingLeft: '20px',
                                            marginBottom: '24px'
                                        }}>
                                            {pattern.content.split('\n\n').map((paragraph, pIdx) => (
                                                <p
                                                    key={pIdx}
                                                    style={{
                                                        fontSize: '14px',
                                                        lineHeight: 1.9,
                                                        color: '#3A3A3A',
                                                        marginBottom: pIdx < pattern.content.split('\n\n').length - 1 ? '16px' : 0
                                                    }}
                                                >
                                                    {paragraph.split('\n').map((line, lIdx) => (
                                                        <span key={lIdx}>
                                                            {line}
                                                            {lIdx < paragraph.split('\n').length - 1 && <br />}
                                                        </span>
                                                    ))}
                                                </p>
                                            ))}
                                        </div>

                                        {/* フッター: 文字数 + コピーボタン */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            paddingTop: '16px',
                                            borderTop: '1px solid #F0EEE8'
                                        }}>
                                            <span style={{ fontSize: '12px', color: '#9A9A9A' }}>
                                                文字数: {pattern.content.length} 字
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(`${pattern.title}\n\n${pattern.content}`, idx)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #E0DED8',
                                                    backgroundColor: copiedId === idx ? '#6B7C6B' : '#FFFFFF',
                                                    color: copiedId === idx ? '#FFFFFF' : '#4A4A4A',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {copiedId === idx ? (
                                                    <>
                                                        <Check size={14} />
                                                        コピー完了
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={14} />
                                                        コピーする
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
