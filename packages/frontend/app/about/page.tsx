'use client'
import Link from 'next/link'
import { ArrowRight, Shield, Users, Lock, TrendingUp } from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'
import { useTheme } from '@/lib/theme'

export default function AboutPage() {
    const { dark, toggle } = useTheme()

    const bg    = dark ? 'bg-[#080F1E]' : 'bg-white'
    const bg2   = dark ? 'bg-[#0A1628]' : 'bg-[#F7F8FA]'
    const text  = dark ? 'text-white'   : 'text-[#0A1628]'
    const muted = dark ? 'text-white/50': 'text-[#8A91A0]'
    const card  = dark ? 'bg-[#0D1F38] border-white/8' : 'bg-white border-[#E8EAF0]'

    return (
        <div className={`min-h-screen font-sans ${bg}`}>
            {/* Single nav — no logo duplication */}
            <PublicNav dark onToggleDark={toggle} />

            {/* Hero — always navy */}
            <section className="bg-[#0A1628] pt-28 pb-16 px-5 text-center">
                <div className="max-w-2xl mx-auto">
                    <p className="text-[#00C896] text-xs font-bold uppercase tracking-widest mb-3">About CircuFi</p>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
                        Built for the way <span className="text-[#00C896]">Africa saves</span>
                    </h1>
                    <p className="text-white/60 text-base leading-relaxed">
                        Ajo, esusu, chama — rotating savings groups have powered communities across Africa for generations.
                        CircuFi adds the trust layer they've always needed.
                    </p>
                </div>
            </section>

            {/* Story */}
            <section className={`py-16 px-5 ${bg}`}>
                <div className="max-w-2xl mx-auto">
                    <p className="text-[#00A07A] text-xs font-bold uppercase tracking-widest mb-4">Our story</p>
                    <h2 className={`text-2xl font-bold tracking-tight mb-5 ${text}`}>
                        The problem is trust, not savings
                    </h2>
                    <div className={`flex flex-col gap-4 text-sm leading-relaxed ${muted}`}>
                        <p>
                            In 2023, a Lagos market woman lost ₦180,000 when her ajo organiser disappeared after
                            collecting the pot. She had no paper trail, no history of the person she trusted,
                            and no recourse. It was the third time someone in her network had been burned.
                        </p>
                        <p>
                            The problem wasn't ajo itself — it was the absence of trust infrastructure.
                            WhatsApp groups coordinate the payments, but they leave no permanent record.
                            When the group ends or the organiser disappears, everything goes with them.
                        </p>
                        <p>
                            CircuFi was built to solve exactly this. Not by reinventing ajo, but by adding
                            the one thing it was missing: a permanent, tamper-proof record of who paid,
                            who received, and who can be trusted in the next circle.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className={`py-16 px-5 ${bg2}`}>
                <div className="max-w-4xl mx-auto">
                    <p className="text-[#00A07A] text-xs font-bold uppercase tracking-widest mb-3 text-center">Our values</p>
                    <h2 className={`text-2xl font-bold tracking-tight mb-10 text-center ${text}`}>
                        What we stand for
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[
                            {
                                icon: <Shield size={20} />,
                                title: 'Trust is earned, not assumed',
                                body: 'We never hide or manipulate payment records. Every contribution, every flag, every late payment — all of it is permanent and visible.',
                            },
                            {
                                icon: <Users size={20} />,
                                title: 'Community first',
                                body: 'CircuFi exists to strengthen savings communities, not replace them. The relationships stay human. We just add the infrastructure.',
                            },
                            {
                                icon: <Lock size={20} />,
                                title: 'No custody of funds',
                                body: 'We never hold your money. CircuFi is a coordination and record-keeping platform. Money moves peer-to-peer, always.',
                            },
                            {
                                icon: <TrendingUp size={20} />,
                                title: 'Built for real users',
                                body: 'Not crypto-native users. Not fintech insiders. Real Nigerians who save in naira, use their phones, and deserve better tools.',
                            },
                        ].map((v, i) => (
                            <div key={i} className={`rounded-xl border p-5 ${card}`}>
                                <div className="text-[#00C896] mb-3">{v.icon}</div>
                                <h3 className={`text-sm font-semibold mb-2 ${text}`}>{v.title}</h3>
                                <p className={`text-xs leading-relaxed ${muted}`}>{v.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className={`py-16 px-5 ${bg}`}>
                <div className="max-w-4xl mx-auto">
                    <p className="text-[#00A07A] text-xs font-bold uppercase tracking-widest mb-3 text-center">The team</p>
                    <h2 className={`text-2xl font-bold tracking-tight mb-10 text-center ${text}`}>
                        Built by people who understand ajo
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            {
                                img:  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=face',
                                name: 'Michael Okonkwo',
                                role: 'Product & Engineering',
                                bio:  'Full-stack developer and Web3 builder. Has been in three ajo circles that ended badly.',
                            },
                            {
                                img:  'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=160&h=160&fit=crop&crop=face',
                                name: 'Adaeze Chukwu',
                                role: 'Design & UX',
                                bio:  'UI designer obsessed with building for real users — not hypothetical ones.',
                            },
                            {
                                img:  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face',
                                name: 'Tunde Ibrahim',
                                role: 'Blockchain & Backend',
                                bio:  'Smart contract developer on Base. Believes trustless infrastructure should feel invisible.',
                            },
                        ].map((m, i) => (
                            <div key={i} className="text-center">
                                <img src={m.img} alt={m.name}
                                     className="w-16 h-16 rounded-full object-cover mx-auto mb-3 ring-2 ring-[#E0FAF4]" />
                                <p className={`text-sm font-semibold ${text}`}>{m.name}</p>
                                <p className="text-xs text-[#00A07A] font-medium mb-2">{m.role}</p>
                                <p className={`text-xs leading-relaxed ${muted}`}>{m.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#00C896] py-14 px-5 text-center">
                <h2 className="text-2xl font-bold text-white tracking-tight mb-3">
                    Ready to build a trusted circle?
                </h2>
                <p className="text-white/80 text-sm mb-6">Join hundreds of members already using CircuFi.</p>
                <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 bg-white text-[#0A1628] font-bold rounded-full px-8 py-3.5 text-sm hover:bg-gray-50 transition-colors"
                >
                    Get started — it's free <ArrowRight size={14} />
                </Link>
            </section>

            {/* Footer */}
            <footer className="bg-[#0A1628] py-8 px-5">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#00C896] rounded-full" />
                        <span className="text-white font-bold text-sm">CircuFi</span>
                        <span className="text-white/30 text-xs ml-2">© 2026 · Built for Africa.</span>
                    </div>
                    <div className="flex gap-4">
                        {[['Home', '/landing'], ['Contact', '/contact'], ['Privacy', '#'], ['Terms', '#']].map(([l, h]) => (
                            <Link key={l} href={h} className="text-white/50 text-xs hover:text-white transition-colors">{l}</Link>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    )
}