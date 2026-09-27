import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-muted-foreground mb-6">
          The email link confirmed your account, but it did not start a session.
          Go back and sign in with the same email and password.
        </p>
        <Link 
          href="/auth/login"
          className="text-primary hover:underline"
        >
          Go back to login
        </Link>
      </div>
    </div>
  )
}
