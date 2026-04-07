import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ProductGridSkeleton } from '@/components/ProductSkeleton'
import Link from 'next/link'
import { ShoppingBag, ChevronRight } from 'lucide-react'

export default function ShopLoading() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 ">
        {/* Hero Skeleton */}
        <div className="pt-[72px]" style={{ background: '#0f1e38' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-6" />
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 max-w-full bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-[3px] bg-gradient-to-r from-gold/40 via-gold to-gold/40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Skeleton */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mb-6" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="mb-4">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Search Bar Skeleton */}
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
              </div>

              {/* Results Count Skeleton */}
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-4" />

              {/* Products Grid Skeleton */}
              <ProductGridSkeleton count={8} viewMode="grid" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
