import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'

export function Layout() {
  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <Header />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
    </div>
  )
}
