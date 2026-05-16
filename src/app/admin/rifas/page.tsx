import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { StatusChip } from '@/components/ui/StatusChip'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DeleteRaffleButton } from '@/components/admin/DeleteRaffleButton'

export const dynamic = 'force-dynamic'

export default async function AdminRafflesPage() {
  const raffles = await prisma.raffle.findMany({ orderBy: { createdAt: 'desc' } })

  const withStats = await Promise.all(
    raffles.map(async (r) => {
      const [sold, reserved] = await Promise.all([
        prisma.ticket.count({ where: { raffleId: r.id, status: 'SOLD' } }),
        prisma.ticket.count({ where: { raffleId: r.id, status: 'RESERVED' } }),
      ])
      return { ...r, soldCount: sold, reservedCount: reserved }
    })
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-headline-md text-on-surface">Rifas</h1>
        <Link href="/admin/rifas/nueva" className="btn-primary">
          <span className="material-symbols-outlined text-base">add</span>
          Nueva rifa
        </Link>
      </div>

      {withStats.length === 0 ? (
        <div className="card p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl mb-3 block">inbox</span>
          <p>No hay rifas creadas todavía.</p>
          <Link href="/admin/rifas/nueva" className="btn-primary mt-4 inline-flex">Crear primera rifa</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {withStats.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display font-semibold text-on-surface">{r.title}</h3>
                    <StatusChip status={r.status} />
                  </div>
                  <p className="text-sm text-on-surface-variant mb-1">
                    <span className="material-symbols-outlined text-xs align-middle mr-1">calendar_month</span>
                    Sorteo: {formatDate(r.drawDate)} ·&nbsp;
                    <span className="material-symbols-outlined text-xs align-middle mr-1">sell</span>
                    {formatCurrency(r.ticketPrice)} c/u
                  </p>
                  <div className="max-w-xs">
                    <ProgressBar sold={r.soldCount} reserved={r.reservedCount} total={r.totalTickets} />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/rifas/${r.slug}`}
                    target="_blank"
                    className="p-2 rounded border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                    title="Ver pública"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                  </Link>
                  <Link
                    href={`/admin/rifas/${r.id}`}
                    className="p-2 rounded border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </Link>
                  <DeleteRaffleButton raffleId={r.id} raffleTitle={r.title} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
