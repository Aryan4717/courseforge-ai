import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionHeaderProps = {
  title: ReactNode
  description?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <header className={cn('space-y-1', className)}>
      <h2 className="text-heading text-foreground">{title}</h2>
      {description != null && (
        <p className="text-body text-muted-foreground">{description}</p>
      )}
    </header>
  )
}
