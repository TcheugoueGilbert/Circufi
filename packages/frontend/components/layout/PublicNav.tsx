'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Sun, Moon } from 'lucide-react'

interface PublicNavProps {
    dark?: boolean
    onToggleDark?: () => void
    /** If true, starts transparent and gains background on scroll */
    transparent?: boolean
}

export function PublicNav({ dark = false, onToggleDark, transparent = false }: PublicNavProps) {
    const [open, setOpen]       = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        if (!transparent) return
        const fn = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', fn, { passive: true })
        return () => window.removeEventListener('scroll', fn)
    }, [transparent])

    const hasBg = !transparent || scrolled

    // On dark pages or transparent-not-yet-scrolled, use light text
    const lightText = dark || (transparent && !scrolled)

    const navBg = hasBg
        ? dark
            ? 'bg-[#0A1628]/95 backdrop-blur-md border-b border-white/8'
            : 'bg-white/95 backdrop-blur-md border-b border-[#E8EAF0]'
        : 'bg-transparent'

    const logoColor    = lightText ? 'text-white'          : 'text-[#0A1628]'
    const linkColor    = lightText ? 'text-white/60 hover:text-white' : 'text-[#8A91A0] hover:text-[#0A1628]'
    const toggleBorder = lightText ? 'border-white/15 text-white/50 hover:text-white hover:border-white/30' : 'border-[#E8EAF0] text-[#8A91A0] hover:text-[#0A1628]'
    const hamColor     = lightText ? 'text-white/70'       : 'text-[#0A1628]'

    const NAV_LINKS = [
        { label: 'How it works', href: '/landing#how' },
        { label: 'About',        href: '/about'        },
        { label: 'Contact',      href: '/contact'      },
    ]

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
            <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

                {/* Logo — single instance */}
                <Link href="/landing" className="flex items-center gap-2 flex-shrink-0">
                    <span className="w-2 h-2 bg-[#00C896] rounded-full" />
                    <span className={`font-bold text-lg tracking-tight transition-colors ${logoColor}`}>CircuFi</span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-7">
                    {NAV_LINKS.map(item => (
                        <Link key={item.label} href={item.href}
                              className={`text-sm font-medium transition-colors ${linkColor}`}>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                    {onToggleDark && (
                        <button onClick={onToggleDark}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${toggleBorder}`}
                                aria-label="Toggle dark mode">
                            {dark ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                    )}
                    <Link href="/auth/login"
                          className={`hidden md:block text-sm font-medium transition-colors ${linkColor}`}>
                        Sign in
                    </Link>
                    <Link href="/auth/signup"
                          className="bg-[#00C896] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#00A07A] transition-colors whitespace-nowrap">
                        Get started
                    </Link>
                    <button onClick={() => setOpen(!open)}
                            className={`md:hidden transition-colors ${hamColor}`} aria-label="Menu">
                        {open ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className={`md:hidden border-t px-5 pb-5 ${dark ? 'bg-[#0A1628] border-white/8' : 'bg-white border-[#E8EAF0]'}`}>
                    <div className="flex flex-col pt-3 gap-0.5">
                        {NAV_LINKS.map(item => (
                            <Link key={item.label} href={item.href} onClick={() => setOpen(false)}
                                  className={`py-3 text-sm font-medium border-b transition-colors ${
                                      dark ? 'text-white/60 border-white/6 hover:text-white' : 'text-[#8A91A0] border-[#F0F0F0] hover:text-[#0A1628]'
                                  }`}>
                                {item.label}
                            </Link>
                        ))}
                        <Link href="/auth/login" onClick={() => setOpen(false)}
                              className={`py-3 text-sm font-medium border-b transition-colors ${
                                  dark ? 'text-white/60 border-white/6 hover:text-white' : 'text-[#8A91A0] border-[#F0F0F0] hover:text-[#0A1628]'
                              }`}>
                            Sign in
                        </Link>
                        <Link href="/auth/signup"
                              className="mt-4 bg-[#00C896] text-white text-sm font-semibold px-5 py-3 rounded-full text-center hover:bg-[#00A07A] transition-colors">
                            Get started — it's free
                        </Link>
                        {onToggleDark && (
                            <button onClick={onToggleDark}
                                    className={`mt-3 flex items-center gap-2 text-sm ${dark ? 'text-white/50' : 'text-[#8A91A0]'}`}>
                                {dark ? <Sun size={14} /> : <Moon size={14} />}
                                {dark ? 'Switch to light' : 'Switch to dark'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}