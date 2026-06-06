'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { LayoutDashboard, Users, Shield, Bell, Settings, LogOut, Plus, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

const NAV_ITEMS = [
    { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/circles',       label: 'My Circles',   icon: Users           },
    { href: '/reputation',    label: 'Reputation',   icon: Shield          },
    { href: '/notifications', label: 'Notifications',icon: Bell            },
    { href: '/settings',      label: 'Settings',     icon: Settings        },
]

const BOTTOM_NAV = [
    { href: '/dashboard',  label: 'Home',       icon: LayoutDashboard },
    { href: '/circles',    label: 'Circles',    icon: Users           },
    { href: '/reputation', label: 'Reputation', icon: Shield          },
    { href: '/settings',   label: 'Settings',   icon: Settings        },
]

/* ── Mobile top bar ──────────────────────────────────── */
function TopBar({ dark, toggle }: { dark: boolean; toggle: () => void }) {
    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4 bg-[#0A1628]">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00C896] rounded-full" />
                <span className="text-white font-bold text-base tracking-tight">CircuFi</span>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={toggle}
                    className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                    aria-label="Toggle theme"
                >
                    {dark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <Link
                    href="/notifications"
                    className="relative w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#00C896] rounded-full" />
                </Link>
            </div>
        </header>
    )
}

/* ── Desktop sidebar ─────────────────────────────────── */
function Sidebar({ dark, toggle }: { dark: boolean; toggle: () => void }) {
    const pathname = usePathname()

    return (
        <aside className={clsx(
            'hidden md:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col z-30 border-r',
            dark ? 'bg-[#0A1628] border-white/8' : 'bg-white border-[#E8EAF0]'
        )}>
            {/* Logo row */}
            <div className={clsx('h-16 flex items-center px-5 border-b', dark ? 'border-white/8' : 'border-[#E8EAF0]')}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-2.5 h-2.5 bg-[#00C896] rounded-full flex-shrink-0" />
                    <span className={clsx('font-bold text-lg tracking-tight truncate', dark ? 'text-white' : 'text-[#0A1628]')}>
            CircuFi
          </span>
                </div>
                <button
                    onClick={toggle}
                    className={clsx(
                        'w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors',
                        dark
                            ? 'border-white/15 text-white/40 hover:text-white hover:border-white/30'
                            : 'border-[#E8EAF0] text-[#8A91A0] hover:text-[#0A1628] hover:border-[#0A1628]/20'
                    )}
                    aria-label="Toggle theme"
                >
                    {dark ? <Sun size={13} /> : <Moon size={13} />}
                </button>
            </div>

            {/* Create CTA */}
            <div className="px-4 py-3">
                <Link
                    href="/circles/create"
                    className="flex items-center justify-center gap-2 w-full bg-[#00C896] text-white text-sm font-semibold rounded-full py-2.5 hover:bg-[#00A07A] transition-colors"
                >
                    <Plus size={14} /> Create circle
                </Link>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-2 overflow-y-auto">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={clsx(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors',
                                active
                                    ? dark
                                        ? 'bg-[#00C896]/15 text-[#00C896] border-l-2 border-[#00C896]'
                                        : 'bg-[#E0FAF4] text-[#065F46] border-l-2 border-[#00C896]'
                                    : dark
                                        ? 'text-white/50 hover:bg-white/5 hover:text-white'
                                        : 'text-[#8A91A0] hover:bg-[#F7F8FA] hover:text-[#0A1628]'
                            )}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            {/* User row */}
            <div className={clsx('border-t px-4 py-4', dark ? 'border-white/8' : 'border-[#E8EAF0]')}>
                <div className="flex items-center gap-3">
                    <img
                        src="https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=40&h=40&fit=crop&crop=face"
                        alt="Adaeze"
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <p className={clsx('text-xs font-semibold truncate', dark ? 'text-white' : 'text-[#0A1628]')}>
                            Adaeze Okonkwo
                        </p>
                        <p className="text-[10px] text-[#8A91A0]">24 payments · 96% on time</p>
                    </div>
                    <button className="text-[#8A91A0] hover:text-red-400 transition-colors flex-shrink-0">
                        <LogOut size={14} />
                    </button>
                </div>
            </div>
        </aside>
    )
}

/* ── Mobile bottom nav ───────────────────────────────── */
function BottomNav() {
    const pathname = usePathname()
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E8EAF0]">
            <div className="flex">
                {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={clsx(
                                'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors',
                                active ? 'text-[#00C896]' : 'text-[#8A91A0]'
                            )}
                        >
                            <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                            {label}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

/* ── Shell ───────────────────────────────────────────── */
export function AppShell({ children }: { children: React.ReactNode }) {
    const { dark, toggle } = useTheme()

    return (
        <div className={clsx('min-h-screen', dark ? 'bg-[#080F1E]' : 'bg-[#F7F8FA]')}>
            <TopBar dark={dark} toggle={toggle} />
            <Sidebar dark={dark} toggle={toggle} />
            <BottomNav />
            <main className="md:ml-[220px] pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-6">
                    {children}
                </div>
            </main>
        </div>
    )
}