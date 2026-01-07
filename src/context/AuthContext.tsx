'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface User {
  id: string
  username: string
  name: string
  email: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  deleteAccount: () => Promise<{ success: boolean; error?: string }>
  updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setIsLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser)

        // Try to get additional user data from Firestore
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              setUser({
                id: fbUser.uid,
                username: userData.username || fbUser.email?.split('@')[0] || '',
                name: userData.name || fbUser.displayName || '',
                email: fbUser.email || '',
                phone: userData.phone || ''
              })
            } else {
              // User exists in Auth but not in Firestore
              setUser({
                id: fbUser.uid,
                username: fbUser.email?.split('@')[0] || '',
                name: fbUser.displayName || '',
                email: fbUser.email || '',
              })
            }
          } catch (error) {
            // Firestore might not be set up yet, use basic auth data
            setUser({
              id: fbUser.uid,
              username: fbUser.email?.split('@')[0] || '',
              name: fbUser.displayName || '',
              email: fbUser.email || '',
            })
          }
        } else {
          // Firestore not configured, use basic auth data
          setUser({
            id: fbUser.uid,
            username: fbUser.email?.split('@')[0] || '',
            name: fbUser.displayName || '',
            email: fbUser.email || '',
          })
        }
      } else {
        setFirebaseUser(null)
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Authentication service not configured' }
    }
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'

      // Provide user-friendly error messages
      if (errorMessage.includes('user-not-found')) {
        return { success: false, error: 'No account found with this email' }
      }
      if (errorMessage.includes('wrong-password')) {
        return { success: false, error: 'Incorrect password' }
      }
      if (errorMessage.includes('invalid-email')) {
        return { success: false, error: 'Invalid email address' }
      }
      if (errorMessage.includes('too-many-requests')) {
        return { success: false, error: 'Too many attempts. Please try again later' }
      }
      if (errorMessage.includes('invalid-credential')) {
        return { success: false, error: 'Invalid email or password' }
      }

      return { success: false, error: 'Invalid email or password' }
    }
  }

  const register = async (data: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    if (!auth) {
      return { success: false, error: 'Authentication service not configured' }
    }
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const fbUser = userCredential.user

      // Update display name
      await updateProfile(fbUser, { displayName: data.name })

      // Store additional user data in Firestore
      if (db) {
        try {
          await setDoc(doc(db, 'users', fbUser.uid), {
            username: data.email.split('@')[0],
            name: data.name,
            email: data.email,
            phone: data.phone,
            createdAt: new Date().toISOString()
          })
        } catch (firestoreError) {
          // Firestore write might fail if rules aren't set up, but auth still works
          console.warn('Could not save to Firestore:', firestoreError)
        }
      }

      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'

      // Provide user-friendly error messages
      if (errorMessage.includes('email-already-in-use')) {
        return { success: false, error: 'Email already registered' }
      }
      if (errorMessage.includes('weak-password')) {
        return { success: false, error: 'Password is too weak. Use at least 6 characters.' }
      }
      if (errorMessage.includes('invalid-email')) {
        return { success: false, error: 'Invalid email address' }
      }

      return { success: false, error: 'Registration failed. Please try again.' }
    }
  }

  const logout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth || !firebaseUser) {
      return { success: false, error: 'Not authenticated' }
    }
    try {
      const userId = firebaseUser.uid

      // Delete user data from Firestore first
      if (db) {
        const { deleteDoc, doc } = await import('firebase/firestore')
        try {
          await deleteDoc(doc(db, 'users', userId))
        } catch {
          // User doc might not exist
        }
        try {
          await deleteDoc(doc(db, 'wishlists', userId))
        } catch {
          // Wishlist might not exist
        }
      }

      // Delete user from Firebase Auth
      await deleteUser(firebaseUser)

      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account'

      if (errorMessage.includes('requires-recent-login')) {
        return { success: false, error: 'Please log out and log back in, then try again' }
      }

      return { success: false, error: 'Failed to delete account. Please try again.' }
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      isLoggedIn: !!user,
      isLoading,
      login,
      register,
      logout,
      deleteAccount,
      updateUser
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
