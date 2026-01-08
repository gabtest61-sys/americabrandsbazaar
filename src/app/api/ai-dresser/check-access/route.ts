import { NextRequest, NextResponse } from 'next/server'
import { checkAIDresserDailyAccess } from '@/lib/firestore'

// SOP 6.1: Access Check Endpoint
// POST /api/ai-dresser/check-access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id } = body

    // Check if user ID is provided
    if (!user_id) {
      return NextResponse.json({
        success: false,
        access_granted: false,
        error_code: 'LOGIN_REQUIRED',
        message: 'Please log in to access the AI Dresser feature.',
        action: 'show_login',
        redirect_url: '/login?redirect=ai-dresser'
      }, { status: 401 })
    }

    // Check real Firestore access
    const accessResult = await checkAIDresserDailyAccess(user_id)

    // Generate session ID
    const sessionId = `ai_session_${Date.now()}_${Math.random().toString(36).substring(7)}`

    if (!accessResult.hasAccess) {
      return NextResponse.json({
        success: true,
        access_granted: false,
        session_id: null,
        session_type: 'none',
        usage_info: {
          sessions_remaining_today: 0,
          bonus_sessions: accessResult.bonusSessions,
          last_use: accessResult.lastUse?.toISOString() || null,
          total_usage: accessResult.usageCount
        },
        action: 'show_limit_reached',
        message: 'You\'ve used your free styling session for today. Come back tomorrow or make a purchase to earn bonus sessions!',
        next_reset: getNextMidnight().toISOString()
      })
    }

    // Access granted
    return NextResponse.json({
      success: true,
      access_granted: true,
      session_id: sessionId,
      session_type: accessResult.accessType,
      usage_info: {
        sessions_remaining_today: accessResult.accessType === 'daily_free' ? 1 : 0,
        bonus_sessions: accessResult.bonusSessions,
        last_use: accessResult.lastUse?.toISOString() || null,
        total_usage: accessResult.usageCount
      },
      action: 'start_quiz',
      message: accessResult.accessType === 'bonus'
        ? `Welcome back! Using 1 of ${accessResult.bonusSessions} bonus session${accessResult.bonusSessions > 1 ? 's' : ''}.`
        : 'Welcome! Let\'s find your perfect style.',
      endpoints: {
        start_quiz: '/api/ai-dresser/start-session',
        submit_answers: '/api/ai-dresser/submit-quiz',
        get_recommendations: '/api/ai-dresser/get-recommendations'
      }
    })
  } catch (error) {
    console.error('AI Dresser access check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Helper to get next midnight
function getNextMidnight(): Date {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return tomorrow
}
