'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check, Mail, MessageSquare, Phone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PublicNav } from '@/components/layout/PublicNav'
import { useTheme } from '@/lib/theme'

export default function ContactPage() {
    const { dark, toggle } = useTheme()
    const [name,    setName]    = useState('')
    const [email,   setEmail]   = useState('')
    const [message, setMessage] = useState('')
    const [sent,    setSent]    = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!name || !email || !message) return
        // There is no contact API: open the visitor's email client with the message pre-filled
        setLoading(true)
        const body = `${message}\n\n— ${name} (${email})`
        window.location.href = `mailto:hello@circufi.co?subject=${encodeURIComponent('CircuFi enquiry from ' + name)}&body=${encodeURIComponent(body)}`
        setLoading(false)
        setSent(true)
    }

    const bg    = dark ? 'bg-[#080F1E]' : 'bg-[#F7F8FA]'
    const text  = dark ? 'text-white'   : 'text-[#0A1628]'
    const muted = dark ? 'text-white/50': 'text-[#8A91A0]'
    const card  = dark ? 'bg-[#0D1F38] border-white/8' : 'bg-white border-[#E8EAF0]'

    return (
        <div className={`min-h-screen font-sans ${bg}`}>
            {/* Single nav */}
            <PublicNav dark={dark} onToggleDark={toggle} />

            <div className="max-w-4xl mx-auto px-5 pt-28 pb-16">
                <div className="grid md:grid-cols-2 gap-12 items-start">

                    {/* Left info */}
                    <div>
                        <p className="text-[#00A07A] text-xs font-bold uppercase tracking-widest mb-3">Get in touch</p>
                        <h1 className={`text-3xl font-bold tracking-tight mb-4 ${text}`}>
                            We'd love to hear from you
                        </h1>
                        <p className={`text-sm leading-relaxed mb-8 ${muted}`}>
                            Questions about CircuFi? Want to partner with us? Building something similar?
                            Reach out — we respond within 24 hours.
                        </p>
                        <div className="flex flex-col gap-4">
                            {[
                                { icon: <Mail size={16} />,          label: 'Email us',  value: 'hello@circufi.co' },
                                { icon: <MessageSquare size={16} />,  label: 'Twitter/X', value: '@circufi'         },
                                { icon: <Phone size={16} />,           label: 'WhatsApp',  value: '+234 800 CIRCUFI' },
                            ].map((c, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#E0FAF4] flex items-center justify-center text-[#00A07A] flex-shrink-0">
                                        {c.icon}
                                    </div>
                                    <div>
                                        <p className={`text-xs ${muted}`}>{c.label}</p>
                                        <p className={`text-sm font-semibold ${text}`}>{c.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right form */}
                    <div className={`rounded-2xl border p-6 ${card}`}>
                        {sent ? (
                            <div className="text-center py-8">
                                <div className="w-14 h-14 rounded-full bg-[#00C896] flex items-center justify-center mx-auto mb-4">
                                    <Check size={24} className="text-white" strokeWidth={3} />
                                </div>
                                <h3 className={`text-lg font-bold mb-2 ${text}`}>Your email app is opening</h3>
                                <p className={`text-sm mb-5 ${muted}`}>Send the pre-filled message from your email app and we'll reply within 24 hours.</p>
                                <button
                                    onClick={() => { setSent(false); setName(''); setEmail(''); setMessage('') }}
                                    className="text-sm text-[#00A07A] underline underline-offset-2"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <h2 className={`text-base font-bold mb-1 ${text}`}>Send us a message</h2>
                                <Input
                                    label="Your name"
                                    placeholder="Adaeze Okonkwo"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                                <Input
                                    label="Email address"
                                    type="email"
                                    placeholder="adaeze@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                                <div>
                                    <label className={`text-xs font-medium block mb-1.5 ${text}`}>Message</label>
                                    <textarea
                                        rows={4}
                                        className="cf-input resize-none"
                                        placeholder="What can we help you with?"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                    />
                                </div>
                                <Button
                                    fullWidth size="lg" loading={loading}
                                    disabled={!name || !email || !message}
                                    onClick={handleSubmit}
                                >
                                    Send message
                                </Button>
                                <p className={`text-[11px] text-center ${muted}`}>
                                    We typically respond within 24 hours.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}