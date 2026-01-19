'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  getProductReviews,
  addReview,
  markReviewHelpful,
  Review
} from '@/lib/firestore'

interface ReviewSectionProps {
  productId: string
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const { user, isLoggedIn } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [helpedReviews, setHelpedReviews] = useState<Set<string>>(new Set())

  // Form state
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    loadReviews()
  }, [productId])

  const loadReviews = async () => {
    setIsLoading(true)
    const data = await getProductReviews(productId)
    setReviews(data)
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError('')
    setIsSubmitting(true)

    const result = await addReview(
      productId,
      user.id,
      user.name || 'Anonymous',
      rating,
      title,
      comment
    )

    if (result.success) {
      setShowForm(false)
      setTitle('')
      setComment('')
      setRating(5)
      await loadReviews()
    } else {
      setError(result.error || 'Failed to submit review')
    }

    setIsSubmitting(false)
  }

  const handleHelpful = async (reviewId: string) => {
    if (helpedReviews.has(reviewId)) return

    const success = await markReviewHelpful(reviewId)
    if (success) {
      setHelpedReviews(prev => new Set([...prev, reviewId]))
      setReviews(prev =>
        prev.map(r =>
          r.id === reviewId ? { ...r, helpful: (r.helpful || 0) + 1 } : r
        )
      )
    }
  }

  const averageRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0
      ? Math.round((reviews.filter(r => r.rating === stars).length / reviews.length) * 100)
      : 0
  }))

  return (
    <section className="mt-16 bg-white rounded-2xl p-6 md:p-8">
      <h2 className="text-2xl font-bold text-navy mb-6">Customer Reviews</h2>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Rating Summary */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="text-4xl font-bold text-navy">{averageRating || '-'}</span>
            <div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= averageRating
                        ? 'text-gold-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">{reviews.length} reviews</p>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {ratingDistribution.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-2 text-sm">
              <span className="w-12">{stars} stars</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gold-400 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-gray-500">{count}</span>
            </div>
          ))}
        </div>

        {/* Write Review Button */}
        <div className="flex items-center justify-center md:justify-end">
          {isLoggedIn ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-gold text-navy font-semibold rounded-full hover:bg-gold-400 transition-colors"
            >
              Write a Review
            </button>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              Please log in to write a review
            </p>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showForm && isLoggedIn && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-navy mb-4">Write Your Review</h3>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-gold-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your experience"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
              required
            />
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold resize-none"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gold text-navy font-semibold rounded-full hover:bg-gold-400 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading reviews...</div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-navy">{review.userName}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-gold-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.verified && (
                        <span className="text-xs text-green-600 font-medium">Verified Purchase</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-400">
                  {review.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                </span>
              </div>

              <h4 className="font-semibold text-navy mb-2">{review.title}</h4>
              <p className="text-gray-600 mb-3">{review.comment}</p>

              <button
                onClick={() => review.id && handleHelpful(review.id)}
                disabled={review.id ? helpedReviews.has(review.id) : true}
                className={`flex items-center gap-2 text-sm ${
                  review.id && helpedReviews.has(review.id)
                    ? 'text-gold'
                    : 'text-gray-500 hover:text-gold'
                } transition-colors`}
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful ({review.helpful || 0})
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
        </div>
      )}
    </section>
  )
}
