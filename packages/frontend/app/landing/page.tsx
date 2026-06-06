'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowRight, Check, Shield, Lock, Users, RotateCcw, TrendingUp } from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'
import { useTheme } from '@/lib/theme'

/* ── Unsplash member photos ────────────────────────── */
const MEMBERS = [
    { init: 'MC', name: 'Mama Chisom',  color: '#7C3AED', img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face' },
    { init: 'AO', name: 'Adaeze O.',   color: '#059669', img: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=80&h=80&fit=crop&crop=face' },
    { init: 'TI', name: 'Tunde I.',    color: '#2563EB', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
    { init: 'FK', name: 'Funke C.',    color: '#DB2777', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
    { init: 'NG', name: 'Ngozi K.',    color: '#D97706', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face' },
    { init: 'FN', name: 'Fatima N.',   color: '#0891B2', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face' },
    { init: 'CE', name: 'Chidinma E.', color: '#65A30D', img: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=80&h=80&fit=crop&crop=face' },
    { init: 'EO', name: 'Emeka O.',    color: '#9333EA', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
]

/* ── Orbit animation (contained in right column) ───── */
function OrbitIllustration() {
    const [active, setActive] = useState(0)

    useEffect(() => {
        const id = setInterval(() => setActive(v => (v + 1) % MEMBERS.length), 2000)
        return () => clearInterval(id)
    }, [])

    const n = MEMBERS.length
    const cx = 200, cy = 200
    const r1 = 110, r2 = 155

    return (
        <div className="relative w-[400px] h-[400px] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 400 400" className="w-full h-full" style={{ overflow: 'visible' }}>
                <defs>
                    {MEMBERS.map((_, i) => (
                        <clipPath key={i} id={`av-${i}`}>
                            <circle
                                cx={cx + (i % 2 === 0 ? r1 : r2) * Math.cos((i / n) * Math.PI * 2 - Math.PI / 2)}
                                cy={cy + (i % 2 === 0 ? r1 : r2) * Math.sin((i / n) * Math.PI * 2 - Math.PI / 2)}
                                r={i === active ? 26 : 20}
                            />
                        </clipPath>
                    ))}
                </defs>

                {/* Orbit rings */}
                <circle cx={cx} cy={cy} r={r1} fill="none" stroke="rgba(0,200,150,0.15)" strokeWidth={1} strokeDasharray="4 7" />
                <circle cx={cx} cy={cy} r={r2} fill="none" stroke="rgba(0,200,150,0.08)" strokeWidth={1} strokeDasharray="3 10" />

                {/* Lines to active */}
                {MEMBERS.map((_, i) => {
                    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
                    const r = i % 2 === 0 ? r1 : r2
                    const x = cx + r * Math.cos(angle)
                    const y = cy + r * Math.sin(angle)
                    return (
                        <line key={i} x1={cx} y1={cy} x2={x} y2={y}
                              stroke="#00C896" strokeWidth={1.5}
                              opacity={i === active ? 0.4 : 0}
                              style={{ transition: 'opacity 0.4s ease' }} />
                    )
                })}

                {/* Member avatars */}
                {MEMBERS.map((m, i) => {
                    const angle = (i / n) * Math.PI * 2 - Math.PI / 2
                    const r = i % 2 === 0 ? r1 : r2
                    const x = cx + r * Math.cos(angle)
                    const y = cy + r * Math.sin(angle)
                    const isActive = i === active
                    const size = isActive ? 26 : 20

                    return (
                        <g key={i} style={{ transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                            {isActive && (
                                <circle cx={x} cy={y} r={size + 6} fill="none"
                                        stroke="#00C896" strokeWidth={1.5} opacity={0.35} />
                            )}
                            <circle cx={x} cy={y} r={size} fill={m.color} />
                            <image
                                href={m.img}
                                x={x - size} y={y - size}
                                width={size * 2} height={size * 2}
                                clipPath={`url(#av-${i})`}
                                preserveAspectRatio="xMidYMid slice"
                            />
                        </g>
                    )
                })}

                {/* Centre payout card */}
                <circle cx={cx} cy={cy} r={52} fill="#0A1628" stroke="#00C896" strokeWidth={1} strokeOpacity={0.25} />
                <text x={cx} y={cy - 12} textAnchor="middle" fontSize={10}
                      fill="rgba(255,255,255,0.45)" fontFamily="DM Sans,sans-serif">Round 5 of 8</text>
                <text x={cx} y={cy + 6} textAnchor="middle" fontSize={14}
                      fontWeight={700} fill="#00C896" fontFamily="DM Sans,sans-serif">₦200,000</text>
                <text x={cx} y={cy + 20} textAnchor="middle" fontSize={9}
                      fill="rgba(255,255,255,0.35)" fontFamily="DM Sans,sans-serif">payout pool</text>
            </svg>

            {/* Active name tag — positioned below svg, not overlapping */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#00C896] text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-lg"
                 style={{ transition: 'opacity 0.3s' }}>
                {MEMBERS[active].name} receiving ↗
            </div>
        </div>
    )
}

/* ── Phone mockup (original design) ───────────────── */
function PhoneMockup() {
    return (
        <div className="w-[220px] mx-auto">
            <div className="bg-gray-900 rounded-[24px] border border-white/10 overflow-hidden shadow-2xl">
                <div className="bg-gray-900 px-5 pt-3 pb-1 flex justify-between items-center">
                    <span className="text-white/80 text-[11px] font-semibold">9:41</span>
                    <span className="text-white/50 text-[10px]">●●●</span>
                </div>
                <div className="bg-[#F7F8FA] mx-1.5 mb-1.5 rounded-xl overflow-hidden">
                    <div className="p-3">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold text-[#0A1628]">Good morning, Adaeze</span>
                            <span className="bg-[#E0FAF4] text-[#065F46] text-[8px] font-bold px-2 py-0.5 rounded-full">96% on time</span>
                        </div>
                        <div className="bg-white rounded-xl border border-[#E8EAF0] p-3 mb-2 shadow-sm">
                            <div className="text-[10px] font-bold text-[#0A1628] mb-0.5">Ikeja Market Women</div>
                            <div className="text-[9px] text-[#8A91A0] mb-2">Admin: Mama Chisom · 8 members</div>
                            <div className="text-[16px] font-bold text-[#0A1628] tracking-tight">
                                ₦25,000<span className="text-[9px] font-normal text-[#8A91A0]"> / month</span>
                            </div>
                            <div className="flex justify-between text-[8px] mt-1.5 mb-1">
                                <span className="text-[#8A91A0]">Round 5 of 8</span>
                                <span className="text-[#00A07A] font-bold">62%</span>
                            </div>
                            <div className="h-1 bg-[#F0F0F0] rounded-full">
                                <div className="h-1 bg-[#00C896] rounded-full" style={{ width: '62%' }} />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex">
                                    {['AO', 'MC', 'FN'].map((init, i) => (
                                        <div key={i}
                                             className={`w-4 h-4 rounded-full border-[1.5px] border-white flex items-center justify-center text-white text-[6px] font-bold ${['bg-[#0A1628]', 'bg-[#00A07A]', 'bg-gray-400'][i]} ${i > 0 ? '-ml-1' : ''}`}>
                                            {init}
                                        </div>
                                    ))}
                                    <div className="-ml-1 w-4 h-4 rounded-full border-[1.5px] border-white bg-gray-300 flex items-center justify-center text-[5px] font-bold text-gray-600">+5</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[7px] text-[#8A91A0]">Next payment</div>
                                    <div className="text-[8px] font-bold text-[#0A1628]">Jun 7, 2026</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-[#E8EAF0] p-2.5 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#E0FAF4] flex items-center justify-center flex-shrink-0">
                                <span className="text-[#00A07A] text-[9px]">🔒</span>
                            </div>
                            <div>
                                <div className="text-[10px] font-semibold text-[#0A1628]">24 payments recorded</div>
                                <div className="text-[8px] text-[#8A91A0]">Permanently on Base blockchain</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Main ──────────────────────────────────────────── */
export default function LandingPage() {
    const { dark, toggle } = useTheme()

    const pageBg  = dark ? 'bg-[#080F1E]' : 'bg-white'
    const sec2Bg  = dark ? 'bg-[#0A1628]' : 'bg-[#F7F8FA]'
    const textPri = dark ? 'text-white'   : 'text-[#0A1628]'
    const textMut = dark ? 'text-white/50': 'text-[#8A91A0]'
    const bdr     = dark ? 'border-white/8' : 'border-[#E8EAF0]'
    const cardBg  = dark ? 'bg-[#0D1F38] border-white/8' : 'bg-white border-[#E8EAF0]'

    return (
        <div className={`min-h-screen font-sans ${pageBg}`}>
            <PublicNav dark transparent onToggleDark={toggle} />

            {/* ══ HERO — dark navy, original split layout ══════ */}
            <section className="bg-[#0A1628] pt-16 pb-0 px-5 overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-10 md:gap-12 py-16 md:py-20">

                        {/* Left — text */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-[#00C896]/15 text-[#00C896] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                                <Shield size={11} /> Trust infrastructure for ajo &amp; esusu
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white leading-[1.08] tracking-tight mb-5">
                                Rotate money.<br />
                                <span className="text-[#00C896]">Build trust.</span><br />
                                Never lose either.
                            </h1>

                            <p className="text-white/60 text-base leading-relaxed mb-8 max-w-md mx-auto md:mx-0">
                                CircuFi digitalises your ajo savings circle with transparent contribution records,
                                permanent payment history, and zero central custody of your funds.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                                <Link href="/auth/signup"
                                      className="inline-flex items-center justify-center gap-2 bg-[#00C896] text-white font-semibold rounded-full px-7 py-3.5 text-sm hover:bg-[#00A07A] transition-colors">
                                    Create a circle <ArrowRight size={14} />
                                </Link>
                                <Link href="/auth/signup?join=true"
                                      className="inline-flex items-center justify-center bg-white/10 text-white font-semibold rounded-full px-7 py-3.5 text-sm border border-white/20 hover:bg-white/20 transition-colors">
                                    Join with a code
                                </Link>
                            </div>

                            {/* Social proof */}
                            <div className="flex items-center gap-4 mt-8 justify-center md:justify-start">
                                <div className="flex">
                                    {MEMBERS.slice(0, 4).map((m, i) => (
                                        <img key={i} src={m.img} alt={m.name}
                                             className="w-7 h-7 rounded-full object-cover border-2 border-[#0A1628]"
                                             style={{ marginLeft: i > 0 ? -8 : 0 }} />
                                    ))}
                                </div>
                                <p className="text-white/50 text-xs">
                                    <strong className="text-white">500+</strong> members trust CircuFi with their ajo
                                </p>
                            </div>
                        </div>

                        {/* Right — orbit illustration (replaces phone on md+) */}
                        <div className="flex-shrink-0 hidden md:flex items-center justify-center pb-0">
                            <OrbitIllustration />
                        </div>

                        {/* Right — phone mockup on mobile */}
                        <div className="md:hidden pb-4">
                            <PhoneMockup />
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ VALUE STRIP ══════════════════════════════════ */}
            <div className={`border-b ${bdr} ${dark ? 'bg-[#0A1628]' : 'bg-[#F7F8FA]'} py-4 px-5`}>
                <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-2">
                    {[
                        { icon: <Users size={12} />,     text: 'Built for Nigeria & every ajo circle' },
                        { icon: <Lock size={12} />,       text: 'No central custody of funds'          },
                        { icon: <Shield size={12} />,     text: 'Permanent on-chain records'            },
                        { icon: <TrendingUp size={12} />, text: 'History that travels with you'         },
                    ].map((item, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs font-medium ${textMut}`}>
                            <span className="text-[#00C896]">{item.icon}</span>
                            {item.text}
                        </div>
                    ))}
                </div>
            </div>

            {/* ══ PROBLEM ══════════════════════════════════════ */}
            <section className="bg-[#0A1628] py-16 px-5">
                <div className="max-w-4xl mx-auto">
                    <p className="text-[#00C896] text-xs font-bold uppercase tracking-widest mb-3">The problem</p>
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-3 max-w-lg">
                        Ajo fails because trust breaks down
                    </h2>
                    <p className="text-white/50 text-sm mb-10 max-w-md leading-relaxed">
                        You've seen it happen. The organiser disappears. A member collects and ghosts. No record, no recourse.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { title: 'Organiser ran with ₦180K',   body: 'No paper trail. No history. Nothing to stop it happening again in the next group.' },
                            { title: 'Member ghosted after payout', body: 'Collected round 3, disappeared. The WhatsApp group is archived. The money is gone.' },
                            { title: 'No records anywhere',         body: 'Secretary changes. Chats get deleted. Groups disband. Your history vanishes with them.' },
                        ].map((c, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <p className="text-red-400 text-xs font-bold line-through mb-2">{c.title}</p>
                                <p className="text-white/50 text-xs leading-relaxed">{c.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ HOW IT WORKS ════════════════════════════════ */}
            <section id="how" className={`py-16 px-5 ${dark ? 'bg-[#080F1E]' : 'bg-white'}`}>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-[#00A07A] text-xs font-bold uppercase tracking-widest mb-3">How it works</p>
                        <h2 className={`text-3xl font-bold tracking-tight mb-3 ${textPri}`}>
                            Four steps to a trusted circle
                        </h2>
                        <p className={`text-sm max-w-md mx-auto leading-relaxed ${textMut}`}>
                            Every contribution is logged, verified, and permanently recorded. No WhatsApp chasing.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {[
                            { n: '1', title: 'Create your circle',  body: 'Set contribution amount, frequency, and invite members with a 6-character code.'  },
                            { n: '2', title: 'Members join',        body: 'Each member builds a payment record. Admins see history before approving.'          },
                            { n: '3', title: 'Log contributions',   body: 'Every payment is timestamped. Admin verifies. On-time status is permanent.'         },
                            { n: '4', title: 'History builds',      body: 'Your record follows you across every future circle — forever.'                      },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="w-10 h-10 rounded-full bg-[#00C896] flex items-center justify-center text-white font-bold text-sm mx-auto mb-4">
                                    {s.n}
                                </div>
                                <p className={`text-sm font-semibold mb-2 ${textPri}`}>{s.title}</p>
                                <p className={`text-xs leading-relaxed ${textMut}`}>{s.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ TRUST SECTION ═══════════════════════════════ */}
            <section className={`py-16 px-5 ${dark ? 'bg-[#0A1628]' : 'bg-[#F7F8FA]'}`}>
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <p className="text-[#00A07A] text-xs font-bold uppercase tracking-widest mb-3">Payment history</p>
                        <h2 className={`text-3xl font-bold tracking-tight mb-4 leading-tight ${textPri}`}>
                            Your record travels with you
                        </h2>
                        <p className={`text-sm leading-relaxed mb-6 ${textMut}`}>
                            WhatsApp groups end. Secretaries change. Your CircuFi payment record doesn't.
                            Every on-time contribution is permanently stored — and circle admins can see
                            your full history before you join.
                        </p>
                        <div className="flex flex-col gap-3">
                            {[
                                'On-time payments recorded automatically',
                                'Late or missed payments logged and flagged',
                                'Circle admins see your history before you join',
                                'Record survives even after a circle ends',
                                'Stored permanently — no one can edit it',
                            ].map((t, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-4 h-4 rounded-full bg-[#E0FAF4] flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check size={9} className="text-[#00A07A]" />
                                    </div>
                                    <span className={`text-sm ${textPri}`}>{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Record card */}
                    <div className={`rounded-2xl border p-5 shadow-sm ${cardBg}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <img src={MEMBERS[1].img} alt="Adaeze"
                                 className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[#E0FAF4]" />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${textPri}`}>Adaeze Okonkwo</p>
                                <p className={`text-xs ${textMut}`}>Member since Mar 2025 · 3 circles</p>
                            </div>
                            <span className="text-[11px] font-semibold text-[#00A07A] bg-[#E0FAF4] px-2.5 py-0.5 rounded-full flex-shrink-0">
                Reliable ✓
              </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[{ val: '24', label: 'Payments' }, { val: '96%', label: 'On time' }, { val: '2', label: 'Completed' }].map((s, i) => (
                                <div key={i} className={`rounded-xl p-3 text-center ${dark ? 'bg-white/5' : 'bg-[#F7F8FA]'}`}>
                                    <p className={`text-lg font-bold tracking-tight ${textPri}`}>{s.val}</p>
                                    <p className={`text-[10px] mt-0.5 ${textMut}`}>{s.label}</p>
                                </div>
                            ))}
                        </div>
                        {[
                            { dot: '#00C896', text: 'On-time payment — Ikeja Market Women', sub: 'Round 5 · Jun 2, 2026', delta: '+2', pos: true  },
                            { dot: '#22C55E', text: 'Circle completed — Abuja Traders',     sub: 'All 10 rounds · May 15', delta: '+5', pos: true  },
                            { dot: '#F59E0B', text: 'Late payment — CampusSave Unilag',     sub: '2 days late · Apr 3',   delta: '−3', pos: false },
                        ].map((e, i) => (
                            <div key={i} className={`flex items-center gap-3 py-2.5 border-t ${bdr}`}>
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.dot }} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium truncate ${textPri}`}>{e.text}</p>
                                    <p className={`text-[10px] ${textMut}`}>{e.sub}</p>
                                </div>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                    e.pos ? 'bg-[#E0FAF4] text-[#00A07A]' : 'bg-red-50 text-red-500'
                                }`}>{e.delta}</span>
                            </div>
                        ))}
                        <div className={`mt-3 pt-3 border-t ${bdr} flex items-center gap-2`}>
                            <Lock size={10} className={textMut} />
                            <p className={`text-[10px] ${textMut}`}>
                                This record cannot be edited by anyone, including CircuFi.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ FEATURES BENTO ══════════════════════════════ */}
            <section className="bg-[#0A1628] py-16 px-5">
                <div className="max-w-4xl mx-auto">
                    <p className="text-[#00C896] text-xs font-bold uppercase tracking-widest mb-3">Features</p>
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-3">Everything your circle needs</h2>
                    <p className="text-white/50 text-sm mb-10 max-w-md leading-relaxed">
                        No WhatsApp coordination. No paper ledgers. No trust issues.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="text-[#00C896] mb-3"><RotateCcw size={20} /></div>
                            <h3 className="text-sm font-semibold text-white mb-2">Rotation tracker</h3>
                            <p className="text-xs text-white/50 leading-relaxed mb-4">
                                See exactly who has paid, who is next to receive, and who is overdue — in real time.
                            </p>
                            <div className="flex flex-col gap-2">
                                {[
                                    { n: '1', name: 'Funke Coker',    status: 'Received ✓', active: false, done: true  },
                                    { n: '2', name: 'Mama Chisom',    status: 'Receiving',  active: true,  done: false },
                                    { n: '3', name: 'Adaeze Okonkwo', status: 'Round 3',    active: false, done: false },
                                ].map((row, i) => (
                                    <div key={i}
                                         className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${row.active ? 'bg-[#00C896]/15' : 'bg-white/5'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                                            row.done ? 'bg-[#00C896]/20 text-[#00C896]' : row.active ? 'bg-[#00C896] text-white' : 'bg-white/10 text-white/40'
                                        }`}>{row.n}</div>
                                        <span className={`text-xs font-medium flex-1 ${row.active ? 'text-[#00C896]' : 'text-white/70'}`}>{row.name}</span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                            row.done ? 'bg-[#00C896]/20 text-[#00C896]' : row.active ? 'bg-[#00C896] text-white' : 'bg-white/10 text-white/30'
                                        }`}>{row.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {[
                            { icon: <Shield size={20} />,     title: 'Payment screening',  body: 'Admins see full payment history before approving a new member. No surprises.' },
                            { icon: <Lock size={20} />,        title: 'On-chain audit trail', body: 'Every payment, every verification — stored permanently on Base. Nobody can edit it.' },
                            { icon: <Users size={20} />,       title: 'Admin controls',     body: 'Verify payments, dispute contributions, manage members, and advance rotation.' },
                        ].map((f, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                                <div className="text-[#00C896] mb-3">{f.icon}</div>
                                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                                <p className="text-xs text-white/50 leading-relaxed">{f.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ TESTIMONIALS ════════════════════════════════ */}
            <section className={`py-16 px-5 ${dark ? 'bg-[#080F1E]' : 'bg-white'}`}>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="text-[#00A07A] text-xs font-bold uppercase tracking-widest mb-3">Testimonials</p>
                        <h2 className={`text-3xl font-bold tracking-tight ${textPri}`}>Real people. Real circles.</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { q: 'Before CircuFi, I chased everyone on WhatsApp every month. Now the records are there — nobody can say they didn\'t pay.', name: 'Mama Chisom', role: 'Circle admin, Ikeja', img: MEMBERS[0].img, stat: '24 payments' },
                            { q: 'My payment history got me into a bigger circle. I never had anything like this to show for my savings before.',           name: 'Adaeze Okonkwo', role: 'Member, 3 circles', img: MEMBERS[1].img, stat: '96% on time' },
                            { q: 'We had someone disappear after collecting in our last group. Now I check payment history before anyone joins.',           name: 'Tunde Balogun', role: 'Admin, CampusSave', img: MEMBERS[2].img, stat: '88% health'  },
                        ].map((t, i) => (
                            <div key={i} className={`rounded-xl p-5 border ${dark ? 'bg-white/3 border-white/8' : 'bg-[#F7F8FA] border-[#E8EAF0]'}`}>
                                <p className={`text-sm leading-relaxed italic mb-4 ${textPri}`}>"{t.q}"</p>
                                <div className="flex items-center gap-3">
                                    <img src={t.img} alt={t.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold truncate ${textPri}`}>{t.name}</p>
                                        <p className={`text-[10px] ${textMut}`}>{t.role}</p>
                                    </div>
                                    <span className="text-[10px] font-semibold text-[#00A07A] bg-[#E0FAF4] px-2 py-0.5 rounded-full flex-shrink-0">
                    {t.stat}
                  </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ CTA ════════════════════════════════════════ */}
            <section className="bg-[#00C896] py-16 px-5 text-center">
                <div className="max-w-lg mx-auto">
                    <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
                        Your circle deserves better than WhatsApp
                    </h2>
                    <p className="text-white/80 text-sm mb-8 leading-relaxed">
                        Start building your payment record today. Create your first circle in under 2 minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/auth/signup"
                              className="inline-flex items-center justify-center gap-2 bg-white text-[#0A1628] font-bold rounded-full px-8 py-3.5 text-sm hover:bg-gray-50 transition-colors">
                            Create a circle — it's free <ArrowRight size={14} />
                        </Link>
                        <Link href="/auth/signup?join=true"
                              className="inline-flex items-center justify-center bg-white/20 text-white font-semibold rounded-full px-8 py-3.5 text-sm border border-white/30 hover:bg-white/30 transition-colors">
                            Join with a code
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══ FOOTER ══════════════════════════════════════ */}
            <footer className="bg-[#0A1628] py-12 px-5">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2 h-2 bg-[#00C896] rounded-full" />
                                <span className="text-white font-bold text-base">CircuFi</span>
                            </div>
                            <p className="text-white/35 text-xs leading-relaxed max-w-[180px]">
                                Rotate money. Build trust. Never lose either.
                            </p>
                        </div>
                        {[
                            { title: 'Product', links: [{ l: 'How it works', h: '#how' }, { l: 'Features', h: '#' }, { l: 'For admins', h: '#' }] },
                            { title: 'Company', links: [{ l: 'About us', h: '/about' }, { l: 'Blog', h: '#' }, { l: 'Contact', h: '/contact' }] },
                            { title: 'Legal',   links: [{ l: 'Privacy policy', h: '#' }, { l: 'Terms of use', h: '#' }] },
                        ].map((col, i) => (
                            <div key={i}>
                                <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-3">{col.title}</p>
                                {col.links.map(({ l, h }) => (
                                    <Link key={l} href={h} className="block text-white/45 text-xs mb-2 hover:text-white transition-colors">{l}</Link>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <span className="text-white/25 text-xs">© 2026 CircuFi. Built for Africa.</span>
                        <div className="flex gap-3">
                            {['𝕏', 'in', 'ig'].map(s => (
                                <div key={s} className="w-7 h-7 rounded-full border border-white/12 flex items-center justify-center text-white/35 text-xs cursor-pointer hover:border-white/30 hover:text-white/60 transition-colors">{s}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}