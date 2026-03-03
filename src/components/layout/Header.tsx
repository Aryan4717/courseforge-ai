import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { signOut } from '@/services/auth'

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export function Header() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
    setMenuOpen(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpen])

  const navContent = user ? (
    <>
      <Button variant="ghost" size="sm" asChild className="shrink-0">
        <Link to="/library" onClick={() => setMenuOpen(false)}>
          My Library
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild className="shrink-0">
        <Link to="/create" onClick={() => setMenuOpen(false)}>
          Create course
        </Link>
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
        <Link to="/login" onClick={() => setMenuOpen(false)}>
          Log in
        </Link>
      </Button>
      <Button size="sm" asChild className="shrink-0">
        <Link to="/signup" onClick={() => setMenuOpen(false)}>
          Sign up
        </Link>
      </Button>
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-14 min-w-0 max-w-5xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link to="/" className="shrink-0 font-semibold">
          CourseForge AI
        </Link>
        {!isLoading && (
          <>
            <nav className="hidden min-w-0 shrink items-center justify-end gap-4 md:flex">
              {navContent}
            </nav>
            <div className="relative md:hidden" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen((o) => !o)
                }}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="Open menu"
              >
                <MenuIcon />
              </Button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 min-w-[200px] rounded-lg border border-border bg-card py-2 shadow-lg">
                  {user ? (
                    <>
                      <Link
                        to="/library"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-body-sm text-foreground hover:bg-muted"
                      >
                        My Library
                      </Link>
                      <Link
                        to="/create"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-body-sm text-foreground hover:bg-muted"
                      >
                        Create course
                      </Link>
                      <div className="border-t border-border px-4 py-2">
                        <span className="text-body-sm text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-body-sm text-foreground hover:bg-muted"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-body-sm text-foreground hover:bg-muted"
                      >
                        Log in
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-body-sm text-foreground hover:bg-muted"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
