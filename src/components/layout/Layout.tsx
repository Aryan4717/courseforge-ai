import { type ReactNode } from 'react'
import { Header } from '@/components/layout/Header'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6">
        {children}
      </main>
    </div>
  )
}
