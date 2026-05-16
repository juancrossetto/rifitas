'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  raffleId: string
  raffleTitle: string
}

export function DeleteRaffleButton({ raffleId, raffleTitle }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`¿Seguro que querés eliminar "${raffleTitle}"? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    await fetch(`/api/admin/rifas/${raffleId}`, { method: 'DELETE' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 rounded border border-outline-variant text-on-surface-variant hover:border-error hover:text-error transition-colors disabled:opacity-50"
      title="Eliminar"
    >
      <span className="material-symbols-outlined text-base">{loading ? 'progress_activity' : 'delete'}</span>
    </button>
  )
}
