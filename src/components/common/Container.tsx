import { type ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'header' | 'footer' | 'nav'
}

export default function Container({
  children,
  className = '',
  as: Component = 'div',
}: ContainerProps) {
  return (
    <Component
      className={`mx-auto w-full max-w-[1440px] px-5 sm:px-8 md:px-12 lg:px-16 ${className}`}
    >
      {children}
    </Component>
  )
}
