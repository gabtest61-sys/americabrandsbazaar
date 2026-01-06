'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, LogIn, ArrowLeft, Loader2, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const { login, isLoggedIn, isLoading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.push(`/${redirect}`)
    }
  }, [isLoggedIn, authLoading, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(email, password)

    if (result.success) {
      router.push(`/${redirect}`)
    } else {
      setError(result.error || 'Login failed')
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-navy pt-24 pb-16">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.1),transparent_60%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.05),transparent_60%)]" />
        </div>

        <div className="container-max px-4 md:px-8 relative z-10 py-12">
          <div className="max-w-md mx-auto">
            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            {/* Login Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <div className="relative w-20 h-20 rounded-full border-2 border-gold overflow-hidden">
                  <Image
                    src="/logo.jpg"
                    alt="LGM Apparel"
                    fill
                    className="object-cover scale-150"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-white/50 text-sm">
                  Sign in to access your account
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-4 mb-6">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-white/70 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-white/70 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-white/50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-gold focus:ring-gold/50"
                    />
                    Remember me
                  </label>
                  <button type="button" className="text-gold hover:text-yellow-400 transition-colors">
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 disabled:bg-gold/50 text-navy font-bold py-4 px-6 rounded-full transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-sm">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-white/50 text-sm">
                Don't have an account?{' '}
                <Link href="/register" className="text-gold hover:text-yellow-400 transition-colors font-medium">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
