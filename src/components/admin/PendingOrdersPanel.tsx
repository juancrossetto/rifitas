'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'

interface OrderItem {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  paymentMethod: string
  totalAmount: number
  status: string
  createdAt: string
  minutesLeft: number | null
  isExpired: boolean
  raffle: { title: string; slug: string }
  tickets: { number: number }[]
}

const METHOD_LABEL: Record<string, string> = {
  TRANSFER: 'Transferencia',
  WHATSAPP: 'WhatsApp',
  MERCADOPAGO: 'MercadoPago',
}
const METHOD_ICON: Record<string, string> = {
  TRANSFER: 'account_balance',
  WHATSAPP: 'chat',
  MERCADOPAGO: 'payments',
}

export function PendingOrdersPanel({ raffleId }: { raffleId?: string }) {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams({ filter: 'pending' })
    if (raffleId) params.set('raffleId', raffleId)
    const res = await fetch(`/api/admin/orders?${params}`)
    const data = await res.json()
    setOrders(data)
    setLoading(false)
  }, [raffleId])

  useEffect(() => {
    fetchOrders()
    // Refrescar cada 30 segundos automáticamente
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleAction = async (id: string, action: 'confirm' | 'reject') => {
    const verb = action === 'confirm' ? 'confirmar' : 'rechazar'
    if (!confirm(`¿Querés ${verb} esta orden?`)) return
    setActionId(id)
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await fetchOrders()
    setActionId(null)
  }

  if (loading) return (
    <div className="flex items-center gap-2 py-8 text-on-surface-variant justify-center">
      <span className="material-symbols-outlined animate-spin">progress_activity</span>
      Cargando órdenes...
    </div>
  )

  if (orders.length === 0) return (
    <div className="text-center py-12 text-on-surface-variant">
      <span className="material-symbols-outlined text-4xl mb-2 block">check_circle</span>
      <p className="text-sm">No hay órdenes pendientes</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className={`card p-4 border-l-4 ${
            order.isExpired
              ? 'border-l-sold opacity-60'
              : order.minutesLeft !== null && order.minutesLeft <= 5
              ? 'border-l-error'
              : 'border-l-reserved'
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Info comprador */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-display font-semibold text-on-surface">{order.buyerName}</span>
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                  <span className="material-symbols-outlined text-xs">{METHOD_ICON[order.paymentMethod]}</span>
                  {METHOD_LABEL[order.paymentMethod]}
                </span>
                {order.isExpired && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sold-bg text-sold font-semibold">Expirada</span>
                )}
                {!order.isExpired && order.minutesLeft !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    order.minutesLeft <= 5
                      ? 'bg-error-container text-error'
                      : 'bg-reserved-bg text-reserved'
                  }`}>
                    {order.minutesLeft > 0 ? `${order.minutesLeft} min restantes` : 'Expirando...'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  {order.buyerEmail}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">phone</span>
                  {order.buyerPhone}
                </span>
                {!raffleId && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">confirmation_number</span>
                    {order.raffle.title}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-on-surface-variant">Números:</span>
                {order.tickets.map((t) => (
                  <span key={t.number} className="bg-reserved-bg text-reserved border border-dashed border-reserved rounded px-1.5 py-0.5 text-xs font-bold font-display">
                    {String(t.number).padStart(2, '0')}
                  </span>
                ))}
              </div>
            </div>

            {/* Monto + acciones */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="font-display font-bold text-lg text-on-surface">
                {formatCurrency(order.totalAmount)}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(order.id, 'confirm')}
                  disabled={!!actionId}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  {actionId === order.id ? (
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                  Confirmar
                </button>
                <button
                  onClick={() => handleAction(order.id, 'reject')}
                  disabled={!!actionId}
                  className="flex items-center gap-1 px-3 py-1.5 border border-error text-error rounded text-sm font-semibold hover:bg-error-container transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
