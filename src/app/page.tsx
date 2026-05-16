import { prisma } from '@/lib/prisma'
import { RaffleCard } from '@/components/public/RaffleCard'

export const dynamic = 'force-dynamic'

async function getRaffles() {
  const raffles = await prisma.raffle.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { drawDate: 'asc' },
  })

  return Promise.all(
    raffles.map(async (r) => {
      const [soldCount, reservedCount] = await Promise.all([
        prisma.ticket.count({ where: { raffleId: r.id, status: 'SOLD' } }),
        prisma.ticket.count({ where: { raffleId: r.id, status: 'RESERVED' } }),
      ])
      return { ...r, soldCount, reservedCount }
    })
  )
}

export default async function HomePage() {
  const raffles = await getRaffles()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-outline-variant sticky top-0 z-10 shadow-sm">
        <div className="max-w-layout mx-auto px-margin-mobile lg:px-margin-desktop py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">confirmation_number</span>
            <span className="font-display font-bold text-xl text-on-surface">Rifas Online</span>
          </div>
          <a href="/admin" className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            Admin
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-on-surface to-inverse-surface text-inverse-on-surface py-16 lg:py-24">
        <div className="max-w-layout mx-auto px-margin-mobile lg:px-margin-desktop text-center">
          <h1 className="font-display font-bold text-display-lg-mobile lg:text-display-lg mb-4">
            Participá y <span className="text-primary-container">ganá</span>
          </h1>
          <p className="text-body-lg opacity-80 max-w-xl mx-auto">
            Elegí tus números de la suerte, pagá de forma segura y esperá el sorteo.
          </p>
        </div>
      </section>

      {/* Rifas */}
      <main className="max-w-layout mx-auto px-margin-mobile lg:px-margin-desktop py-12">
        {raffles.length === 0 ? (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-6xl text-outline mb-4 block">inbox</span>
            <p className="text-on-surface-variant text-body-lg">No hay rifas activas por el momento.</p>
          </div>
        ) : (
          <>
            <h2 className="font-display font-bold text-headline-md text-on-surface mb-6">
              Rifas disponibles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {raffles.map((raffle) => (
                <RaffleCard key={raffle.id} {...raffle} drawDate={raffle.drawDate.toISOString()} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant py-8 mt-auto">
        <div className="max-w-layout mx-auto px-margin-mobile lg:px-margin-desktop text-center text-sm text-on-surface-variant">
          © {new Date().getFullYear()} Rifas Online. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}
