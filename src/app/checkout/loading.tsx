import { Loader2 } from 'lucide-react'

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-navy py-6">
        <div className="container-max px-4 md:px-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse" />
            <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="container-max px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form Skeleton */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {/* Steps */}
              <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse hidden md:block" />
                  </div>
                ))}
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Skeleton */}
          <div className="lg:w-96">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />

              {/* Items */}
              <div className="space-y-4 mb-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      <div className="fixed bottom-4 right-4 bg-navy text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading checkout...</span>
      </div>
    </div>
  )
}
