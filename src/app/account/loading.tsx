import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Loader2 } from 'lucide-react'

export default function AccountLoading() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24">
        <div className="container-max px-4 md:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                <div>
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />

              {/* Order cards */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="fixed bottom-4 right-4 bg-navy text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading account...</span>
        </div>
      </main>
      <Footer />
    </>
  )
}
