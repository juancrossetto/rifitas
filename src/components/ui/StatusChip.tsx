'use client'

import { RaffleStatus } from '@/generated/prisma'

const STATUS_CONFIG = {
  DRAFT: { label: 'Borrador', className: 'bg-surface-container text-secondary' },
  ACTIVE: { label: 'Activa', className: 'bg-primary-container/20 text-primary' },
  CLOSED: { label: 'Cerrada', className: 'bg-sold-bg text-sold' },
  FINISHED: { label: 'Finalizada', className: 'bg-secondary-container text-secondary' },
}

export function StatusChip({ status }: { status: RaffleStatus }) {
  const { label, className } = STATUS_CONFIG[status]
  return (
    <span className={`status-chip ${className}`}>
      {label}
    </span>
  )
}
