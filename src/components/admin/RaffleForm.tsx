'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { slugify } from '@/lib/utils'
import type { Raffle, PaymentMethod, RaffleStatus } from '@/generated/prisma'

type RaffleFormData = Omit<Raffle, 'createdAt' | 'updatedAt'>

interface RaffleFormProps {
  raffle?: RaffleFormData
  mode: 'create' | 'edit'
}

interface ImageItem {
  url: string
  publicId: string
}

const MAX_IMAGES = 10

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'MERCADOPAGO', label: 'MercadoPago', icon: 'payments' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'chat' },
  { value: 'TRANSFER', label: 'Transferencia', icon: 'account_balance' },
]

const STATUS_OPTIONS: { value: RaffleStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'CLOSED', label: 'Cerrada' },
  { value: 'FINISHED', label: 'Finalizada' },
]

// ── Sub-component ─────────────────────────────────────────────────────────

function ColorPicker({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string
  value: string
  defaultValue: string
  onChange: (v: string) => void
}) {
  const active = value || defaultValue
  return (
    <div className="flex flex-col gap-2">
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={active}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-outline-variant p-0.5 bg-transparent"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
            }}
            placeholder={defaultValue}
            maxLength={7}
            className="input font-mono text-sm uppercase"
          />
        </div>
        {value && value !== defaultValue && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-on-surface-variant hover:text-error transition-colors flex items-center gap-0.5"
            title="Usar color por defecto"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
          </button>
        )}
      </div>
      {!value && (
        <p className="text-xs text-on-surface-variant opacity-60">
          Usando color por defecto ({defaultValue})
        </p>
      )}
    </div>
  )
}

export function RaffleForm({ raffle, mode }: RaffleFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(raffle?.title ?? '')
  const [slug, setSlug] = useState(raffle?.slug ?? '')
  const [description, setDescription] = useState(raffle?.description ?? '')

  // Multi-image state: zip imageUrls + cloudinaryIds into an array of ImageItem
  const [images, setImages] = useState<ImageItem[]>(() => {
    const urls = raffle?.imageUrls ?? []
    const ids = raffle?.cloudinaryIds ?? []
    return urls.map((url, i) => ({ url, publicId: ids[i] ?? '' }))
  })
  const [uploadingCount, setUploadingCount] = useState(0)
  const dragIndex = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((i: number) => {
    dragIndex.current = i
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, i: number) => {
    e.preventDefault()
    setDragOverIndex(i)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const from = dragIndex.current
    if (from === null || from === dropIndex) {
      dragIndex.current = null
      setDragOverIndex(null)
      return
    }
    setImages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })
    dragIndex.current = null
    setDragOverIndex(null)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragIndex.current = null
    setDragOverIndex(null)
  }, [])

  const [totalTickets, setTotalTickets] = useState(raffle?.totalTickets ?? 100)
  const [ticketPrice, setTicketPrice] = useState(raffle?.ticketPrice ?? 1000)
  const [prizes, setPrizes] = useState<string[]>(raffle?.prizes?.length ? raffle.prizes : [''])
  const [drawDate, setDrawDate] = useState(
    raffle?.drawDate ? new Date(raffle.drawDate).toISOString().slice(0, 16) : ''
  )
  const [status, setStatus] = useState<RaffleStatus>(raffle?.status ?? 'DRAFT')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    raffle?.paymentMethods ?? ['MERCADOPAGO']
  )
  const [whatsappNumber, setWhatsappNumber] = useState(raffle?.whatsappNumber ?? '')
  const [bankHolder, setBankHolder] = useState(raffle?.bankHolder ?? '')
  const [bankCbu, setBankCbu] = useState(raffle?.bankCbu ?? '')
  const [bankAlias, setBankAlias] = useState(raffle?.bankAlias ?? '')
  const [bankNote, setBankNote] = useState(raffle?.bankNote ?? '')
  const [primaryColor, setPrimaryColor] = useState(raffle?.primaryColor ?? '')
  const [secondaryColor, setSecondaryColor] = useState(raffle?.secondaryColor ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (mode === 'create') setSlug(slugify(value))
  }

  const togglePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    )
  }

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const available = MAX_IMAGES - images.length
    const toUpload = files.slice(0, available)

    setUploadingCount((c) => c + toUpload.length)

    await Promise.all(
      toUpload.map(async (file) => {
        try {
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
          const data = await res.json()
          setImages((prev) => [...prev, { url: data.url, publicId: data.publicId }])
        } catch {
          setError('Error al subir una o más imágenes')
        } finally {
          setUploadingCount((c) => c - 1)
        }
      })
    )

    // reset input so same files can be selected again
    e.target.value = ''
  }

  const removeImage = async (index: number) => {
    const img = images[index]
    setImages((prev) => prev.filter((_, i) => i !== index))
    if (img.publicId) {
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: img.publicId }),
      }).catch(() => null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paymentMethods.length === 0) {
      setError('Seleccioná al menos un método de pago')
      return
    }
    setLoading(true)
    setError(null)

    const body = {
      title, slug, description,
      imageUrls: images.map((img) => img.url),
      cloudinaryIds: images.map((img) => img.publicId),
      totalTickets: Number(totalTickets),
      ticketPrice: Number(ticketPrice),
      prizes: prizes.filter(p => p.trim() !== ''),
      drawDate: new Date(drawDate).toISOString(),
      status,
      paymentMethods,
      whatsappNumber: whatsappNumber || undefined,
      bankHolder: bankHolder || undefined,
      bankCbu: bankCbu || undefined,
      bankAlias: bankAlias || undefined,
      bankNote: bankNote || undefined,
      primaryColor: primaryColor || null,
      secondaryColor: secondaryColor || null,
    }

    const res = await fetch(
      mode === 'create' ? '/api/admin/rifas' : `/api/admin/rifas/${raffle!.id}`,
      {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (res.ok) {
      router.push('/admin/rifas')
      router.refresh()
    } else {
      const text = await res.text()
      let msg = 'Error al guardar'
      try {
        const data = JSON.parse(text)
        msg = data.error ?? msg
      } catch {
        if (text) msg = text.slice(0, 120)
      }
      setError(msg)
    }

    setLoading(false)
  }

  const showWhatsApp = paymentMethods.includes('WHATSAPP')
  const showTransfer = paymentMethods.includes('TRANSFER')

  // inline helper — avoids importing buildRaffleTheme just for the preview chip
  function isLight(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {/* Imágenes */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">photo_library</span>
          Imágenes
        </h2>
        <p className="text-xs text-on-surface-variant mb-4">
          Hasta {MAX_IMAGES} imágenes. La primera es la portada. <span className="opacity-60">Arrastrá para reordenar.</span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div
              key={img.url}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`relative group rounded-lg overflow-hidden bg-surface-container cursor-grab active:cursor-grabbing transition-all ${
                dragOverIndex === i ? 'ring-2 ring-primary scale-105' : ''
              } ${dragIndex.current === i ? 'opacity-40' : ''}`}
              style={{ aspectRatio: '16/9' }}
            >
              <Image src={img.url} alt={`Imagen ${i + 1}`} fill className="object-cover pointer-events-none" />
              {/* Ícono de drag visible en hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-white drop-shadow text-2xl">drag_pan</span>
              </div>
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded font-display">
                  Portada
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-error text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}

          {/* Slots de carga en progreso */}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <div key={`uploading-${i}`} className="rounded-lg bg-surface-container flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            </div>
          ))}

          {/* Botón agregar */}
          {images.length + uploadingCount < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border-2 border-dashed border-outline-variant hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-primary"
              style={{ aspectRatio: '16/9' }}
            >
              <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              <span className="text-xs">Agregar</span>
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />

        {images.length === 0 && uploadingCount === 0 && (
          <p className="text-xs text-on-surface-variant mt-3 text-center opacity-60">
            Recomendado: 1200×630 px · JPG o PNG
          </p>
        )}
      </div>

      {/* Datos básicos */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">info</span>
          Información básica
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Título *</label>
            <input className="input" required value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Ej: Rifa TV 4K - Junio 2025" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Slug (URL) *</label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-surface-container border border-r-0 border-outline-variant rounded-l text-sm text-on-surface-variant">/rifas/</span>
              <input
                className="input rounded-l-none"
                required
                pattern="[a-z0-9-]+"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="rifa-tv-4k-junio-2025"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción *</label>
            <textarea className="input min-h-[80px] resize-y" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción de la rifa y el premio..." />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Premios * <span className="text-on-surface-variant font-normal">(hasta 5)</span></label>
            <div className="flex flex-col gap-2">
              {prizes.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-primary min-w-[20px]">{i + 1}°</span>
                  <input
                    className="input flex-1"
                    required={i === 0}
                    value={p}
                    onChange={(e) => {
                      const next = [...prizes]
                      next[i] = e.target.value
                      setPrizes(next)
                    }}
                    placeholder={
                      i === 0 ? "Ej: Smart TV Samsung 55' 4K"
                      : i === 1 ? 'Ej: Tablet iPad Air'
                      : i === 2 ? 'Ej: AirPods Pro'
                      : i === 3 ? 'Ej: Voucher $50.000'
                      : 'Ej: Auriculares Bluetooth'
                    }
                  />
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setPrizes(prizes.filter((_, j) => j !== i))}
                      className="text-error hover:opacity-70 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>
              ))}
              {prizes.length < 5 && (
                <button
                  type="button"
                  onClick={() => setPrizes([...prizes, ''])}
                  className="flex items-center gap-1 text-sm text-primary hover:opacity-70 transition-opacity self-start mt-1"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Agregar premio
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="label">Cantidad de números *</label>
            <input className="input" type="number" required min={10} max={10000} value={totalTickets} onChange={(e) => setTotalTickets(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Precio por número (ARS) *</label>
            <input className="input" type="number" required min={1} value={ticketPrice} onChange={(e) => setTicketPrice(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Fecha del sorteo *</label>
            <input className="input" type="datetime-local" required value={drawDate} onChange={(e) => setDrawDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as RaffleStatus)}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Métodos de pago */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">payments</span>
          Métodos de pago
        </h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {PAYMENT_OPTIONS.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => togglePaymentMethod(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded border-2 transition-all ${
                paymentMethods.includes(value)
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
              }`}
            >
              <span className="material-symbols-outlined text-base">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {showWhatsApp && (
          <div className="mb-4">
            <label className="label">Número de WhatsApp</label>
            <input className="input" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="5491122334455 (con código de país)" />
          </div>
        )}

        {showTransfer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Titular de la cuenta</label>
              <input className="input" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="Juan García" />
            </div>
            <div>
              <label className="label">CBU</label>
              <input className="input font-mono" value={bankCbu} onChange={(e) => setBankCbu(e.target.value)} placeholder="0000000000000000000000" />
            </div>
            <div>
              <label className="label">Alias</label>
              <input className="input" value={bankAlias} onChange={(e) => setBankAlias(e.target.value)} placeholder="mi.alias.banco" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Nota para el comprador</label>
              <input className="input" value={bankNote} onChange={(e) => setBankNote(e.target.value)} placeholder="Ej: Enviá el comprobante por WhatsApp" />
            </div>
          </div>
        )}
      </div>

      {/* Identidad visual */}
      <div className="card p-5">
        <h2 className="font-display font-semibold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">palette</span>
          Identidad visual
        </h2>
        <p className="text-xs text-on-surface-variant mb-4">
          Colores exclusivos para esta rifa. Se aplican en la página pública del sorteo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ColorPicker
            label="Color primario"
            value={primaryColor}
            defaultValue="#006e2f"
            onChange={setPrimaryColor}
          />
          <ColorPicker
            label="Color secundario"
            value={secondaryColor}
            defaultValue="#565e74"
            onChange={setSecondaryColor}
          />
        </div>

        {/* Preview */}
        {(primaryColor || secondaryColor) && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-on-surface-variant">Vista previa:</span>
            {primaryColor && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: primaryColor, color: isLight(primaryColor) ? '#1a1a1a' : '#fff' }}
              >
                Primario
              </span>
            )}
            {secondaryColor && (
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: secondaryColor, color: isLight(secondaryColor) ? '#1a1a1a' : '#fff' }}
              >
                Secundario
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error-container text-on-error-container rounded text-sm">{error}</div>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={loading || uploadingCount > 0} className="btn-primary">
          {loading ? 'Guardando...' : uploadingCount > 0 ? `Subiendo ${uploadingCount} imagen${uploadingCount > 1 ? 'es' : ''}...` : mode === 'create' ? 'Crear rifa' : 'Guardar cambios'}
        </button>
        <a href="/admin/rifas" className="btn-secondary">Cancelar</a>
      </div>
    </form>
  )
}
