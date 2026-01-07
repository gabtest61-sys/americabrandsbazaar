// AI Dresser API Integration
// Connects to n8n webhooks for AI-powered styling recommendations

const WEBHOOK_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''

export interface AIDresserAccessResponse {
  success: boolean
  access_granted: boolean
  session_id?: string
  session_type?: 'daily_free' | 'bonus'
  user?: {
    id: string
    name: string
    email: string
  }
  usage_info?: {
    sessions_remaining_today: number
    bonus_sessions: number
    total_purchases: number
  }
  error_code?: 'LOGIN_REQUIRED' | 'NO_SESSIONS_AVAILABLE'
  message?: string
  unlock_options?: Array<{
    type: string
    title: string
    description: string
    cta?: string
    action_url?: string
    next_reset?: string
  }>
  promo_message?: string
  action?: string
  redirect_url?: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: 'single' | 'multiple' | 'text'
  options?: Array<{
    value: string
    label: string
    icon?: string
  }>
  conditional?: {
    depends_on: string
    show_if: string[]
  }
}

export interface QuizSessionResponse {
  success: boolean
  session_id: string
  quiz_flow: string
  current_step: number
  total_steps: number
  question: QuizQuestion
  progress_percentage: number
}

export interface LookItem {
  product_id: string
  product_name: string
  brand: string
  category: string
  price: number
  image_url: string
  product_url: string
  styling_note: string
}

export interface Look {
  look_number: number
  look_name: string
  look_description: string
  items: LookItem[]
  total_price: number
  style_tip: string
}

export interface RecommendationsResponse {
  success: boolean
  session_id: string
  user_id: string
  stylist_message: string
  looks: Look[]
  stats: {
    total_looks: number
    total_items: number
    average_look_price: number
    products_analyzed: number
  }
  based_on: Record<string, string>
  actions: {
    add_all_to_cart: { endpoint: string; method: string }
    add_single_item: { endpoint: string; method: string }
    save_to_wishlist: { endpoint: string; method: string }
    share_look: { messenger: string; whatsapp: string }
  }
}

export interface CollectedData {
  purpose?: 'personal' | 'gift'
  gender?: string
  style?: string
  occasion?: string
  budget?: string
  color?: string
  recipient?: string
  relationship?: string
  event_type?: string
}

// Check if user can access AI Dresser
export const checkAIDresserAccess = async (
  authToken: string,
  userId: string
): Promise<AIDresserAccessResponse> => {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/ai-dresser/check-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_token: authToken, user_id: userId })
    })
    return await response.json()
  } catch (error) {
    console.error('Error checking AI Dresser access:', error)
    return {
      success: false,
      access_granted: false,
      error_code: 'LOGIN_REQUIRED',
      message: 'Unable to connect to AI Dresser service'
    }
  }
}

// Start a quiz session
export const startQuizSession = async (
  sessionId: string,
  userId: string,
  purpose: 'personal' | 'gift'
): Promise<QuizSessionResponse | null> => {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/ai-dresser/start-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, user_id: userId, purpose })
    })
    return await response.json()
  } catch (error) {
    console.error('Error starting quiz session:', error)
    return null
  }
}

// Submit quiz answer and get next question
export const submitQuizAnswer = async (
  sessionId: string,
  userId: string,
  questionId: string,
  answer: string | string[],
  collectedData: CollectedData
): Promise<QuizSessionResponse | null> => {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/ai-dresser/submit-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        question_id: questionId,
        answer,
        collected_data: collectedData
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Error submitting quiz answer:', error)
    return null
  }
}

// Product type for sending to n8n
export interface ProductForAI {
  id: string
  name: string
  brand: string
  price: number
  category: string
  subcategory?: string
  colors?: string[]
  style?: string[]
  images: string[]
  gender?: string
  giftSuitable?: boolean
}

// Get AI recommendations from n8n (sends products from frontend)
export const getAIRecommendations = async (
  sessionId: string,
  userId: string,
  preferences: CollectedData,
  products: ProductForAI[]
): Promise<RecommendationsResponse | null> => {
  if (!WEBHOOK_BASE) {
    console.log('n8n webhook not configured, skipping AI recommendations')
    return null
  }

  try {
    const response = await fetch(`${WEBHOOK_BASE}/ai-dresser/get-recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        preferences: {
          purpose: preferences.purpose,
          gender: preferences.gender,
          style: preferences.style,
          occasion: preferences.occasion,
          budget: preferences.budget,
          color: preferences.color
        },
        products: products
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Error getting AI recommendations:', error)
    return null
  }
}

// Add look items to cart
export const addLookToCart = async (
  sessionId: string,
  userId: string,
  look: Look,
  actionType: 'add_all' | 'add_single' = 'add_all'
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/ai-dresser/add-to-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        action_type: actionType,
        look_number: look.look_number,
        look_name: look.look_name,
        items: look.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: 1
        })),
        total_price: look.total_price,
        source: 'ai_dresser'
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Error adding to cart:', error)
    return { success: false, message: 'Failed to add items to cart' }
  }
}

// Save look to wishlist
export const saveLookToWishlist = async (
  sessionId: string,
  userId: string,
  look: Look
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/ai-dresser/save-wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        look_number: look.look_number,
        look_name: look.look_name,
        items: look.items,
        total_price: look.total_price
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Error saving to wishlist:', error)
    return { success: false, message: 'Failed to save to wishlist' }
  }
}

// Get share URLs for a look
export const getShareUrls = async (
  sessionId: string,
  userId: string,
  look: Look
): Promise<{
  success: boolean
  share_options?: {
    messenger: { url: string; label: string }
    whatsapp: { url: string; label: string }
    copy_link: { url: string; label: string }
  }
}> => {
  try {
    const response = await fetch(`${WEBHOOK_BASE}/ai-dresser/share-look`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        look_number: look.look_number,
        look_name: look.look_name,
        items: look.items,
        total_price: look.total_price
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Error getting share URLs:', error)
    return { success: false }
  }
}
