"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let active = true
    const verifySession = async () => {
      try {
        const { data, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Session check timeout")), 4000)
          ),
        ])

        if (!active) return

        if (!error && data?.session?.user) {
          router.replace("/")
          router.refresh()
          return
        }
      } catch {
        // allow rendering login form after timeout/error
      } finally {
        if (active) setCheckingSession(false)
      }
    }

    verifySession()
    return () => {
      active = false
    }
  }, [router, supabase])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        const message = error.message.toLowerCase()
        setError(
          message.includes("invalid login credentials")
            ? "That email and password do not match. Use the password from the first signup. Later signup attempts do not change it."
            : error.message
        )
        setLoading(false)
      } else {
        await fetch("/api/auth/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "login_success", metadata: { auth_flow: "password" } }),
        }).catch(() => null)

        router.replace("/")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in")
      setLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(
        error.message.toLowerCase().includes("provider is not enabled")
          ? "GitHub sign-in is turned off in Supabase. Use email and password, or enable the GitHub provider in Supabase Authentication settings."
          : error.message
      )
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError("Enter your email and password, then click Create account.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      const message = error.message.toLowerCase()
      if (message.includes("rate limit")) {
        setError("Supabase blocked another confirmation email. Your account is already created. Click Sign in and use the same email and password.")
      } else if (message.includes("already registered") || message.includes("already been registered")) {
        setError("This email is already signed up. Click Sign in and use the same password.")
      } else {
        setError(error.message)
      }
    } else {
      setError("Check your email for the confirmation link. After it opens, come back here and sign in with the same email and password.")
    }
    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Diffusion orbs */}
      <div className="diffusion-orb orb-1" />
      <div className="diffusion-orb orb-2" />
      
      <Card className="glass w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center inner-glow">
              <span className="text-2xl font-bold text-primary-foreground">P</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to ProjectHub</CardTitle>
          <CardDescription>
            {mode === "signup" ? "Create an account to manage your projects" : "Sign in to manage your projects"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-shake">
              {error}
            </div>
          )}
          
          <form onSubmit={mode === "signup" ? handleSignUp : handleEmailLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm input-glow"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm input-glow"
              minLength={6}
              required
            />
            <Button type="submit" className="w-full btn-glow" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signup" ? "Create account" : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
              variant="outline"
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full gap-2 btn-glow"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup")
                setError(null)
              }}
              className="text-primary hover:underline link-underline"
              disabled={loading}
            >
              {mode === "signup" ? "Sign in" : "Sign up"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
