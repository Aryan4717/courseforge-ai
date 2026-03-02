import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
    </div>
  )
}
