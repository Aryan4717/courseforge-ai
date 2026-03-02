import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardFooter, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { signUp } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await signUp(email, password)
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <SectionHeader
        title="Sign up"
        description="Create an account with your email and password."
      />
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="signup-email" className="text-body-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-password" className="text-body-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-body-sm text-destructive">{error}</p>
            )}
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
            <p className="text-body-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
