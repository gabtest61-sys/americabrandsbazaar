import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] bg-navy flex flex-col items-center justify-center">
      {/* Logo Animation */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-white shadow-2xl flex items-center justify-center animate-pulse">
          <span className="text-navy font-bold text-2xl">LGM</span>
        </div>
        {/* Spinning ring */}
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-gold animate-spin" />
      </div>

      {/* Brand Name */}
      <h1 className="text-white text-xl font-bold tracking-wider mb-2">LGM APPAREL</h1>
      <p className="text-gold/80 text-sm tracking-[0.2em] uppercase mb-8">Premium Brands</p>

      {/* Loading indicator */}
      <div className="flex items-center gap-2 text-white/60">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  )
}
