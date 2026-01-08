'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${className}`}>
      <ol className="flex items-center flex-wrap gap-1">
        {/* Home link */}
        <li className="flex items-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-gold transition-colors flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>

        {/* Breadcrumb items */}
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-400 hover:text-gold transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-navy font-medium truncate max-w-[200px]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
