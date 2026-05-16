'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface StickyBuyCTAProps {
  ticketPrice: number
  available: number
}

export function StickyBuyCTA({ ticketPrice, available }: StickyBuyCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById('buy-form')
    if (!target) return

    // Show bar when buy form is out of viewport
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const scrollToBuy = () => {
    document.getElementById('buy-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      {/* Backdrop blur */}
      <div className="bg-background/95 backdrop-blur border-t border-outline-variant px-4 py-3 shadow-modal">
        <div className="flex items-center justify-between gap-3 max-w-layout mx-auto">
          <div>
            <p className="text-xs text-on-surface-variant">Precio por número</p>
            <p className="font-display font-black text-primary text-xl leading-tight">
              {formatCurrency(ticketPrice)}
            </p>
            {available <= 10 && (
              <p className="text-[10px] font-bold text-error">
                ¡Solo quedan {available}!
              </p>
            )}
          </div>
          <button
            onClick={scrollToBuy}
            className="btn-primary shrink-0 flex items-center gap-2 py-3 px-5 text-base"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              confirmation_number
            </span>
            Elegir números
          </button>
        </div>
      </div>
    </div>
  )
}
