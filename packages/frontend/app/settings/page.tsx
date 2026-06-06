'use client'
import { useState } from 'react'
import { User, Bell, Shield, Lock, LogOut, ChevronRight, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, Avatar } from '@/components/ui/index'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { clsx } from 'clsx'

/* ── Toggle ──────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!on)}
            className={clsx(
                'relative w-10 h-6 rounded-full transition-colors flex-shrink-0',
                on ? 'bg-teal' : 'bg-[#E8EAF0]'
            )}
        >
      <span className={clsx(
          'absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all',
          on ? 'left-5' : 'left-1'
      )} />
        </button>
    )
}

/* ── Section heading ─────────────────────── */
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-bold text-[#8A91A0] uppercase tracking-widest mb-2 px-1">{title}</p>
            <Card padding="none">
                {children}
            </Card>
        </div>
    )
}

/* ── Row link ────────────────────────────── */
function SettingsRow({
                         icon, label, sub, right, onClick, danger
                     }: {
    icon: React.ReactNode
    label: string
    sub?: string
    right?: React.ReactNode
    onClick?: () => void
    danger?: boolean
}) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#F7F8FA] last:border-0',
                'text-left transition-colors',
                danger ? 'hover:bg-red-50' : 'hover:bg-[#F7F8FA]'
            )}
        >
            <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                danger ? 'bg-red-50 text-red-500' : 'bg-[#F7F8FA] text-[#8A91A0]'
            )}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-medium', danger ? 'text-red-600' : 'text-navy')}>{label}</p>
                {sub && <p className="text-[11px] text-[#8A91A0] mt-0.5">{sub}</p>}
            </div>
            {right ?? <ChevronRight size={14} className="text-[#8A91A0] flex-shrink-0" />}
        </button>
    )
}

/* ── Main ────────────────────────────────── */
export default function SettingsPage() {
    const [notifs, setNotifs] = useState({
        paymentReminders: true,
        paymentConfirmed: true,
        newMember:        false,
        payoutReady:      true,
        lateAlerts:       true,
    })
    const [privacy, setPrivacy] = useState({
        publicHistory:  true,
        showToAdmins:   true,
    })

    return (
        <AppShell>
            <h1 className="text-xl font-bold text-navy tracking-tight mb-5">Settings</h1>

            <div className="flex flex-col gap-5 max-w-lg">

                {/* Profile card */}
                <Card>
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar name="Adaeze Okonkwo" size="xl" />
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-navy">Adaeze Okonkwo</p>
                            <p className="text-xs text-[#8A91A0] mt-0.5">+234 812 345 6789</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                ✓ Verified
              </span>
                        </div>
                        <Button size="sm" variant="secondary">Edit</Button>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Input
                            label="Full name"
                            defaultValue="Adaeze Okonkwo"
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="adaeze@email.com"
                            helper="Optional — used for account recovery"
                        />
                    </div>
                </Card>

                {/* Notifications */}
                <SettingsSection title="Notifications">
                    {(Object.entries(notifs) as [keyof typeof notifs, boolean][]).map(([key, val]) => {
                        const labels: Record<keyof typeof notifs, { label: string; sub: string }> = {
                            paymentReminders: { label: 'Payment reminders',    sub: '2 days before due date'       },
                            paymentConfirmed: { label: 'Payment confirmations',sub: 'When admin verifies your payment' },
                            newMember:        { label: 'New member joined',    sub: 'When someone joins your circle' },
                            payoutReady:      { label: 'Payout notifications', sub: "When it's your turn to receive" },
                            lateAlerts:       { label: 'Late payment alerts',  sub: 'When a member in your circle is late' },
                        }
                        const { label, sub } = labels[key]
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F7F8FA] last:border-0"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-navy">{label}</p>
                                    <p className="text-[11px] text-[#8A91A0]">{sub}</p>
                                </div>
                                <Toggle on={val} onChange={v => setNotifs(n => ({ ...n, [key]: v }))} />
                            </div>
                        )
                    })}
                </SettingsSection>

                {/* Privacy */}
                <SettingsSection title="Privacy">
                    {(Object.entries(privacy) as [keyof typeof privacy, boolean][]).map(([key, val]) => {
                        const labels: Record<keyof typeof privacy, { label: string; sub: string }> = {
                            publicHistory: { label: 'Public payment history', sub: 'Anyone can view your record'           },
                            showToAdmins:  { label: 'Visible to circle admins',sub: 'Admins see your history before you join' },
                        }
                        const { label, sub } = labels[key]
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F7F8FA] last:border-0"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-navy">{label}</p>
                                    <p className="text-[11px] text-[#8A91A0]">{sub}</p>
                                </div>
                                <Toggle on={val} onChange={v => setPrivacy(p => ({ ...p, [key]: v }))} />
                            </div>
                        )
                    })}
                </SettingsSection>

                {/* Security */}
                <SettingsSection title="Security">
                    <SettingsRow
                        icon={<Lock size={15} />}
                        label="Change phone number"
                        sub="Requires re-verification"
                    />
                    <SettingsRow
                        icon={<Shield size={15} />}
                        label="Active sessions"
                        sub="1 active session"
                    />
                </SettingsSection>

                {/* Danger zone */}
                <SettingsSection title="Account">
                    <SettingsRow
                        icon={<LogOut size={15} />}
                        label="Sign out"
                    />
                    <SettingsRow
                        icon={<Trash2 size={15} />}
                        label="Delete account"
                        sub="This action cannot be undone"
                        danger
                    />
                </SettingsSection>

            </div>
        </AppShell>
    )
}