'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shirt, Watch, Footprints, ArrowUpRight } from 'lucide-react'
import { getFirestoreProducts } from '@/lib/firestore'

const categoryConfig = [
  {
    id: 'clothes',
    name: 'Clothes',
    description: 'Premium branded apparel',
    icon: Shirt,
    href: '/shop?category=clothes',
    image: '/categories/clothes.jpg',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    description: 'Designer accessories',
    icon: Watch,
    href: '/shop?category=accessories',
    image: '/categories/accessories.jpg',
    color: 'from-gold to-amber-500',
  },
  {
    id: 'shoes',
    name: 'Shoes',
    description: 'Premium footwear',
    icon: Footprints,
    href: '/shop?category=shoes',
    image: '/categories/shoes.jpg',
    color: 'from-slate-600 to-slate-800',
  },
]

export default function Categories() {
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    clothes: 0,
    accessories: 0,
    shoes: 0,
  })

  useEffect(() => {
    const loadCounts = async () => {
      // Load from Firestore only
      const products = await getFirestoreProducts()

      const counts = {
        clothes: products.filter(p => p.category === 'clothes').length,
        accessories: products.filter(p => p.category === 'accessories').length,
        shoes: products.filter(p => p.category === 'shoes').length,
      }
      setCategoryCounts(counts)
    }

    loadCounts()
  }, [])
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <span className="text-gold font-semibold text-sm tracking-wider uppercase mb-2 block">
              Collections
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-navy">
              Shop by Category
            </h2>
          </div>
          <p className="text-gray-500 max-w-md">
            Explore our curated collection of premium brands across clothing, accessories, and footwear
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categoryConfig.map((category) => {
            const Icon = category.icon
            const count = categoryCounts[category.id] || 0
            return (
              <Link
                key={category.id}
                href={category.href}
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] md:aspect-[3/4]"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} transition-all duration-500`} />

                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500" />

                {/* Content */}
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                  {/* Top - Icon */}
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-2">
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Bottom - Info */}
                  <div>
                    <div className="mb-4">
                      <span className="text-white/60 text-sm">{count} {count === 1 ? 'item' : 'items'}</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:translate-x-2 transition-transform duration-300">
                      {category.name}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
