import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { db } from './firebase'

// Types
export interface OrderItem {
  productId: string
  name: string
  brand: string
  price: number
  quantity: number
  size?: string
  color?: string
}

export interface FirestoreOrder {
  id?: string
  orderId: string
  userId?: string
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  customerInfo: {
    name: string
    email: string
    phone: string
    address?: string
    city?: string
  }
  notes?: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export interface UserProfile {
  name: string
  email: string
  phone?: string
  preferences?: {
    colors?: string[]
    sizes?: string[]
    styles?: string[]
  }
  aiDresserUsage?: number
  lastActive?: Timestamp
  createdAt?: Timestamp
}

// Generate order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

// Create order in Firestore
export const createOrder = async (
  items: OrderItem[],
  customerInfo: FirestoreOrder['customerInfo'],
  userId?: string,
  notes?: string
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  if (!db) {
    console.warn('Firestore not configured')
    return { success: false, error: 'Database not configured' }
  }

  try {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const shippingFee = subtotal >= 2000 ? 0 : 100 // Free shipping over ₱2000
    const total = subtotal + shippingFee
    const orderId = generateOrderId()

    const orderData: Omit<FirestoreOrder, 'id'> = {
      orderId,
      userId: userId || undefined,
      items,
      subtotal,
      shippingFee,
      total,
      status: 'pending',
      customerInfo,
      notes: notes || undefined,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    // Save to appropriate collection based on auth status
    const collectionName = userId ? 'orders' : 'guestOrders'
    await addDoc(collection(db, collectionName), orderData)

    return { success: true, orderId }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: 'Failed to create order' }
  }
}

// Get orders by user ID
export const getOrdersByUser = async (userId: string): Promise<FirestoreOrder[]> => {
  if (!db) return []

  try {
    const ordersRef = collection(db, 'orders')
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreOrder[]
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

// Get all orders (admin)
export const getAllOrders = async (): Promise<FirestoreOrder[]> => {
  if (!db) return []

  try {
    // Get authenticated orders
    const ordersRef = collection(db, 'orders')
    const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'))
    const ordersSnapshot = await getDocs(ordersQuery)

    // Get guest orders
    const guestOrdersRef = collection(db, 'guestOrders')
    const guestQuery = query(guestOrdersRef, orderBy('createdAt', 'desc'))
    const guestSnapshot = await getDocs(guestQuery)

    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreOrder[]

    const guestOrders = guestSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreOrder[]

    // Combine and sort by date
    return [...orders, ...guestOrders].sort((a, b) => {
      const dateA = a.createdAt?.toMillis() || 0
      const dateB = b.createdAt?.toMillis() || 0
      return dateB - dateA
    })
  } catch (error) {
    console.error('Error fetching all orders:', error)
    return []
  }
}

// Update order status (admin)
export const updateOrderStatus = async (
  orderId: string,
  status: FirestoreOrder['status'],
  isGuestOrder: boolean = false
): Promise<boolean> => {
  if (!db) return false

  try {
    const collectionName = isGuestOrder ? 'guestOrders' : 'orders'
    const orderRef = doc(db, collectionName, orderId)
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error updating order:', error)
    return false
  }
}

// Get all users (admin)
export const getAllUsers = async (): Promise<(UserProfile & { id: string })[]> => {
  if (!db) return []

  try {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as (UserProfile & { id: string })[]
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

// Update user preferences
export const updateUserPreferences = async (
  userId: string,
  preferences: UserProfile['preferences']
): Promise<boolean> => {
  if (!db) return false

  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      preferences,
      lastActive: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error updating preferences:', error)
    return false
  }
}

// Update user profile (name, phone)
export const updateUserProfile = async (
  userId: string,
  data: { name?: string; phone?: string }
): Promise<boolean> => {
  if (!db) return false

  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...data,
      lastActive: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error updating profile:', error)
    return false
  }
}

// Increment AI Dresser usage
export const incrementAIDresserUsage = async (userId: string): Promise<boolean> => {
  if (!db) return false

  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    const currentUsage = userDoc.data()?.aiDresserUsage || 0

    await updateDoc(userRef, {
      aiDresserUsage: currentUsage + 1,
      lastActive: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error incrementing AI Dresser usage:', error)
    return false
  }
}

// Check if user is admin
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  if (!db) return false

  try {
    const adminRef = doc(db, 'admins', userId)
    const adminDoc = await getDoc(adminRef)
    return adminDoc.exists()
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// ==================== WISHLIST ====================

export interface WishlistItem {
  productId: string
  addedAt: Timestamp
}

// Get user's wishlist
export const getWishlist = async (userId: string): Promise<string[]> => {
  if (!db) return []

  try {
    const wishlistRef = doc(db, 'wishlists', userId)
    const wishlistDoc = await getDoc(wishlistRef)

    if (wishlistDoc.exists()) {
      return wishlistDoc.data()?.productIds || []
    }
    return []
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return []
  }
}

// Add to wishlist
export const addToWishlist = async (userId: string, productId: string): Promise<boolean> => {
  if (!db) return false

  try {
    const wishlistRef = doc(db, 'wishlists', userId)
    await setDoc(wishlistRef, {
      productIds: arrayUnion(productId),
      updatedAt: serverTimestamp()
    }, { merge: true })
    return true
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return false
  }
}

// Remove from wishlist
export const removeFromWishlist = async (userId: string, productId: string): Promise<boolean> => {
  if (!db) return false

  try {
    const wishlistRef = doc(db, 'wishlists', userId)
    await updateDoc(wishlistRef, {
      productIds: arrayRemove(productId),
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return false
  }
}

// ==================== REVIEWS ====================

export interface Review {
  id?: string
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  verified: boolean
  helpful: number
  createdAt: Timestamp | null
}

// Add a review
export const addReview = async (
  productId: string,
  userId: string,
  userName: string,
  rating: number,
  title: string,
  comment: string
): Promise<{ success: boolean; error?: string }> => {
  if (!db) return { success: false, error: 'Database not configured' }

  try {
    // Check if user already reviewed this product
    const reviewsRef = collection(db, 'reviews')
    const existingQuery = query(
      reviewsRef,
      where('productId', '==', productId),
      where('userId', '==', userId)
    )
    const existingSnapshot = await getDocs(existingQuery)

    if (!existingSnapshot.empty) {
      return { success: false, error: 'You have already reviewed this product' }
    }

    const reviewData: Omit<Review, 'id'> = {
      productId,
      userId,
      userName,
      rating,
      title,
      comment,
      verified: false,
      helpful: 0,
      createdAt: serverTimestamp() as Timestamp
    }

    await addDoc(reviewsRef, reviewData)
    return { success: true }
  } catch (error) {
    console.error('Error adding review:', error)
    return { success: false, error: 'Failed to add review' }
  }
}

// Get reviews for a product
export const getProductReviews = async (productId: string): Promise<Review[]> => {
  if (!db) return []

  try {
    const reviewsRef = collection(db, 'reviews')
    const q = query(
      reviewsRef,
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Review[]
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

// Get average rating for a product
export const getProductRating = async (productId: string): Promise<{ average: number; count: number }> => {
  if (!db) return { average: 0, count: 0 }

  try {
    const reviews = await getProductReviews(productId)
    if (reviews.length === 0) return { average: 0, count: 0 }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length
    }
  } catch (error) {
    console.error('Error getting product rating:', error)
    return { average: 0, count: 0 }
  }
}

// Mark review as helpful
export const markReviewHelpful = async (reviewId: string): Promise<boolean> => {
  if (!db) return false

  try {
    const reviewRef = doc(db, 'reviews', reviewId)
    const reviewDoc = await getDoc(reviewRef)
    const currentHelpful = reviewDoc.data()?.helpful || 0

    await updateDoc(reviewRef, {
      helpful: currentHelpful + 1
    })
    return true
  } catch (error) {
    console.error('Error marking review helpful:', error)
    return false
  }
}

// Get all reviews (admin)
export const getAllReviews = async (): Promise<Review[]> => {
  if (!db) return []

  try {
    const reviewsRef = collection(db, 'reviews')
    const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(100))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Review[]
  } catch (error) {
    console.error('Error fetching all reviews:', error)
    return []
  }
}
