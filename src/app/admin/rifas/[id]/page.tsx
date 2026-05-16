import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { RaffleForm } from '@/components/admin/RaffleForm'
import { AdminTicketGrid } from '@/components/admin/AdminTicketGrid'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function EditRafflePage({ params }: Props) {
  const { id } = await params
  const raffle = await prisma.raffle.findUnique({ where: { id } })
  if (!raffle) notFound()

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/admin/rifas" className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Rifas
        </Link>
        <span className="text-outline-variant">/</span>
        <h1 className="font-display font-bold text-headline-md text-on-surface">Editar: {raffle.title}</h1>
      </div>

      {/* Gestión de números — solo si la rifa no es borrador */}
      {raffle.status !== 'DRAFT' && (
        <div className="card p-5 lg:p-6">
          <h2 className="font-display font-semibold text-on-surface mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">grid_view</span>
            Gestión de números
          </h2>
          <p className="text-sm text-on-surface-variant mb-5">
            Marcá manualmente números vendidos por fuera del sistema (efectivo, transferencia directa, etc.)
          </p>
          <AdminTicketGrid raffleId={raffle.id} totalTickets={raffle.totalTickets} />
        </div>
      )}

      {/* Formulario de datos */}
      <div>
        <h2 className="font-display font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">edit</span>
          Datos de la rifa
        </h2>
        <RaffleForm mode="edit" raffle={raffle} />
      </div>
    </div>
  )
}
