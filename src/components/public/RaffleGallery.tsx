'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'

interface RaffleGalleryProps {
  imageUrls: string[]
  title: string
}

export function RaffleGallery({ imageUrls, title }: RaffleGalleryProps) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const prev = useCallback(() =>
    setActive((i) => (i - 1 + imageUrls.length) % imageUrls.length), [imageUrls.length])

  const next = useCallback(() =>
    setActive((i) => (i + 1) % imageUrls.length), [imageUrls.length])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, prev, next])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  if (imageUrls.length === 0) {
    return (
      <div
        className="w-full rounded-xl overflow-hidden bg-surface-container shadow-modal flex items-center justify-center"
        style={{ aspectRatio: '16/9' }}
      >
        <span className="material-symbols-outlined text-7xl text-outline">confirmation_number</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Imagen principal */}
        <div
          className="relative rounded-xl overflow-hidden bg-surface-container shadow-modal cursor-zoom-in group"
          style={{ aspectRatio: '16/9' }}
          onClick={() => setLightbox(true)}
        >
          <Image
            src={imageUrls[active]}
            alt={`${title} - imagen ${active + 1}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={active === 0}
          />

          {/* Hint ampliar */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
            <span className="material-symbols-outlined text-white text-3xl drop-shadow opacity-0 group-hover:opacity-100 transition-opacity">
              zoom_in
            </span>
          </div>

          {/* Flechas si hay más de 1 */}
          {imageUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {imageUrls.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActive(i) }}
                    className={`h-1.5 rounded-full transition-all ${i === active ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Contador de imágenes */}
          {imageUrls.length > 1 && (
            <span className="absolute bottom-2 right-3 text-white/70 text-xs tabular-nums">
              {active + 1}/{imageUrls.length}
            </span>
          )}
        </div>

        {/* Miniaturas */}
        {imageUrls.length > 1 && (
          <div className="flex gap-2 overflow-x-auto py-1 px-0.5">
            {imageUrls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                className={`relative shrink-0 rounded-md overflow-hidden transition-all ${
                  i === active ? 'ring-2 ring-primary ring-offset-2' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ width: 64, height: 40 }}
              >
                <Image src={url} alt={`Miniatura ${i + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox portal */}
      {lightbox && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(false)}
        >
          {/* Imagen ampliada */}
          <div
            className="relative w-full h-full max-w-5xl mx-auto p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full" style={{ maxHeight: 'calc(100vh - 120px)', aspectRatio: '16/9' }}>
              <Image
                src={imageUrls[active]}
                alt={`${title} - imagen ${active + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Flechas lightbox */}
            {imageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_right</span>
                </button>
              </>
            )}
          </div>

          {/* Barra superior del lightbox */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
            <p className="text-white/80 text-sm font-semibold truncate">{title}</p>
            <div className="flex items-center gap-3">
              {imageUrls.length > 1 && (
                <span className="text-white/60 text-sm tabular-nums">
                  {active + 1} / {imageUrls.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => setLightbox(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
          </div>

          {/* Miniaturas en lightbox */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {imageUrls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative shrink-0 rounded overflow-hidden transition-all ${
                    i === active ? 'ring-2 ring-white' : 'opacity-40 hover:opacity-80'
                  }`}
                  style={{ width: 56, height: 36 }}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Hint teclado */}
          <p className="absolute bottom-2 right-4 text-white/30 text-xs hidden sm:block">
            ← → navegar · ESC cerrar
          </p>
        </div>,
        document.body
      )}
    </>
  )
}
