'use client'

import { useState, useCallback, useEffect } from 'react'
import { TicketStatus } from '@/generated/prisma'

interface TicketData {
  number: number
  status: TicketStatus
}

interface TicketGridProps {
  tickets: TicketData[]
  totalTickets: number
  maxSelection?: number
  onSelectionChange: (selected: number[]) => void
}

const MAX_DEFAULT = 10

export function TicketGrid({ tickets, totalTickets, maxSelection = MAX_DEFAULT, onSelectionChange }: TicketGridProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const ticketMap = new Map(tickets.map((t) => [t.number, t.status]))

  // Notificar al padre DESPUÉS del render, no durante el setState
  useEffect(() => {
    onSelectionChange(Array.from(selected).sort((a, b) => a - b))
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(
    (num: number) => {
      const status = ticketMap.get(num)
      if (status && status !== 'AVAILABLE') return

      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(num)) {
          next.delete(num)
        } else {
          if (next.size >= maxSelection) return prev
          next.add(num)
        }
        return next
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tickets, maxSelection]
  )

  const getClass = (num: number) => {
    const status = ticketMap.get(num) ?? 'AVAILABLE'
    if (selected.has(num)) return 'ticket-selected'
    if (status === 'RESERVED') return 'ticket-reserved'
    if (status === 'SOLD') return 'ticket-sold'
    return 'ticket-available'
  }

  const numbers = Array.from({ length: totalTickets }, (_, i) => i + 1)

  return (
    <div>
      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        {[
          { cls: 'ticket-available', label: 'Disponible' },
          { cls: 'ticket-selected', label: 'Seleccionado' },
          { cls: 'ticket-reserved', label: 'Reservado' },
          { cls: 'ticket-sold', label: 'Vendido' },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded text-center leading-6 text-number-grid ${cls}`} />
            <span className="text-on-surface-variant">{label}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-on-surface-variant mb-3">
        Seleccionados: <strong className="text-primary">{selected.size}</strong> / máx. {maxSelection}
      </p>

      {/* Grid */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}>
        {numbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => toggle(num)}
            className={`aspect-square flex items-center justify-center text-number-grid transition-all ${getClass(num)}`}
          >
            {selected.has(num) ? (
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
            ) : ticketMap.get(num) === 'SOLD' ? (
              <span className="material-symbols-outlined text-sm">close</span>
            ) : (
              String(num).padStart(2, '0')
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
