import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { signOut } from '@/services/auth'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
        <Link to="/" className="shrink-0 font-semibold">
          CourseForge AI
        </Link>
        {!isLoading && (
          <nav className="flex min-w-0 shrink items-center justify-end gap-4">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/library">My Library</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/create">Create course</Link>
                </Button>
                <span className="max-w-[180px] truncate text-body-sm text-muted-foreground sm:max-w-[220px]">
                  {user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="shrink-0">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild className="shrink-0">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
