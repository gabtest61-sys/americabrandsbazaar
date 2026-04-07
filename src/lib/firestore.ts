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
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from './firebase'

// ==================== IMAGE UPLOAD ====================

export const uploadProductImage = async (
  file: File,
  productId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  if (!storage) return { success: false, error: 'Storage not configured' }

  try {
    const timestamp = Date.now()
    const fileName = `${productId}-${timestamp}-${file.name}`
    const storageRef = ref(storage, `products/${fileName}`)

    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)

    return { success: true, url }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

export const deleteProductImage = async (imageUrl: string): Promise<boolean> => {
  if (!storage) return false

  try {
    const storageRef = ref(storage, imageUrl)
    await deleteObject(storageRef)
    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

// Types
export interface OrderItem {
  productId: string
  name: string
  brand?: string
  price: number
  quantity: number
  size?: string
  color?: string
  image?: string
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
    houseNo?: string
    street?: string
    barangay?: string
    province?: string
    zip?: string
    facebook?: string
  }
  notes?: string
  // Payment fields
  paymentMethod?: 'cod' | 'online' | 'gcash' | 'bank'
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentId?: string
  paymentProofUrl?: string
  paymentProofSubmittedAt?: Timestamp | null
  checkoutSessionId?: string
  paidAt?: Timestamp | null
  paymentError?: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export interface UserProfile {
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  houseNo?: string
  street?: string
  barangay?: string
  province?: string
  zip?: string
  facebook?: string
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
  notes?: string,
  paymentMethod?: FirestoreOrder['paymentMethod'],
  paymentStatus?: FirestoreOrder['paymentStatus']
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
      ...(userId ? { userId } : {}),
      items,
      subtotal,
      shippingFee,
      total,
      status: 'pending',
      customerInfo,
      ...(notes ? { notes } : {}),
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentStatus || 'pending',
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    }

    // Save to appropriate collection based on auth status
    const collectionName = userId ? 'orders' : 'guestOrders'
    await addDoc(collection(db, collectionName), orderData)

    // Grant bonus AI Dresser session for authenticated users making purchases
    // Only grant if payment is already confirmed (COD or paid online)
    if (userId && (paymentMethod === 'cod' || paymentStatus === 'paid')) {
      await addBonusAIDresserSessions(userId, 1)
    }

    return { success: true, orderId }
  } catch (error: any) {
    console.error('Error creating order:', error)
    return { success: false, error: error?.message || 'Failed to create order' }
  }
}

// Get orders by user ID or email (covers guest orders and pre-login orders)
export const getOrdersByUser = async (userId: string, email?: string): Promise<FirestoreOrder[]> => {
  if (!db) return []

  const seen = new Set<string>()
  const allResults: FirestoreOrder[] = []

  const addResults = (docs: any[]) => {
    for (const d of docs) {
      if (!seen.has(d.id)) {
        seen.add(d.id)
        allResults.push({ id: d.id, ...d.data() } as FirestoreOrder)
      }
    }
  }

  // 1. orders by userId — primary source
  try {
    const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', userId)))
    addResults(snap.docs)
  } catch (e) {
    console.warn('getOrdersByUser userId query failed:', e)
  }

  // 2. orders by email — catches orders placed before login or email mismatch
  if (email) {
    try {
      const snap = await getDocs(query(collection(db, 'orders'), where('customerInfo.email', '==', email)))
      addResults(snap.docs)
    } catch (e) {
      console.warn('getOrdersByUser email query failed:', e)
    }

    // 3. guestOrders by email
    try {
      const snap = await getDocs(query(collection(db, 'guestOrders'), where('customerInfo.email', '==', email)))
      addResults(snap.docs)
    } catch (e) {
      console.warn('getOrdersByUser guestOrders query failed:', e)
    }
  }

  // Sort by date descending
  return allResults.sort((a, b) => {
    const dateA = a.createdAt?.toMillis?.() || 0
    const dateB = b.createdAt?.toMillis?.() || 0
    return dateB - dateA
  })
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

// Get order by order ID (searches both collections)
export const getOrderById = async (orderId: string): Promise<FirestoreOrder | null> => {
  if (!db) return null

  try {
    // Search in authenticated orders first
    const ordersRef = collection(db, 'orders')
    const q = query(ordersRef, where('orderId', '==', orderId))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      return { id: doc.id, ...doc.data() } as FirestoreOrder
    }

    // Search in guest orders
    const guestOrdersRef = collection(db, 'guestOrders')
    const guestQ = query(guestOrdersRef, where('orderId', '==', orderId))
    const guestSnapshot = await getDocs(guestQ)

    if (!guestSnapshot.empty) {
      const doc = guestSnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as FirestoreOrder
    }

    return null
  } catch (error) {
    console.error('Error fetching order by ID:', error)
    return null
  }
}

// Submit payment proof screenshot
export const submitPaymentProof = async (orderId: string, proofUrl: string): Promise<boolean> => {
  if (!db) return false
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      paymentProofUrl: proofUrl,
      paymentProofSubmittedAt: serverTimestamp(),
      paymentStatus: 'paid',
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('Error submitting payment proof:', error)
    return false
  }
}

// Delete order (admin)
export const deleteOrder = async (orderId: string, isGuestOrder: boolean = false): Promise<boolean> => {
  if (!db) return false
  try {
    const collectionName = isGuestOrder ? 'guestOrders' : 'orders'
    await deleteDoc(doc(db, collectionName, orderId))
    return true
  } catch (error) {
    console.error('Error deleting order:', error)
    return false
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

// Update order notes (admin)
export const updateOrderNotes = async (
  orderId: string,
  notes: string,
  isGuestOrder: boolean = false
): Promise<boolean> => {
  if (!db) return false

  try {
    const collectionName = isGuestOrder ? 'guestOrders' : 'orders'
    const orderRef = doc(db, collectionName, orderId)
    await updateDoc(orderRef, {
      notes,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error updating order notes:', error)
    return false
  }
}

// Update order payment info (for PayMongo webhooks)
export const updateOrderPayment = async (
  orderId: string,
  paymentData: {
    paymentStatus?: FirestoreOrder['paymentStatus']
    paymentId?: string
    checkoutSessionId?: string
    paidAt?: Timestamp | null
    paymentError?: string
  }
): Promise<boolean> => {
  if (!db) return false

  try {
    // Find the order by orderId field (not document ID)
    const order = await getOrderById(orderId)
    if (!order || !order.id) {
      console.error('Order not found:', orderId)
      return false
    }

    // Determine collection based on userId
    const collectionName = order.userId ? 'orders' : 'guestOrders'
    const orderRef = doc(db, collectionName, order.id)

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp()
    }

    if (paymentData.paymentStatus) {
      updateData.paymentStatus = paymentData.paymentStatus
    }
    if (paymentData.paymentId) {
      updateData.paymentId = paymentData.paymentId
    }
    if (paymentData.checkoutSessionId) {
      updateData.checkoutSessionId = paymentData.checkoutSessionId
    }
    if (paymentData.paidAt !== undefined) {
      updateData.paidAt = paymentData.paidAt
    }
    if (paymentData.paymentError) {
      updateData.paymentError = paymentData.paymentError
    }

    // If payment is successful, update order status to confirmed
    if (paymentData.paymentStatus === 'paid') {
      updateData.status = 'confirmed'
      updateData.paidAt = serverTimestamp()

      // Grant bonus AI Dresser session if userId exists
      if (order.userId) {
        await addBonusAIDresserSessions(order.userId, 1)
      }
    }

    await updateDoc(orderRef, updateData)
    return true
  } catch (error) {
    console.error('Error updating order payment:', error)
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

// Update user profile (name, phone, address, city)
export const updateUserProfile = async (
  userId: string,
  data: { name?: string; phone?: string; address?: string; city?: string; houseNo?: string; street?: string; barangay?: string; province?: string; zip?: string; facebook?: string }
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
      lastAIDresserUse: serverTimestamp(),
      lastActive: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error incrementing AI Dresser usage:', error)
    return false
  }
}

// Check if user can use AI Dresser today (resets at midnight)
// Also checks for bonus sessions from purchases
export const checkAIDresserDailyAccess = async (userId: string): Promise<{
  hasAccess: boolean
  lastUse: Date | null
  usageCount: number
  bonusSessions: number
  accessType: 'daily_free' | 'bonus' | 'none'
}> => {
  if (!db) return { hasAccess: true, lastUse: null, usageCount: 0, bonusSessions: 0, accessType: 'daily_free' }

  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return { hasAccess: true, lastUse: null, usageCount: 0, bonusSessions: 0, accessType: 'daily_free' }
    }

    const data = userDoc.data()
    const lastUse = data?.lastAIDresserUse?.toDate() || null
    const usageCount = data?.aiDresserUsage || 0
    const bonusSessions = data?.bonusAIDresserSessions || 0

    if (!lastUse) {
      return { hasAccess: true, lastUse: null, usageCount, bonusSessions, accessType: 'daily_free' }
    }

    // Check if last use was before today's midnight
    const now = new Date()
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

    const dailySessionAvailable = lastUse < todayMidnight

    // Has access if daily session is available OR has bonus sessions
    if (dailySessionAvailable) {
      return { hasAccess: true, lastUse, usageCount, bonusSessions, accessType: 'daily_free' }
    } else if (bonusSessions > 0) {
      return { hasAccess: true, lastUse, usageCount, bonusSessions, accessType: 'bonus' }
    }

    return { hasAccess: false, lastUse, usageCount, bonusSessions, accessType: 'none' }
  } catch (error) {
    console.error('Error checking AI Dresser access:', error)
    return { hasAccess: true, lastUse: null, usageCount: 0, bonusSessions: 0, accessType: 'daily_free' }
  }
}

// Add bonus AI Dresser sessions to user (called after purchase)
export const addBonusAIDresserSessions = async (
  userId: string,
  sessionsToAdd: number = 1
): Promise<boolean> => {
  if (!db) return false

  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    const currentBonus = userDoc.data()?.bonusAIDresserSessions || 0

    await updateDoc(userRef, {
      bonusAIDresserSessions: currentBonus + sessionsToAdd,
      lastActive: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error adding bonus AI Dresser sessions:', error)
    return false
  }
}

// Consume a bonus AI Dresser session (decrement count)
export const consumeBonusAIDresserSession = async (userId: string): Promise<boolean> => {
  if (!db) return false

  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    const currentBonus = userDoc.data()?.bonusAIDresserSessions || 0

    if (currentBonus <= 0) return false

    await updateDoc(userRef, {
      bonusAIDresserSessions: currentBonus - 1,
      lastAIDresserUse: serverTimestamp(),
      lastActive: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error using bonus AI Dresser session:', error)
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

// ==================== AI DRESSER SAVED LOOKS ====================

export interface SavedLook {
  id?: string
  userId: string
  sessionId: string
  lookNumber: number
  lookName: string
  lookDescription: string
  tryOnImageUrl?: string
  items: {
    productId: string
    productName: string
    brand: string
    category: string
    price: number
    imageUrl: string
    productUrl: string
    stylingNote: string
  }[]
  totalPrice: number
  styleTip: string
  savedAt: Timestamp | null
}

// Save AI Dresser look to user's saved looks
export const saveAIDresserLook = async (
  userId: string,
  look: Omit<SavedLook, 'id' | 'userId' | 'savedAt'>
): Promise<string | null> => {
  if (!db) return null

  try {
    const savedLooksRef = collection(db, 'savedLooks')
    const docRef = await addDoc(savedLooksRef, {
      userId,
      ...look,
      savedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving AI Dresser look:', error)
    return null
  }
}

// Save a single try-on result as a SavedLook
export const saveTryOnLook = async (
  userId: string,
  product: { id?: string; name: string; brand: string; category?: string; price: number; images?: string[] },
  tryOnImageUrl: string
): Promise<string | null> => {
  if (!db) return null

  try {
    const savedLooksRef = collection(db, 'savedLooks')
    const docRef = await addDoc(savedLooksRef, {
      userId,
      sessionId: `tryon-${Date.now()}`,
      lookNumber: 1,
      lookName: `${product.brand} Try-On`,
      lookDescription: product.name,
      tryOnImageUrl,
      items: [{
        productId: product.id || '',
        productName: product.name,
        brand: product.brand,
        category: product.category || '',
        price: product.price,
        imageUrl: product.images?.[0] || '',
        productUrl: `/shop/${product.id}`,
        stylingNote: '',
      }],
      totalPrice: product.price,
      styleTip: '',
      savedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving try-on look:', error)
    return null
  }
}

// Get user's saved AI Dresser looks
export const getSavedLooks = async (userId: string): Promise<SavedLook[]> => {
  if (!db) return []

  try {
    const savedLooksRef = collection(db, 'savedLooks')
    const q = query(
      savedLooksRef,
      where('userId', '==', userId),
      orderBy('savedAt', 'desc')
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SavedLook))
  } catch (error) {
    console.error('Error fetching saved looks:', error)
    return []
  }
}

// Delete a saved look
export const deleteSavedLook = async (lookId: string): Promise<boolean> => {
  if (!db) return false

  try {
    await deleteDoc(doc(db, 'savedLooks', lookId))
    return true
  } catch (error) {
    console.error('Error deleting saved look:', error)
    return false
  }
}

// Check if a look is already saved (by look number and session)
export const isLookSaved = async (
  userId: string,
  sessionId: string,
  lookNumber: number
): Promise<string | null> => {
  if (!db) return null

  try {
    const savedLooksRef = collection(db, 'savedLooks')
    const q = query(
      savedLooksRef,
      where('userId', '==', userId),
      where('sessionId', '==', sessionId),
      where('lookNumber', '==', lookNumber)
    )
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      return snapshot.docs[0].id
    }
    return null
  } catch (error) {
    console.error('Error checking if look is saved:', error)
    return null
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

// Check if a user has purchased a specific product
export const hasUserPurchasedProduct = async (userId: string, productId: string): Promise<boolean> => {
  if (!db || !userId) return false

  try {
    // Check orders for this user
    const ordersRef = collection(db, 'orders')
    const ordersQuery = query(
      ordersRef,
      where('userId', '==', userId),
      where('status', 'in', ['delivered', 'shipped', 'processing', 'confirmed'])
    )
    const ordersSnapshot = await getDocs(ordersQuery)

    // Check if any order contains the product
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data() as FirestoreOrder
      const hasProduct = orderData.items?.some(item => item.productId === productId)
      if (hasProduct) return true
    }

    return false
  } catch (error) {
    console.error('Error checking purchase history:', error)
    return false
  }
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

    // Check if this is a verified purchase
    const isVerifiedPurchase = await hasUserPurchasedProduct(userId, productId)

    const reviewData: Omit<Review, 'id'> = {
      productId,
      userId,
      userName,
      rating,
      title,
      comment,
      verified: isVerifiedPurchase,
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

// Delete a review (admin)
export const deleteReview = async (reviewId: string): Promise<boolean> => {
  if (!db) return false

  try {
    const reviewRef = doc(db, 'reviews', reviewId)
    await deleteDoc(reviewRef)
    return true
  } catch (error) {
    console.error('Error deleting review:', error)
    return false
  }
}

// ==================== PRODUCTS (Admin CRUD) ====================

export interface FirestoreProduct {
  id?: string
  name: string
  brand: string
  category: 'clothes' | 'accessories' | 'shoes' | 'fragrance'
  subcategory: string
  price: number
  originalPrice?: number
  description: string
  images: string[]
  colors: string[]
  sizes: string[]
  gender: 'male' | 'female' | 'unisex'
  tags: string[]
  inStock: boolean
  stockQty: number
  stockBySize?: Record<string, number> // e.g., { 'S': 5, 'M': 10, 'L': 3 }
  featured: boolean
  giftSuitable: boolean
  occasions: string[]
  style: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// Get all products from Firestore
export const getFirestoreProducts = async (): Promise<FirestoreProduct[]> => {
  if (!db) return []

  try {
    const productsRef = collection(db, 'products')
    const q = query(productsRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreProduct[]
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

// Get single product
export const getFirestoreProduct = async (productId: string): Promise<FirestoreProduct | null> => {
  if (!db) return null

  try {
    const productRef = doc(db, 'products', productId)
    const productDoc = await getDoc(productRef)

    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() } as FirestoreProduct
    }
    return null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Helper to remove undefined values (Firestore doesn't accept undefined)
const removeUndefinedFields = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value
    }
  }
  return cleaned as Partial<T>
}

// Create new product (with optional custom ID)
export const createProduct = async (
  product: Omit<FirestoreProduct, 'id' | 'createdAt' | 'updatedAt'>,
  customId?: string
): Promise<{ success: boolean; id?: string; error?: string }> => {
  if (!db) return { success: false, error: 'Database not configured' }

  try {
    const cleanedProduct = removeUndefinedFields(product)
    const productData = {
      ...cleanedProduct,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    if (customId) {
      // Use custom ID with setDoc
      const productRef = doc(db, 'products', customId)
      // Check if product with this ID already exists
      const existingDoc = await getDoc(productRef)
      if (existingDoc.exists()) {
        return { success: false, error: 'A product with this ID already exists' }
      }
      await setDoc(productRef, productData)
      return { success: true, id: customId }
    } else {
      // Auto-generate ID with addDoc
      const productsRef = collection(db, 'products')
      const docRef = await addDoc(productsRef, productData)
      return { success: true, id: docRef.id }
    }
  } catch (error) {
    console.error('Error creating product:', error)
    return { success: false, error: 'Failed to create product' }
  }
}

// Update product
export const updateProduct = async (
  productId: string,
  data: Partial<FirestoreProduct>
): Promise<boolean> => {
  if (!db) return false

  try {
    const productRef = doc(db, 'products', productId)
    const cleanedData = removeUndefinedFields(data)
    await updateDoc(productRef, {
      ...cleanedData,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error updating product:', error)
    return false
  }
}

// Delete product
export const deleteProduct = async (productId: string): Promise<boolean> => {
  if (!db) return false

  try {
    const productRef = doc(db, 'products', productId)
    await deleteDoc(productRef)
    return true
  } catch (error) {
    console.error('Error deleting product:', error)
    return false
  }
}

// Get single product by ID from Firestore
export const getFirestoreProductById = async (productId: string): Promise<FirestoreProduct | null> => {
  if (!db) return null

  try {
    const productRef = doc(db, 'products', productId)
    const productSnap = await getDoc(productRef)

    if (productSnap.exists()) {
      const data = productSnap.data()
      return {
        id: productSnap.id,
        name: data.name || '',
        brand: data.brand || '',
        category: data.category || 'clothes',
        subcategory: data.subcategory || '',
        price: data.price || 0,
        originalPrice: data.originalPrice,
        description: data.description || '',
        images: data.images || [],
        colors: data.colors || [],
        sizes: data.sizes || [],
        gender: data.gender || 'unisex',
        tags: data.tags || [],
        inStock: data.inStock !== false,
        stockQty: data.stockQty || 0,
        featured: data.featured || false,
        giftSuitable: data.giftSuitable || false,
        occasions: data.occasions || [],
        style: data.style || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as FirestoreProduct
    }
    return null
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return null
  }
}

// Delete user data from Firestore
export const deleteUserData = async (userId: string): Promise<boolean> => {
  if (!db) return false
  try {
    // Delete user document
    await deleteDoc(doc(db, 'users', userId))

    // Delete user's wishlist
    try {
      await deleteDoc(doc(db, 'wishlists', userId))
    } catch {
      // Wishlist might not exist
    }

    // Note: Orders are kept for record-keeping purposes
    // Reviews could optionally be anonymized instead of deleted

    return true
  } catch (error) {
    console.error('Error deleting user data:', error)
    return false
  }
}

// ==================== TRY-ON CREDITS ====================

const MONTHLY_TRY_ON_CREDITS = 20
const CREDITS_PER_PURCHASE = 10

export const getTryOnCredits = async (userId: string): Promise<{ credits: number; resetMonth: string }> => {
  if (!db) return { credits: MONTHLY_TRY_ON_CREDITS, resetMonth: '' }
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    if (!userDoc.exists()) {
      await setDoc(userRef, { tryOnCredits: MONTHLY_TRY_ON_CREDITS, tryOnCreditsResetMonth: currentMonth }, { merge: true })
      return { credits: MONTHLY_TRY_ON_CREDITS, resetMonth: currentMonth }
    }

    const data = userDoc.data()
    const savedMonth = data?.tryOnCreditsResetMonth || ''

    if (savedMonth !== currentMonth) {
      await updateDoc(userRef, { tryOnCredits: MONTHLY_TRY_ON_CREDITS, tryOnCreditsResetMonth: currentMonth })
      return { credits: MONTHLY_TRY_ON_CREDITS, resetMonth: currentMonth }
    }

    const credits = data?.tryOnCredits ?? MONTHLY_TRY_ON_CREDITS
    return { credits, resetMonth: currentMonth }
  } catch (error) {
    console.error('Error getting try-on credits:', error)
    return { credits: MONTHLY_TRY_ON_CREDITS, resetMonth: '' }
  }
}

export const consumeTryOnCredit = async (userId: string): Promise<{ success: boolean; creditsLeft: number; error?: string }> => {
  if (!db) return { success: true, creditsLeft: 99 }
  try {
    const { credits } = await getTryOnCredits(userId)
    if (credits <= 0) return { success: false, creditsLeft: 0, error: 'No credits left this month' }
    const userRef = doc(db, 'users', userId)
    // Use setDoc with merge so it works even if the doc doesn't exist yet
    await setDoc(userRef, { tryOnCredits: credits - 1 }, { merge: true })
    return { success: true, creditsLeft: credits - 1 }
  } catch (error) {
    console.error('Error consuming try-on credit:', error)
    return { success: false, creditsLeft: 0, error: 'Failed to use credit' }
  }
}

export const addTryOnCreditsForPurchase = async (userId: string, itemCount: number): Promise<boolean> => {
  if (!db || !userId) return false
  try {
    const { credits } = await getTryOnCredits(userId)
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, { tryOnCredits: credits + itemCount * CREDITS_PER_PURCHASE })
    return true
  } catch (error) {
    console.error('Error adding try-on credits:', error)
    return false
  }
}

// ==================== TRY-ON RESULTS ====================

export interface TryOnResult {
  id?: string
  productId: string
  userId: string
  imageUrl: string
  createdAt: Timestamp | null
}

export const saveTryOnResult = async (
  productId: string,
  userId: string,
  imageUrl: string
): Promise<boolean> => {
  if (!db) return false
  try {
    await addDoc(collection(db, 'tryOnResults'), {
      productId,
      userId,
      imageUrl,
      createdAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error saving try-on result:', error)
    return false
  }
}

export const getAllTryOns = async (maxResults = 200): Promise<TryOnResult[]> => {
  if (!db) return []
  try {
    const colRef = collection(db, 'tryOnResults')
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(maxResults))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as TryOnResult[]
  } catch (error) {
    console.error('Error fetching all try-on results:', error)
    return []
  }
}

export const deleteTryOnResult = async (id: string): Promise<boolean> => {
  if (!db) return false
  try {
    await deleteDoc(doc(db, 'tryOnResults', id))
    return true
  } catch (error) {
    console.error('Error deleting try-on result:', error)
    return false
  }
}

export const getProductTryOns = async (productId: string, maxResults = 24): Promise<TryOnResult[]> => {
  if (!db) return []
  try {
    const colRef = collection(db, 'tryOnResults')
    // No orderBy to avoid needing a composite index
    const q = query(colRef, where('productId', '==', productId), limit(maxResults))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as TryOnResult[]
  } catch (error) {
    console.error('Error fetching try-on results:', error)
    return []
  }
}

// ==================== SHIPPING SETTINGS ====================

export interface ShippingRate {
  id: string
  region: string
  fee: number
}

export interface ShippingSettings {
  rates: ShippingRate[]
  freeShippingThreshold: number
  updatedAt?: string
}

const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  rates: [
    { id: 'metro-manila', region: 'Metro Manila', fee: 100 },
    { id: 'luzon', region: 'Luzon (Provincial)', fee: 150 },
    { id: 'visayas', region: 'Visayas', fee: 200 },
    { id: 'mindanao', region: 'Mindanao', fee: 250 },
  ],
  freeShippingThreshold: 3000,
}

// Get shipping settings
export const getShippingSettings = async (): Promise<ShippingSettings> => {
  if (!db) return DEFAULT_SHIPPING_SETTINGS
  try {
    const docRef = doc(db, 'settings', 'shipping')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data() as ShippingSettings
    }
    return DEFAULT_SHIPPING_SETTINGS
  } catch (error) {
    console.error('Error getting shipping settings:', error)
    return DEFAULT_SHIPPING_SETTINGS
  }
}

// Update shipping settings
export const updateShippingSettings = async (settings: ShippingSettings): Promise<boolean> => {
  if (!db) return false
  try {
    const docRef = doc(db, 'settings', 'shipping')
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    })
    return true
  } catch (error) {
    console.error('Error updating shipping settings:', error)
    return false
  }
}

export interface PaymentSettings {
  gcashNumber: string
  gcashName: string
  bankName: string
  bankAccount: string
  bankAccountName: string
  updatedAt?: string
}

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  gcashNumber: '',
  gcashName: '',
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
}

export const getPaymentSettings = async (): Promise<PaymentSettings> => {
  if (!db) return DEFAULT_PAYMENT_SETTINGS
  try {
    const docRef = doc(db, 'settings', 'payment')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data() as PaymentSettings
    }
    return DEFAULT_PAYMENT_SETTINGS
  } catch (error) {
    console.error('Error getting payment settings:', error)
    return DEFAULT_PAYMENT_SETTINGS
  }
}

export const updatePaymentSettings = async (settings: PaymentSettings): Promise<boolean> => {
  if (!db) return false
  try {
    const docRef = doc(db, 'settings', 'payment')
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    })
    return true
  } catch (error) {
    console.error('Error updating payment settings:', error)
    return false
  }
}

// ==================== ORDER NOTIFICATIONS ====================

export interface OrderNotification {
  id?: string
  userId: string
  orderId: string
  message: string
  status: string
  read: boolean
  createdAt: Timestamp | null
}

export const createOrderNotification = async (
  userId: string,
  orderId: string,
  status: string,
  message: string
): Promise<boolean> => {
  if (!db || !userId) return false
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      orderId,
      message,
      status,
      read: false,
      createdAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('Error creating notification:', error)
    return false
  }
}

export const getUnreadNotifications = async (userId: string): Promise<OrderNotification[]> => {
  if (!db || !userId) return []
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      limit(20)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as OrderNotification[]
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export const getAllNotifications = async (userId: string): Promise<OrderNotification[]> => {
  if (!db || !userId) return []
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(30)
    )
    const snap = await getDocs(q)
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() })) as OrderNotification[]
  } catch (error) {
    console.error('Error fetching all notifications:', error)
    return []
  }
}

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  if (!db) return
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true })
  } catch (error) {
    console.error('Error marking notification read:', error)
  }
}

// Real-time listener — returns unsubscribe fn
// NOTE: no orderBy to avoid requiring a composite Firestore index — sort client-side
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: OrderNotification[]) => void
): (() => void) => {
  if (!db || !userId) return () => {}
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    limit(30)
  )
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as OrderNotification[]
      // Sort newest first client-side
      items.sort((a, b) => {
        const aMs = (a.createdAt as any)?.toMillis?.() ?? 0
        const bMs = (b.createdAt as any)?.toMillis?.() ?? 0
        return bMs - aMs
      })
      callback(items)
    },
    (err) => {
      console.error('Notification listener error:', err)
    }
  )
}

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  if (!db || !userId) return
  try {
    const notifications = await getUnreadNotifications(userId)
    await Promise.all(notifications.map(n => n.id ? markNotificationRead(n.id) : Promise.resolve()))
  } catch (error) {
    console.error('Error marking all notifications read:', error)
  }
}

// ==================== PUSH SUBSCRIPTIONS ====================

export const savePushSubscription = async (userId: string, subscription: PushSubscriptionJSON): Promise<void> => {
  if (!db || !userId) return
  try {
    const endpoint = subscription.endpoint!
    const subRef = doc(db, 'pushSubscriptions', `${userId}_${btoa(endpoint).slice(0, 40)}`)
    await setDoc(subRef, {
      userId,
      subscription,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error saving push subscription:', error)
  }
}

export const deletePushSubscription = async (userId: string, endpoint: string): Promise<void> => {
  if (!db || !userId) return
  try {
    const subRef = doc(db, 'pushSubscriptions', `${userId}_${btoa(endpoint).slice(0, 40)}`)
    await deleteDoc(subRef)
  } catch (error) {
    console.error('Error deleting push subscription:', error)
  }
}

export const getPushSubscriptions = async (userId: string): Promise<PushSubscriptionJSON[]> => {
  if (!db || !userId) return []
  try {
    const q = query(collection(db, 'pushSubscriptions'), where('userId', '==', userId))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data().subscription as PushSubscriptionJSON)
  } catch (error) {
    console.error('Error fetching push subscriptions:', error)
    return []
  }
}
