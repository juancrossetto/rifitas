'use client'

import { useState, useEffect, useCallback } from 'react'

interface TicketInfo {
  number: number
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD'
  order?: { buyerName: string; buyerPhone: string; paymentMethod: string } | null
}

interface AdminTicketGridProps {
  raffleId: string
  totalTickets: number
}

export function AdminTicketGrid({ raffleId, totalTickets }: AdminTicketGridProps) {
  const [tickets, setTickets] = useState<TicketInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ number: number; x: number; y: number } | null>(null)
  const [modalNumber, setModalNumber] = useState<number | null>(null)
  const [buyerName, setBuyerName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTickets = useCallback(async () => {
    const res = await fetch(`/api/admin/rifas/${raffleId}/tickets`)
    const data = await res.json()
    setTickets(data)
    setLoading(false)
  }, [raffleId])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const ticketMap = new Map(tickets.map((t) => [t.number, t]))

  const getStatus = (n: number) => ticketMap.get(n)?.status ?? 'AVAILABLE'

  const handleClick = (n: number) => {
    const status = getStatus(n)
    if (status === 'RESERVED') return // no tocar reservados
    if (status === 'SOLD') {
      // Confirmar liberación
      if (!confirm(`¿Liberar el número ${String(n).padStart(2, '0')}? Pasará a disponible.`)) return
      saveTicket(n, 'AVAILABLE')
    } else {
      // Pedir nombre antes de marcar como vendido
      setBuyerName('')
      setModalNumber(n)
    }
  }

  const saveTicket = async (n: number, status: 'AVAILABLE' | 'SOLD', name?: string) => {
    setSaving(true)
    setPending(n)
    await fetch(`/api/admin/rifas/${raffleId}/tickets`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: n, status, buyerName: name }),
    })
    await fetchTickets()
    setPending(null)
    setSaving(false)
    setModalNumber(null)
  }

  const getCellClass = (n: number) => {
    if (pending === n) return 'bg-surface-container border border-outline animate-pulse'
    const status = getStatus(n)
    if (status === 'SOLD') return 'ticket-sold cursor-pointer hover:opacity-70'
    if (status === 'RESERVED') return 'ticket-reserved cursor-not-allowed'
    return 'ticket-available cursor-pointer hover:bg-primary/10'
  }

  const soldCount = tickets.filter((t) => t.status === 'SOLD').length
  const reservedCount = tickets.filter((t) => t.status === 'RESERVED').length
  const availableCount = totalTickets - soldCount - reservedCount

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        Cargando números...
      </div>
    )
  }

  return (
    <div>
      {/* Resumen rápido */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Pill color="bg-sold-bg text-sold border border-sold/30" label={`${soldCount} vendidos`} />
        <Pill color="bg-reserved-bg text-reserved border border-reserved/30" label={`${reservedCount} reservados`} />
        <Pill color="bg-white text-on-surface border border-outline-variant" label={`${availableCount} disponibles`} />
      </div>

      {/* Instrucciones */}
      <p className="text-xs text-on-surface-variant mb-3">
        <span className="material-symbols-outlined text-xs align-middle">info</span>
        {' '}Click en un número <strong>disponible</strong> para marcarlo como vendido. Click en uno <strong>vendido</strong> para liberarlo.
      </p>

      {/* Grid */}
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}
      >
        {Array.from({ length: totalTickets }, (_, i) => i + 1).map((n) => {
          const info = ticketMap.get(n)
          return (
            <button
              key={n}
              type="button"
              onClick={() => handleClick(n)}
              onMouseEnter={(e) => {
                if (info?.order) setTooltip({ number: n, x: e.clientX, y: e.clientY })
              }}
              onMouseLeave={() => setTooltip(null)}
              disabled={saving && pending !== n}
              className={`aspect-square flex items-center justify-center text-number-grid transition-all ${getCellClass(n)}`}
            >
              {pending === n
                ? <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                : String(n).padStart(2, '0')
              }
            </button>
          )
        })}
      </div>

      {/* Tooltip con datos del comprador */}
      {tooltip && ticketMap.get(tooltip.number)?.order && (
        <div
          className="fixed z-50 bg-on-surface text-inverse-on-surface text-xs px-3 py-2 rounded-lg shadow-modal pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-semibold">{ticketMap.get(tooltip.number)!.order!.buyerName}</p>
          <p className="opacity-70">{ticketMap.get(tooltip.number)!.order!.buyerPhone}</p>
        </div>
      )}

      {/* Modal para nombre del comprador */}
      {modalNumber !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-modal p-6 w-full max-w-sm mx-4">
            <h3 className="font-display font-bold text-on-surface mb-1">
              Marcar número <span className="text-primary">{String(modalNumber).padStart(2, '0')}</span> como vendido
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">Venta externa al sistema (efectivo, otro medio, etc.)</p>
            <div className="mb-4">
              <label className="label">Nombre del comprador (opcional)</label>
              <input
                className="input"
                placeholder="Juan García"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveTicket(modalNumber, 'SOLD', buyerName || undefined)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => saveTicket(modalNumber, 'SOLD', buyerName || undefined)}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Guardando...' : 'Confirmar venta'}
              </button>
              <button
                onClick={() => setModalNumber(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Pill({ color, label }: { color: string; label: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>
  )
}
