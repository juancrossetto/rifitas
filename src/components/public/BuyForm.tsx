'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TicketGrid } from './TicketGrid'
import { formatCurrency } from '@/lib/utils'
import { PaymentMethod, TicketStatus } from '@/generated/prisma'

interface Ticket {
  number: number
  status: TicketStatus
}

interface BuyFormProps {
  raffleId: string
  raffleSlug: string
  ticketPrice: number
  totalTickets: number
  tickets: Ticket[]
  paymentMethods: PaymentMethod[]
  whatsappNumber?: string | null
  bankHolder?: string | null
  bankCbu?: string | null
  bankAlias?: string | null
  bankNote?: string | null
}

export function BuyForm({
  raffleId, ticketPrice, totalTickets, tickets,
  paymentMethods, whatsappNumber, bankHolder, bankCbu, bankAlias, bankNote,
}: BuyFormProps) {
  const router = useRouter()
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(paymentMethods[0])
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'form'>('select')

  const total = selectedNumbers.length * ticketPrice

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedNumbers.length === 0) return
    if (!buyerEmail && !buyerPhone) {
      setError('Ingresá al menos un email o teléfono.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffleId,
          ticketNumbers: selectedNumbers,
          buyerName,
          buyerEmail,
          buyerPhone,
          paymentMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.taken) {
          setError(`Los números ${data.taken.join(', ')} ya no están disponibles. Por favor seleccioná otros.`)
          setStep('select')
        } else {
          setError(data.error ?? 'Error al procesar la orden')
        }
        return
      }

      if (paymentMethod === 'MERCADOPAGO' && data.mpInitPoint) {
        window.location.href = data.mpInitPoint
      } else {
        router.push(`/checkout/${data.orderId}`)
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const methodLabel: Record<PaymentMethod, string> = {
    MERCADOPAGO: 'MercadoPago',
    WHATSAPP: 'WhatsApp',
    TRANSFER: 'Transferencia',
  }
  const methodIcon: Record<PaymentMethod, string> = {
    MERCADOPAGO: 'payments',
    WHATSAPP: 'chat',
    TRANSFER: 'account_balance',
  }

  const soldOrReserved = tickets.filter((t) => t.status !== 'AVAILABLE').length
  const available = totalTickets - soldOrReserved

  return (
    <div>
      {step === 'select' ? (
        <div>
          {/* Price + availability hint */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <span className="text-xs text-on-surface-variant">Precio por número</span>
              <p className="font-display font-black text-primary text-2xl leading-tight">
                {formatCurrency(ticketPrice)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-on-surface-variant">Disponibles</span>
              <p className={`font-display font-bold text-xl leading-tight ${available <= 10 ? 'text-error' : 'text-on-surface'}`}>
                {available}
              </p>
            </div>
          </div>

          <TicketGrid
            tickets={tickets}
            totalTickets={totalTickets}
            onSelectionChange={setSelectedNumbers}
          />

          {error && (
            <div className="mt-4 p-3 bg-error-container text-on-error-container rounded text-sm">{error}</div>
          )}

          {selectedNumbers.length > 0 && (
            <div className="mt-6 p-4 bg-surface-container rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-on-surface-variant">Números seleccionados:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {selectedNumbers.map((n) => (
                    <span key={n} className="bg-primary text-on-primary rounded px-1.5 py-0.5 text-xs font-bold font-montserrat">
                      {String(n).padStart(2, '0')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="font-display font-bold text-xl text-primary">{formatCurrency(total)}</span>
              </div>
              <button onClick={() => setStep('form')} className="btn-primary w-full mt-4 py-3 text-base">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                ¡Quiero estos números!
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => setStep('select')}
            className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors self-start"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Cambiar números
          </button>

          {/* Resumen */}
          <div className="p-4 bg-primary-container/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-on-surface-variant mb-1">Números elegidos:</p>
            <div className="flex flex-wrap gap-1">
              {selectedNumbers.map((n) => (
                <span key={n} className="bg-primary text-on-primary rounded px-2 py-0.5 text-xs font-bold font-montserrat">
                  {String(n).padStart(2, '0')}
                </span>
              ))}
            </div>
            <p className="mt-2 font-display font-bold text-primary text-lg">{formatCurrency(total)}</p>
          </div>

          {/* Datos del comprador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nombre completo *</label>
              <input className="input" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Juan García" />
            </div>
            <div>
              <label className="label">
                Email
                <span className="text-on-surface-variant font-normal ml-1 text-xs">(o teléfono)</span>
              </label>
              <input
                className="input"
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="juan@email.com"
              />
            </div>
            <div>
              <label className="label">
                Teléfono
                <span className="text-on-surface-variant font-normal ml-1 text-xs">(o email)</span>
              </label>
              <input
                className="input"
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="1122334455"
              />
            </div>
            {!buyerEmail && !buyerPhone && (
              <p className="sm:col-span-2 text-xs text-error -mt-2">
                Ingresá al menos un email o teléfono para poder contactarte.
              </p>
            )}
          </div>

          {/* Método de pago */}
          <div>
            <label className="label">Método de pago *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex items-center gap-2 p-3 rounded border-2 transition-all ${
                    paymentMethod === method
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{methodIcon[method]}</span>
                  <span className="text-sm font-semibold">{methodLabel[method]}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'TRANSFER' && bankCbu && (
              <div className="mt-3 p-3 bg-surface-container rounded text-sm space-y-1">
                {bankHolder && <p><strong>Titular:</strong> {bankHolder}</p>}
                <p><strong>CBU:</strong> {bankCbu}</p>
                {bankAlias && <p><strong>Alias:</strong> {bankAlias}</p>}
                {bankNote && <p className="text-on-surface-variant">{bankNote}</p>}
              </div>
            )}

            {paymentMethod === 'WHATSAPP' && whatsappNumber && (
              <div className="mt-3 p-3 bg-surface-container rounded text-sm">
                <p>Se abrirá WhatsApp para coordinar el pago con el organizador.</p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-error-container text-on-error-container rounded text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Procesando...
              </>
            ) : paymentMethod === 'MERCADOPAGO' ? (
              <>
                <span className="material-symbols-outlined text-base">payments</span>
                Pagar con MercadoPago
              </>
            ) : paymentMethod === 'WHATSAPP' ? (
              <>
                <span className="material-symbols-outlined text-base">chat</span>
                Reservar y contactar por WhatsApp
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">account_balance</span>
                Reservar números
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
