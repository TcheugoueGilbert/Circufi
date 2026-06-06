import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
    loading?: boolean
    fullWidth?: boolean
}

const variants: Record<Variant, string> = {
    primary:   'bg-teal text-white hover:bg-teal-mid active:scale-[0.98] disabled:opacity-40',
    secondary: 'bg-white text-navy border border-[#E8EAF0] hover:bg-gray-50 active:scale-[0.98]',
    ghost:     'text-[#8A91A0] hover:text-navy underline underline-offset-2',
    danger:    'bg-white text-red-600 border border-red-200 hover:bg-red-50 active:scale-[0.98]',
}

const sizes: Record<Size, string> = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
                                                                      variant = 'primary',
                                                                      size = 'md',
                                                                      loading = false,
                                                                      fullWidth = false,
                                                                      className,
                                                                      children,
                                                                      disabled,
                                                                      ...props
                                                                  }, ref) => (
    <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
            'inline-flex items-center justify-center gap-2 font-semibold rounded-pill',
            'transition-all duration-150 cursor-pointer select-none',
            'disabled:cursor-not-allowed',
            variants[variant],
            sizes[size],
            fullWidth && 'w-full',
            className
        )}
        {...props}
    >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
    </button>
))

Button.displayName = 'Button'