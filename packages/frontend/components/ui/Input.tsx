'use client'
import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    helper?: string
    error?: string
    prefix?: string
    suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
                                                                   label,
                                                                   helper,
                                                                   error,
                                                                   prefix,
                                                                   suffix,
                                                                   className,
                                                                   id,
                                                                   ...props
                                                               }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-xs font-medium text-navy"
                >
                    {label}
                </label>
            )}

            <div className="relative flex items-center">
                {prefix && (
                    <div className="absolute left-3.5 text-sm text-[#8A91A0] select-none pointer-events-none">
                        {prefix}
                    </div>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={clsx(
                        'cf-input',
                        prefix && 'pl-8',
                        suffix && 'pr-10',
                        error && 'border-red-300 focus:border-red-400',
                        className
                    )}
                    {...props}
                />
                {suffix && (
                    <div className="absolute right-3 text-[#8A91A0]">
                        {suffix}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
            {helper && !error && (
                <p className="text-xs text-[#8A91A0]">{helper}</p>
            )}
        </div>
    )
})

Input.displayName = 'Input'


/* Phone input with country code */
interface PhoneInputProps {
    value: string
    onChange: (val: string) => void
    label?: string
    error?: string
}

// Supported countries: Nigeria (+234, 10 digits) and Cameroon (+237, 9 digits)
const DIAL_CODES = ['+234', '+237']
const PLACEHOLDERS: Record<string, string> = { '+234': '812 345 6789', '+237': '6 71 23 45 67' }

/**
 * Phone field with country code. `value` / `onChange` use E.164 (e.g. "+2348123456789"),
 * the format the backend validates, so a leading 0 and spaces are removed automatically.
 */
export function PhoneInput({ value, onChange, label, error }: PhoneInputProps) {
    const [dial, setDial] = useState(DIAL_CODES.find(c => value.startsWith(c)) ?? DIAL_CODES[0])
    const local = value.startsWith(dial) ? value.slice(dial.length) : ''

    const emit = (code: string, raw: string) => {
        const digits = raw.replace(/\D/g, '').replace(/^0+/, '')
        onChange(digits ? code + digits : '')
    }

    return (
        <div className="flex flex-col gap-1.5">
            {label && <label className="text-xs font-medium text-navy">{label}</label>}
            <div className="flex gap-2">
                <select
                    className="cf-input w-20 flex-shrink-0 cursor-pointer"
                    value={dial}
                    onChange={e => { setDial(e.target.value); emit(e.target.value, local) }}
                >
                    {DIAL_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                    className={clsx('cf-input flex-1', error && 'border-red-300')}
                    placeholder={PLACEHOLDERS[dial]}
                    value={local}
                    onChange={e => emit(dial, e.target.value)}
                    type="tel"
                    inputMode="numeric"
                />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    )
}


/* OTP 6-box input */
interface OTPInputProps {
    value: string[]
    onChange: (val: string[]) => void
    length?: number
}

export function OTPInput({ value, onChange, length = 6 }: OTPInputProps) {
    const handleChange = (char: string, idx: number) => {
        const next = [...value]
        next[idx] = char.slice(-1)
        onChange(next)
        if (char && idx < length - 1) {
            document.getElementById(`otp-${idx + 1}`)?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
        if (e.key === 'Backspace' && !value[idx] && idx > 0) {
            document.getElementById(`otp-${idx - 1}`)?.focus()
        }
    }

    return (
        <div className="flex gap-2 justify-center">
            {Array.from({ length }).map((_, i) => (
                <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={e => handleChange(e.target.value, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    className={clsx(
                        'w-11 h-[52px] text-center text-xl font-semibold',
                        'border border-[#E8EAF0] rounded-lg bg-white text-navy',
                        'focus:outline-none focus:border-teal transition-colors',
                        value[i] && 'border-teal bg-teal-light'
                    )}
                />
            ))}
        </div>
    )
}