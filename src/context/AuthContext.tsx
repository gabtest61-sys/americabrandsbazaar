'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  username: string
  name: string
  email: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('lgm_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('lgm_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if user exists in localStorage (registered users)
    const registeredUsers = JSON.parse(localStorage.getItem('lgm_registered_users') || '[]')
    const foundUser = registeredUsers.find((u: { email: string; password: string }) =>
      u.email === email && u.password === password
    )

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem('lgm_user', JSON.stringify(userWithoutPassword))
      return { success: true }
    }

    return { success: false, error: 'Invalid email or password' }
  }

  const register = async (data: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Get existing users
    const registeredUsers = JSON.parse(localStorage.getItem('lgm_registered_users') || '[]')

    // Check if email already exists
    if (registeredUsers.some((u: { email: string }) => u.email === data.email)) {
      return { success: false, error: 'Email already registered' }
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      username: data.email.split('@')[0],
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password // In production, this would be hashed
    }

    // Save to registered users
    registeredUsers.push(newUser)
    localStorage.setItem('lgm_registered_users', JSON.stringify(registeredUsers))

    // Log the user in
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem('lgm_user', JSON.stringify(userWithoutPassword))

    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('lgm_user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
