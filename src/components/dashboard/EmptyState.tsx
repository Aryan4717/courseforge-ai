import { type ReactNode } from 'react'

function IconBook() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground/60"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </svg>
  )
}

function IconLibrary() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground/60"
      aria-hidden
    >
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  )
}

type EmptyStateProps = {
  icon?: 'book' | 'library'
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({
  icon = 'book',
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = icon === 'library' ? IconLibrary : IconBook

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-8 py-12 text-center">
      <div className="mb-4">
        <Icon />
      </div>
      <h3 className="text-subheading font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
