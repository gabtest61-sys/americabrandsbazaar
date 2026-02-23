import { db } from './firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'

// Types

export interface FirestoreProduct {
  id?: string
  name: string
  brand: string
  category: string
  subcategory?: string
  price: number
  originalPrice?: number
  description: string
  images: string[]
  colors: string[]
  sizes: string[]
  gender?: string
  tags: string[]
  inStock: boolean
  stockQty: number
  featured: boolean
  createdAt?: Timestamp
}

export interface FirestoreOrder {
  id?: string
  orderId: string
  userId: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  items: {
    productId?: string
    name: string
    brand?: string
    price: number
    quantity: number
    size?: string
    color?: string
    image?: string
  }[]
  customer?: {
    name: string
    email: string
    phone: string
    address?: string
    city?: string
  }
  createdAt?: Timestamp
}

export interface Review {
  id?: string
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  helpful?: number
  verified?: boolean
  createdAt?: Timestamp
}

export interface SavedLook {
  id?: string
  userId: string
  lookName: string
  lookDescription: string
  totalPrice: number
  styleTip?: string
  items: {
    productId: string
    productName: string
    brand: string
    price: number
    imageUrl?: string
    productUrl?: string
    category?: string
  }[]
  createdAt?: Timestamp
}

// Products

const productDefaults = {
  description: '',
  images: [] as string[],
  colors: [] as string[],
  sizes: [] as string[],
  tags: [] as string[],
  inStock: true,
  stockQty: 0,
  featured: false,
}

function toFirestoreProduct(id: string, data: Record<string, unknown>): FirestoreProduct {
  return { ...productDefaults, ...data, id } as FirestoreProduct
}

export async function getFirestoreProducts(): Promise<FirestoreProduct[]> {
  if (!db) return []
  try {
    const snapshot = await getDocs(collection(db, 'products'))
    return snapshot.docs.map(d => toFirestoreProduct(d.id, d.data()))
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getFirestoreProductById(id: string): Promise<FirestoreProduct | null> {
  if (!db) return null
  try {
    const docSnap = await getDoc(doc(db, 'products', id))
    if (docSnap.exists()) {
      return toFirestoreProduct(docSnap.id, docSnap.data())
    }
    return null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Orders

export async function getOrdersByUser(userId: string): Promise<FirestoreOrder[]> {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreOrder))
  } catch (error) {
    console.error('Error fetching orders:', error)
    return []
  }
}

// Wishlist

export async function getWishlist(userId: string): Promise<string[]> {
  if (!db) return []
  try {
    const docSnap = await getDoc(doc(db, 'wishlists', userId))
    if (docSnap.exists()) {
      return docSnap.data().productIds || []
    }
    return []
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return []
  }
}

export async function addToWishlist(userId: string, productId: string): Promise<boolean> {
  if (!db) return false
  try {
    const wishlistRef = doc(db, 'wishlists', userId)
    const docSnap = await getDoc(wishlistRef)
    if (docSnap.exists()) {
      const current: string[] = docSnap.data().productIds || []
      if (!current.includes(productId)) {
        await updateDoc(wishlistRef, { productIds: [...current, productId] })
      }
    } else {
      const { setDoc } = await import('firebase/firestore')
      await setDoc(wishlistRef, { productIds: [productId] })
    }
    return true
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return false
  }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<boolean> {
  if (!db) return false
  try {
    const wishlistRef = doc(db, 'wishlists', userId)
    const docSnap = await getDoc(wishlistRef)
    if (docSnap.exists()) {
      const current: string[] = docSnap.data().productIds || []
      await updateDoc(wishlistRef, { productIds: current.filter(id => id !== productId) })
    }
    return true
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return false
  }
}

// User Profile

export async function updateUserProfile(
  userId: string,
  data: Record<string, string>
): Promise<boolean> {
  if (!db) return false
  try {
    await updateDoc(doc(db, 'users', userId), data)
    return true
  } catch (error) {
    console.error('Error updating profile:', error)
    return false
  }
}

// Reviews

export async function getProductReviews(productId: string): Promise<Review[]> {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review))
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

export async function addReview(
  productId: string,
  userId: string,
  userName: string,
  rating: number,
  title: string,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database not initialized' }
  try {
    await addDoc(collection(db, 'reviews'), {
      productId,
      userId,
      userName,
      rating,
      title,
      comment,
      helpful: 0,
      verified: false,
      createdAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error('Error adding review:', error)
    return { success: false, error: 'Failed to submit review' }
  }
}

export async function markReviewHelpful(reviewId: string): Promise<boolean> {
  if (!db) return false
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      helpful: increment(1),
    })
    return true
  } catch (error) {
    console.error('Error marking review helpful:', error)
    return false
  }
}

// Saved Looks

export async function getSavedLooks(userId: string): Promise<SavedLook[]> {
  if (!db) return []
  try {
    const q = query(
      collection(db, 'savedLooks'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedLook))
  } catch (error) {
    console.error('Error fetching saved looks:', error)
    return []
  }
}

export async function deleteSavedLook(lookId: string): Promise<boolean> {
  if (!db) return false
  try {
    await deleteDoc(doc(db, 'savedLooks', lookId))
    return true
  } catch (error) {
    console.error('Error deleting saved look:', error)
    return false
  }
}
