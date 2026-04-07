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
  const lastItem = items[items.length - 1]
  const parentItem = items.length >= 2 ? items[items.length - 2] : null

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-sm ${className}`}>
      {/* Mobile: single line — parent › current */}
      <div className="flex md:hidden items-center gap-1 overflow-hidden whitespace-nowrap">
        {parentItem && (
          <>
            {parentItem.href ? (
              <Link href={parentItem.href} className="text-gray-400 hover:text-gold transition-colors flex-shrink-0 text-xs">
                {parentItem.label}
              </Link>
            ) : (
              <span className="text-gray-400 flex-shrink-0 text-xs">{parentItem.label}</span>
            )}
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
          </>
        )}
        <span className="text-navy font-semibold text-xs truncate">
          {lastItem?.label}
        </span>
      </div>

      {/* Desktop: full breadcrumb */}
      <ol className="hidden md:flex items-center gap-1">
        <li className="flex items-center">
          <Link href="/" className="text-gray-400 hover:text-gold transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
            {item.href ? (
              <Link href={item.href} className="text-gray-400 hover:text-gold transition-colors whitespace-nowrap">
                {item.label}
              </Link>
            ) : (
              <span className="text-navy font-medium truncate max-w-[240px]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
