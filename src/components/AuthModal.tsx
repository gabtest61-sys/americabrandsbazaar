'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Eye, EyeOff, LogIn, UserPlus, Loader2, Mail, User, Phone, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' })

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setError('')
      setLoginData({ email: '', password: '' })
      setRegisterData({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
    }
  }, [isOpen])

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(loginData.email, loginData.password)

    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Login failed')
    }
    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    const result = await register({
      name: registerData.name,
      email: registerData.email,
      phone: registerData.phone,
      password: registerData.password
    })

    if (result.success) {
      onClose()
    } else {
      setError(result.error || 'Registration failed')
    }
    setIsLoading(false)
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setShowPassword(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - slides up on mobile, centered on desktop */}
      <div className="relative bg-navy border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-scale-in safe-area-bottom">
        {/* Drag handle for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>

        <div className="p-5 sm:p-8 pt-2 sm:pt-8">
          {/* Logo */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-gold overflow-hidden">
              <Image
                src="/logo.png"
                alt="America Brands Bazaar"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-white/50 text-xs sm:text-sm">
              {mode === 'login'
                ? 'Sign in to access your account'
                : 'Join America Brands Bazaar for exclusive benefits'}
            </p>
          </div>

          {/* Benefits (Register mode only) */}
          {mode === 'register' && (
            <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 mb-5">
              <div className="flex items-center gap-2 text-gold mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold">Account Benefits</span>
              </div>
              <ul className="text-white/60 text-xs space-y-0.5">
                <li>• Access to AI Dresser styling</li>
                <li>• Track orders & order history</li>
                <li>• Faster checkout</li>
              </ul>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl p-3 mb-5">
              {error}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-white/70 text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-400 disabled:bg-gold/50 text-navy font-bold py-3 sm:py-3.5 px-6 rounded-full transition-all text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-white/70 text-xs sm:text-sm font-medium mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="Juan Dela Cruz"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-xs sm:text-sm font-medium mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="juan@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-xs sm:text-sm font-medium mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/30" />
                  <input
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    placeholder="09XX XXX XXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-xs sm:text-sm font-medium mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-xs sm:text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-400 disabled:bg-gold/50 text-navy font-bold py-3 sm:py-3.5 px-6 rounded-full transition-all mt-3 sm:mt-4 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Create Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-4 sm:my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs sm:text-sm">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Switch Mode */}
          <p className="text-center text-white/50 text-xs sm:text-sm pb-2 sm:pb-0">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={switchMode}
              className="text-gold hover:text-gold-400 transition-colors font-medium"
            >
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
