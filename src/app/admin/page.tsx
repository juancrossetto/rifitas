import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { StatusChip } from '@/components/ui/StatusChip'
import { ProgressBar } from '@/components/ui/ProgressBar'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  const raffles = await prisma.raffle.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const stats = await Promise.all(
    raffles.map(async (r) => {
      const [sold, reserved, revenue] = await Promise.all([
        prisma.ticket.count({ where: { raffleId: r.id, status: 'SOLD' } }),
        prisma.ticket.count({ where: { raffleId: r.id, status: 'RESERVED' } }),
        prisma.order.aggregate({
          where: { raffleId: r.id, status: 'CONFIRMED' },
          _sum: { totalAmount: true },
        }),
      ])
      return { ...r, soldCount: sold, reservedCount: reserved, revenue: revenue._sum.totalAmount ?? 0 }
    })
  )

  const totalRevenue = stats.reduce((sum, r) => sum + r.revenue, 0)
  const totalSold = stats.reduce((sum, r) => sum + r.soldCount, 0)
  const activeRaffles = stats.filter((r) => r.status === 'ACTIVE').length

  return { stats, totalRevenue, totalSold, activeRaffles }
}

export default async function AdminDashboard() {
  const { stats, totalRevenue, totalSold, activeRaffles } = await getDashboardData()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-headline-md text-on-surface">Dashboard</h1>
        <Link href="/admin/rifas/nueva" className="btn-primary">
          <span className="material-symbols-outlined text-base">add</span>
          Nueva rifa
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard icon="confirmation_number" label="Rifas activas" value={String(activeRaffles)} color="primary" />
        <KpiCard icon="sell" label="Tickets vendidos" value={String(totalSold)} color="tertiary" />
        <KpiCard icon="payments" label="Recaudado" value={formatCurrency(totalRevenue)} color="primary" />
      </div>

      {/* Tabla de rifas */}
      <div>
        <h2 className="font-display font-semibold text-on-surface mb-4">Todas las rifas</h2>
        {stats.length === 0 ? (
          <div className="card p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-3 block">inbox</span>
            <p>No hay rifas todavía.</p>
            <Link href="/admin/rifas/nueva" className="btn-primary mt-4 inline-flex">Crear primera rifa</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {stats.map((r) => (
              <div key={r.id} className="card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-on-surface truncate">{r.title}</h3>
                    <StatusChip status={r.status} />
                  </div>
                  <p className="text-sm text-on-surface-variant mb-2">{r.prizes?.[0]}</p>
                  <ProgressBar sold={r.soldCount} reserved={r.reservedCount} total={r.totalTickets} />
                </div>
                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <p className="font-display font-bold text-primary">{formatCurrency(r.revenue)}</p>
                  <p className="text-xs text-on-surface-variant">{r.soldCount}/{r.totalTickets} vendidos</p>
                  <Link href={`/admin/rifas/${r.id}`} className="btn-outline-primary text-sm py-1.5 px-3 mt-1">
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${color}/10`}>
          <span className={`material-symbols-outlined text-${color}`}>{icon}</span>
        </div>
        <div>
          <p className="text-xs text-on-surface-variant">{label}</p>
          <p className="font-display font-bold text-on-surface text-xl">{value}</p>
        </div>
      </div>
    </div>
  )
}
