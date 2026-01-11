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
    Copy
} from 'lucide-react';
import { fetchWritingConfig, generateColumn, generateSuggestionsFromAI, isDemoMode } from './lib/supabase';

// --- 定数定義 ---
const METHODS = [
    { id: 'teaser', name: 'じらし前戯式' },
    { id: 'emotion', name: '感情動かし式' },
    { id: 'mind', name: 'マインド操作式' },
    { id: 'instant', name: '即セク式' },
    { id: 'agitate', name: '感情煽り式' },
];

const TEMPLATES = {
    diary: [
        { id: 'secret', name: '密会体験日記' },
        { id: 'erotic', name: 'エロ体験日記' },
    ],
    board: [
        { id: 'solve', name: '問題解決型' },
        { id: 'question', name: '疑問形タイトル' },
        { id: 'seven_steps', name: '7ステップ' },
        { id: 'impact', name: 'インパクト' },
        { id: 'healing', name: '癒しパートナー募集' },
        { id: 'kink', name: '性癖推し' },
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

// --- メインコンポーネント ---
export default function App() {
    const [mode, setMode] = useState('diary');
    const [selectedMethod, setSelectedMethod] = useState(METHODS[0]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [isGeneratingPatterns, setIsGeneratingPatterns] = useState(false);
    const [results, setResults] = useState([]);
    const [copiedId, setCopiedId] = useState(null);

    const toggleItem = (item) => {
        if (selectedItems.includes(item)) {
            setSelectedItems(prev => prev.filter(i => i !== item));
        } else {
            setSelectedItems(prev => [...prev, item]);
        }
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

    const generateSuggestions = async (targetTemplate) => {
        const tpl = targetTemplate || selectedTemplate;
        if (!tpl) return;

        setIsGeneratingSuggestions(true);
        setSuggestions([]);
        setKeywords([]);

        try {
            const config = await fetchWritingConfig(selectedMethod.id, tpl.id);

            if (config && config.themes?.length > 0 && config.fragments?.length > 0) {
                setSuggestions(config.themes);
                setKeywords(config.fragments);
            } else {
                const result = await generateSuggestionsFromAI({
                    methodId: selectedMethod.id,
                    templateId: tpl.id,
                    mode
                });
                setSuggestions(result.themes || []);
                setKeywords(result.fragments || []);
            }
        } catch (err) {
            console.error('提案取得エラー:', err);
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    const generateThreePatterns = async () => {
        if (selectedItems.length === 0 || !selectedTemplate) return;
        setIsGeneratingPatterns(true);
        setResults([]);

        try {
            const result = await generateColumn({
                methodId: selectedMethod.id,
                templateId: selectedTemplate.id,
                selectedItems,
                mode
            });

            setResults(result.patterns || []);
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
        setSuggestions([]);
        setKeywords([]);
        setResults([]);
        setSelectedItems([]);
    }, [mode, selectedMethod]);

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
                    <div style={{ position: 'relative', marginBottom: '40px' }}>
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
                                inset: '-8px',
                                borderRadius: '50%',
                                border: '1px solid #D0CEC8'
                            }} />
                            <Leaf style={{ width: '32px', height: '32px', color: '#8A9A8A' }} />
                        </div>
                    </div>
                    <p style={{
                        fontSize: '20px',
                        letterSpacing: '0.3em',
                        color: '#6B6B6B',
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
                        心理技術
                    </p>
                    {METHODS.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method)}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '14px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: selectedMethod.id === method.id ? '#FFFFFF' : 'transparent',
                                cursor: 'pointer',
                                position: 'relative',
                                fontSize: '14px',
                                color: selectedMethod.id === method.id ? '#2C2C2C' : '#5C5C5C',
                                fontWeight: selectedMethod.id === method.id ? 500 : 400,
                                transition: 'all 0.2s',
                                marginBottom: '4px',
                                boxShadow: selectedMethod.id === method.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            {selectedMethod.id === method.id && (
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
                            )}
                            {method.name}
                        </button>
                    ))}
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
                                    onClick={() => { setSelectedTemplate(tpl); generateSuggestions(tpl); }}
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
                                onClick={() => generateSuggestions()}
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
                                再提案
                                <RefreshCw size={14} className={isGeneratingSuggestions ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {/* 言葉の種 */}
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
                                言葉の種
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {isGeneratingSuggestions ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={i} style={{
                                            height: '36px',
                                            width: '180px',
                                            backgroundColor: '#F0EEE8',
                                            borderRadius: '18px'
                                        }} className="animate-pulse" />
                                    ))
                                ) : (
                                    suggestions.map((theme, i) => (
                                        <button
                                            key={i}
                                            onClick={() => toggleItem(theme)}
                                            style={{
                                                padding: '8px 16px',
                                                border: selectedItems.includes(theme) ? '1px solid #2C2C2C' : '1px solid #E0DED8',
                                                borderRadius: '18px',
                                                backgroundColor: selectedItems.includes(theme) ? '#2C2C2C' : '#FFFFFF',
                                                color: selectedItems.includes(theme) ? '#FFFFFF' : '#4A4A4A',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {theme}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 感性の断片 */}
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{
                                fontSize: '12px',
                                color: '#8A8A8A',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Wind size={12} />
                                感性の断片
                            </p>
                            <div style={{
                                padding: '20px',
                                backgroundColor: '#F8F7F4',
                                borderRadius: '12px',
                                border: '1px solid #E8E6E0'
                            }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {isGeneratingSuggestions ? (
                                        Array(10).fill(0).map((_, i) => (
                                            <div key={i} style={{
                                                height: '36px',
                                                width: '70px',
                                                backgroundColor: '#FFFFFF',
                                                borderRadius: '6px'
                                            }} className="animate-pulse" />
                                        ))
                                    ) : (
                                        keywords.map((fragment, i) => (
                                            <button
                                                key={i}
                                                onClick={() => toggleItem(fragment)}
                                                style={{
                                                    padding: '8px 16px',
                                                    border: selectedItems.includes(fragment) ? '1px solid #2C2C2C' : '1px solid #E0DED8',
                                                    borderRadius: '6px',
                                                    backgroundColor: selectedItems.includes(fragment) ? '#2C2C2C' : '#FFFFFF',
                                                    color: selectedItems.includes(fragment) ? '#FFFFFF' : '#4A4A4A',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {fragment}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 生成ボタン */}

                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '16px' }}>
                            <button
                                onClick={generateThreePatterns}
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
                                3パターン生成する
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
                                        <div style={{ marginBottom: '16px' }}>
                                            <p style={{
                                                fontSize: '12px',
                                                color: '#8A8A8A',
                                                marginBottom: '8px',
                                                letterSpacing: '0.1em'
                                            }}>
                                                APPROACH: {selectedMethod.name}
                                            </p>
                                            <h3 style={{
                                                fontSize: '18px',
                                                fontWeight: 500,
                                                color: '#2C2C2C',
                                                fontFamily: "'Noto Serif JP', serif"
                                            }}>
                                                {pattern.titles?.[0] || pattern.approach}
                                            </h3>
                                        </div>

                                        <div style={{
                                            borderTop: '1px solid #F0EEE8',
                                            paddingTop: '24px'
                                        }}>
                                            <TypewriterText text={pattern.content} />
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginTop: '24px',
                                            paddingTop: '16px',
                                            borderTop: '1px solid #F0EEE8'
                                        }}>
                                            <span style={{ fontSize: '12px', color: '#9A9A9A' }}>
                                                {pattern.content.length} 文字
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(pattern.content, idx)}
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
                                                        コピー
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
