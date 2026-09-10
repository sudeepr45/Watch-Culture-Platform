import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'text'
  size?: 'sm' | 'md' | 'lg'
  iconRight?: ReactNode
  className?: string
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconRight,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 tracking-[0.12em] uppercase text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const sizeStyles = {
    sm: 'py-2.5 px-5 gap-2',
    md: 'py-3.5 px-7 gap-2.5',
    lg: 'py-4.5 px-9 gap-3 text-sm',
  }

  const variantStyles = {
    primary:
      'bg-ink text-warm-white hover:bg-neutral-800 active:bg-black',
    secondary:
      'bg-transparent text-ink border border-hairline hover:border-ink hover:bg-warm-surface active:bg-neutral-200',
    text:
      'bg-transparent text-ink p-0 hover:text-ink/70 active:text-ink tracking-[0.15em] border-b border-ink/30 hover:border-ink pb-1',
  }

  const combinedClass =
    variant === 'text'
      ? `${baseStyles} ${variantStyles.text} ${className}`
      : `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`

  return (
    <button className={combinedClass} {...props}>
      <span>{children}</span>
      {iconRight && (
        <span className="transition-transform duration-200 group-hover:translate-x-1">
          {iconRight}
        </span>
      )}
    </button>
  )
}
