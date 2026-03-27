'use client'

import { useState, useEffect } from 'react'

interface DashboardMascotProps {
    running: number
    completed: number
    rate: number
    totalOutput: number
    totalLines: number
}

type MascotMood = 'excited' | 'happy' | 'working' | 'idle' | 'sleeping'

function getMood(running: number, completed: number, rate: number, totalLines: number): MascotMood {
    if (totalLines === 0 || running === 0) return 'sleeping'
    if (rate >= 85) return 'excited'
    if (completed > 0 && running > 0) return 'happy'
    if (running > 0) return 'working'
    return 'idle'
}

const MESSAGES: Record<MascotMood, string[]> = {
    excited: [
        '🌟 สุดยอด! ประสิทธิภาพดีมาก!',
        '🔥 เยี่ยมเลย! ทุกสายกำลังวิ่งเต็มที่!',
        '⚡ ดีมากครับ! ผลผลิตสูงมาก!',
        '🏆 ฟอร์มดีมาก! สู้ๆ นะครับ!',
    ],
    happy: [
        '😊 กำลังดำเนินการอยู่นะครับ!',
        '👍 ทำงานได้ดีทีเดียว!',
        '✅ บางสายเสร็จแล้ว! เยี่ยม!',
        '🙌 ไปได้ดีเลยครับ!',
    ],
    working: [
        '💪 กำลังทำงานอยู่ครับ!',
        '🏭 สายการผลิตกำลังวิ่งอยู่!',
        '⚙️ เดินหน้าต่อไปนะครับ!',
        '🎯 ตั้งใจทำให้ถึงเป้าหมาย!',
    ],
    idle: [
        '🤔 มีข้อมูลใหม่ไหมครับ?',
        '📋 รอการบันทึกข้อมูลอยู่ครับ',
        '👀 คอยดูอยู่นะครับ...',
        '🕐 รอสักครู่ครับ...',
    ],
    sleeping: [
        '💤 ยังไม่มีข้อมูลวันนี้ครับ',
        '😴 รอเริ่มสายการผลิตอยู่...',
        'Zzz... พร้อมเมื่อไหร่ก็บอกนะครับ',
        '🌙 สายการผลิตยังไม่เริ่มครับ',
    ],
}

// SVG Pixel Robot Mascot - 3 animation frames 
function PixelRobot({ mood, frame }: { mood: MascotMood; frame: number }) {
    const colors = {
        excited: { body: '#22D3EE', head: '#06B6D4', eye: '#FBBF24', accent: '#F59E0B' },
        happy: { body: '#34D399', head: '#10B981', eye: '#FBBF24', accent: '#F59E0B' },
        working: { body: '#60A5FA', head: '#3B82F6', eye: '#22D3EE', accent: '#A78BFA' },
        idle: { body: '#94A3B8', head: '#64748B', eye: '#CBD5E1', accent: '#94A3B8' },
        sleeping: { body: '#CBD5E1', head: '#94A3B8', eye: '#E2E8F0', accent: '#CBD5E1' },
    }
    const c = colors[mood]

    // Arm Y offset for animation
    const armOffset = frame === 0 ? 0 : frame === 1 ? -2 : 2
    // Leg positions
    const leftLegX = frame === 1 ? 3 : frame === 2 ? 5 : 4
    const rightLegX = frame === 1 ? 9 : frame === 2 ? 11 : 10

    const isExcited = mood === 'excited'
    const isSleeping = mood === 'sleeping'

    return (
        <svg
            width="80"
            height="100"
            viewBox="0 0 20 25"
            style={{ imageRendering: 'pixelated' }}
        >
            {/* Antenna */}
            <rect x="9" y="0" width="2" height="3" fill={c.head} />
            <rect x="8" y="0" width="4" height="1" fill={c.accent} />
            {isExcited && <rect x="7" y="0" width="6" height="1" fill="#FBBF24" opacity="0.7" />}

            {/* Head */}
            <rect x="4" y="3" width="12" height="8" fill={c.head} />
            <rect x="3" y="4" width="14" height="6" fill={c.head} />

            {/* Eyes */}
            {isSleeping ? (
                <>
                    {/* Sleeping eyes (X X) */}
                    <rect x="6" y="6" width="2" height="1" fill={c.eye} />
                    <rect x="12" y="6" width="2" height="1" fill={c.eye} />
                    <rect x="7" y="5" width="1" height="1" fill={c.eye} />
                    <rect x="13" y="5" width="1" height="1" fill={c.eye} />
                </>
            ) : isExcited ? (
                <>
                    {/* Star eyes */}
                    <rect x="5" y="5" width="4" height="4" fill={c.eye} />
                    <rect x="11" y="5" width="4" height="4" fill={c.eye} />
                    <rect x="6" y="6" width="2" height="2" fill="#FFFFFF" opacity="0.8" />
                    <rect x="12" y="6" width="2" height="2" fill="#FFFFFF" opacity="0.8" />
                </>
            ) : (
                <>
                    {/* Normal eyes */}
                    <rect x="5" y="5" width="4" height="3" fill={c.eye} />
                    <rect x="11" y="5" width="4" height="3" fill={c.eye} />
                    {/* Eye shine */}
                    <rect x="5" y="5" width="2" height="1" fill="#FFFFFF" opacity="0.9" />
                    <rect x="11" y="5" width="2" height="1" fill="#FFFFFF" opacity="0.9" />
                </>
            )}

            {/* Mouth */}
            {isSleeping ? (
                <rect x="8" y="9" width="4" height="1" fill={c.accent} />
            ) : isExcited || mood === 'happy' ? (
                <>
                    <rect x="7" y="9" width="6" height="1" fill={c.accent} />
                    <rect x="6" y="8" width="1" height="1" fill={c.accent} />
                    <rect x="13" y="8" width="1" height="1" fill={c.accent} />
                </>
            ) : (
                <rect x="8" y="9" width="4" height="1" fill={c.accent} />
            )}

            {/* Body */}
            <rect x="5" y="11" width="10" height="8" fill={c.body} />
            <rect x="4" y="12" width="12" height="6" fill={c.body} />

            {/* Chest detail */}
            <rect x="8" y="13" width="4" height="2" fill={c.accent} opacity="0.7" />
            <rect x="9" y="13" width="2" height="2" fill="#FFFFFF" opacity="0.5" />

            {/* Arms */}
            {isExcited ? (
                <>
                    {/* Arms raised up */}
                    <rect x="1" y={9 + armOffset} width="3" height="5" fill={c.body} />
                    <rect x="16" y={9 + armOffset} width="3" height="5" fill={c.body} />
                    {/* Hands */}
                    <rect x="0" y={9 + armOffset} width="3" height="3" fill={c.head} />
                    <rect x="17" y={9 + armOffset} width="3" height="3" fill={c.head} />
                </>
            ) : (
                <>
                    {/* Normal arms */}
                    <rect x="1" y={12 + armOffset} width="3" height="5" fill={c.body} />
                    <rect x="16" y={12 + armOffset} width="3" height="5" fill={c.body} />
                    {/* Hands */}
                    <rect x="1" y={17 + armOffset} width="3" height="2" fill={c.head} />
                    <rect x="16" y={17 + armOffset} width="3" height="2" fill={c.head} />
                </>
            )}

            {/* Legs */}
            {isSleeping ? (
                <>
                    <rect x="6" y="19" width="4" height="4" fill={c.body} />
                    <rect x="10" y="19" width="4" height="4" fill={c.body} />
                </>
            ) : (
                <>
                    <rect x={leftLegX} y="19" width="3" height="4" fill={c.body} />
                    <rect x={rightLegX} y="19" width="3" height="4" fill={c.body} />
                    {/* Feet */}
                    <rect x={leftLegX - 1} y="22" width="5" height="2" fill={c.head} />
                    <rect x={rightLegX - 1} y="22" width="5" height="2" fill={c.head} />
                </>
            )}
        </svg>
    )
}

export default function DashboardMascot({
    running,
    completed,
    rate,
    totalOutput,
    totalLines,
}: DashboardMascotProps) {
    const [frame, setFrame] = useState(0)
    const [messageIndex, setMessageIndex] = useState(0)
    const [showMessage, setShowMessage] = useState(true)

    const mood = getMood(running, completed, rate, totalLines)
    const messages = MESSAGES[mood]

    // Walk/animate frame
    useEffect(() => {
        const speed = mood === 'sleeping' ? 800 : mood === 'excited' ? 200 : 400
        const t = setInterval(() => {
            setFrame(f => (f + 1) % 3)
        }, speed)
        return () => clearInterval(t)
    }, [mood])

    // Rotate messages
    useEffect(() => {
        setMessageIndex(0)
        setShowMessage(true)
        const t = setInterval(() => {
            setShowMessage(false)
            setTimeout(() => {
                setMessageIndex(i => (i + 1) % messages.length)
                setShowMessage(true)
            }, 400)
        }, 3500)
        return () => clearInterval(t)
    }, [mood, messages.length])

    const mascotAnimClass =
        mood === 'sleeping' ? 'mascot-float-slow'
            : mood === 'excited' ? 'mascot-bounce-excited'
                : mood === 'happy' ? 'mascot-float'
                    : 'mascot-float'

    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '16px',
            padding: '16px 20px',
            background: 'var(--color-bg-secondary)',
            border: '3px dashed var(--color-border)',
            borderRadius: '24px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background decoration */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
            }}>
                {mood === 'excited' && Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="mascot-sparkle" style={{
                        position: 'absolute',
                        left: `${10 + i * 16}%`,
                        top: `${20 + (i % 2) * 40}%`,
                        fontSize: '14px',
                        animationDelay: `${i * 0.3}s`,
                    }}>✨</span>
                ))}
            </div>

            {/* Mascot character */}
            <div className={mascotAnimClass} style={{ flexShrink: 0 }}>
                <PixelRobot mood={mood} frame={frame} />
            </div>

            {/* Speech bubble + info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Speech bubble */}
                <div className={`mascot-speech ${showMessage ? 'speech-visible' : 'speech-hidden'}`} style={{
                    background: 'var(--color-bg-card)',
                    border: '3px solid var(--color-border)',
                    borderRadius: '16px',
                    padding: '10px 16px',
                    marginBottom: '10px',
                    position: 'relative',
                    display: 'inline-block',
                    maxWidth: '100%',
                }}>
                    {/* Bubble tail */}
                    <div style={{
                        position: 'absolute',
                        left: '16px',
                        bottom: '-12px',
                        width: '0',
                        height: '0',
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderTop: '12px solid var(--color-border)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        left: '18px',
                        bottom: '-8px',
                        width: '0',
                        height: '0',
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '10px solid var(--color-bg-card)',
                    }} />
                    <p className="cartoon-font" style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {messages[messageIndex]}
                    </p>
                </div>

                {/* Status summary */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px',
                }}>
                    <span style={{
                        fontSize: '12px', fontWeight: 700,
                        color: running > 0 ? 'var(--color-running)' : 'var(--color-text-muted)',
                        background: running > 0 ? 'rgba(251,191,36,0.12)' : 'var(--color-bg-input)',
                        padding: '4px 10px', borderRadius: '100px',
                        fontFamily: "'Nunito', sans-serif",
                    }}>
                        ▶ {running} สายกำลังทำงาน
                    </span>
                    <span style={{
                        fontSize: '12px', fontWeight: 700,
                        color: completed > 0 ? 'var(--color-completed)' : 'var(--color-text-muted)',
                        background: completed > 0 ? 'rgba(52,211,153,0.12)' : 'var(--color-bg-input)',
                        padding: '4px 10px', borderRadius: '100px',
                        fontFamily: "'Nunito', sans-serif",
                    }}>
                        ✓ {completed} สายเสร็จแล้ว
                    </span>
                    <span style={{
                        fontSize: '12px', fontWeight: 700,
                        color: 'var(--color-blue)',
                        background: 'rgba(96,165,250,0.12)',
                        padding: '4px 10px', borderRadius: '100px',
                        fontFamily: "'Nunito', sans-serif",
                    }}>
                        📦 ผลผลิต {totalOutput.toLocaleString()} ชิ้น
                    </span>
                    {totalLines > 0 && (
                        <span style={{
                            fontSize: '12px', fontWeight: 700,
                            color: rate >= 80 ? 'var(--color-completed)' : rate >= 50 ? 'var(--color-running)' : 'var(--color-text-muted)',
                            background: rate >= 80 ? 'rgba(52,211,153,0.12)' : rate >= 50 ? 'rgba(251,191,36,0.12)' : 'var(--color-bg-input)',
                            padding: '4px 10px', borderRadius: '100px',
                            fontFamily: "'Nunito', sans-serif",
                        }}>
                            📊 {rate}% efficiency
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
