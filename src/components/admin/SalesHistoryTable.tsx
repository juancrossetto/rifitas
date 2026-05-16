'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/utils'

interface SaleItem {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  paymentMethod: string
  totalAmount: number
  status: string
  createdAt: string
  confirmedAt: string | null
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

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelada',
}

const STATUS_CLASS: Record<string, string> = {
  CONFIRMED: 'bg-primary/10 text-primary',
  PENDING: 'bg-reserved-bg text-reserved',
  CANCELLED: 'bg-error-container text-error',
}

interface Filters {
  status: string
  method: string
  raffleId: string
  search: string
}

export function SalesHistoryTable({ raffleId }: { raffleId?: string }) {
  const [sales, setSales] = useState<SaleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    status: '',
    method: '',
    raffleId: raffleId ?? '',
    search: '',
  })
  const [raffles, setRaffles] = useState<{ id: string; title: string }[]>([])

  const fetchSales = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.status) params.set('filter', filters.status)
    if (filters.method) params.set('method', filters.method)
    if (filters.raffleId) params.set('raffleId', filters.raffleId)
    const res = await fetch(`/api/admin/orders?${params}`)
    const data = await res.json()
    setSales(data)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  useEffect(() => {
    if (raffleId) return // no need to load raffle list if scoped to one
    fetch('/api/admin/rifas')
      .then((r) => r.json())
      .then((data) => setRaffles(data))
      .catch(() => {})
  }, [raffleId])

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const filtered = sales.filter((s) => {
    if (!filters.search) return true
    const q = filters.search.toLowerCase()
    return (
      s.buyerName.toLowerCase().includes(q) ||
      s.buyerEmail.toLowerCase().includes(q) ||
      s.buyerPhone.includes(q) ||
      s.tickets.some((t) => String(t.number).includes(q))
    )
  })

  const totalConfirmed = filtered
    .filter((s) => s.status === 'CONFIRMED')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Buscar</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant">search</span>
              <input
                className="input pl-8"
                placeholder="Nombre, email, teléfono, número..."
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Estado</label>
            <select className="input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
              <option value="">Todos</option>
              <option value="confirmed">Confirmadas</option>
              <option value="pending">Pendientes</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <div>
            <label className="label">Método de pago</label>
            <select className="input" value={filters.method} onChange={(e) => setFilter('method', e.target.value)}>
              <option value="">Todos</option>
              <option value="MERCADOPAGO">MercadoPago</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>

          {!raffleId && (
            <div>
              <label className="label">Rifa</label>
              <select className="input" value={filters.raffleId} onChange={(e) => setFilter('raffleId', e.target.value)}>
                <option value="">Todas</option>
                {raffles.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Resumen */}
      {!loading && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="card p-3 flex items-center gap-2 min-w-[140px]">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            <div>
              <p className="text-on-surface-variant text-xs">Total órdenes</p>
              <p className="font-display font-bold text-on-surface">{filtered.length}</p>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-2 min-w-[140px]">
            <span className="material-symbols-outlined text-primary">payments</span>
            <div>
              <p className="text-on-surface-variant text-xs">Recaudado (confirmadas)</p>
              <p className="font-display font-bold text-on-surface">{formatCurrency(totalConfirmed)}</p>
            </div>
          </div>
          <div className="card p-3 flex items-center gap-2 min-w-[140px]">
            <span className="material-symbols-outlined text-primary">confirmation_number</span>
            <div>
              <p className="text-on-surface-variant text-xs">Números vendidos</p>
              <p className="font-display font-bold text-on-surface">
                {filtered.filter((s) => s.status === 'CONFIRMED').reduce((sum, s) => sum + s.tickets.length, 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-on-surface-variant justify-center">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Cargando historial...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant card">
          <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
          <p className="text-sm">No hay órdenes para mostrar</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container">
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Comprador</th>
                  {!raffleId && <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Rifa</th>}
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Números</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Método</th>
                  <th className="text-left px-4 py-3 font-semibold text-on-surface-variant">Fecha</th>
                  <th className="text-right px-4 py-3 font-semibold text-on-surface-variant">Monto</th>
                  <th className="text-center px-4 py-3 font-semibold text-on-surface-variant">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale, i) => (
                  <tr
                    key={sale.id}
                    className={`border-b border-outline-variant last:border-0 hover:bg-surface-container/50 transition-colors ${
                      sale.status === 'CANCELLED' ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{sale.buyerName}</p>
                      <p className="text-xs text-on-surface-variant">{sale.buyerEmail}</p>
                      <p className="text-xs text-on-surface-variant">{sale.buyerPhone}</p>
                    </td>
                    {!raffleId && (
                      <td className="px-4 py-3 text-on-surface-variant">{sale.raffle.title}</td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {sale.tickets.map((t) => (
                          <span
                            key={t.number}
                            className={`text-xs font-bold font-display px-1.5 py-0.5 rounded border ${
                              sale.status === 'CONFIRMED'
                                ? 'bg-sold-bg text-sold border-sold/30'
                                : sale.status === 'PENDING'
                                ? 'bg-reserved-bg text-reserved border-dashed border-reserved'
                                : 'bg-surface-container text-on-surface-variant border-outline-variant'
                            }`}
                          >
                            {String(t.number).padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">{METHOD_ICON[sale.paymentMethod]}</span>
                        {METHOD_LABEL[sale.paymentMethod]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                      <p>{formatDate(sale.createdAt)}</p>
                      {sale.confirmedAt && (
                        <p className="text-xs text-primary">✓ {formatDate(sale.confirmedAt)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-display font-bold text-on-surface">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CLASS[sale.status] ?? 'bg-surface-container text-on-surface-variant'}`}>
                        {STATUS_LABEL[sale.status] ?? sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col divide-y divide-outline-variant">
            {filtered.map((sale) => (
              <div key={sale.id} className={`p-4 ${sale.status === 'CANCELLED' ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-on-surface">{sale.buyerName}</p>
                    <p className="text-xs text-on-surface-variant">{sale.buyerPhone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-display font-bold text-on-surface">{formatCurrency(sale.totalAmount)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CLASS[sale.status] ?? ''}`}>
                      {STATUS_LABEL[sale.status] ?? sale.status}
                    </span>
                  </div>
                </div>
                {!raffleId && (
                  <p className="text-xs text-on-surface-variant mb-1">{sale.raffle.title}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-2">
                  {sale.tickets.map((t) => (
                    <span key={t.number} className="text-xs font-bold font-display bg-reserved-bg text-reserved border border-dashed border-reserved px-1.5 py-0.5 rounded">
                      {String(t.number).padStart(2, '0')}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">{METHOD_ICON[sale.paymentMethod]}</span>
                    {METHOD_LABEL[sale.paymentMethod]}
                  </span>
                  <span>{formatDate(sale.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
