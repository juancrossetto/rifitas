import React from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { releaseExpiredReservations } from '@/lib/reservations'
import { BuyForm } from '@/components/public/BuyForm'
import { StatusChip } from '@/components/ui/StatusChip'
import { RaffleGallery } from '@/components/public/RaffleGallery'
import { CountdownTimer } from '@/components/public/CountdownTimer'
import { PrizeHero } from '@/components/public/PrizeHero'
import { SocialProofBar } from '@/components/public/SocialProofBar'
import { StickyBuyCTA } from '@/components/public/StickyBuyCTA'
import { formatCurrency, formatDate, buildRaffleTheme } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

async function getRaffle(slug: string) {
  const raffle = await prisma.raffle.findUnique({
    where: { slug },
    include: { tickets: { orderBy: { number: 'asc' } } },
  })
  if (!raffle) return null

  // Liberar reservas vencidas antes de mostrar disponibilidad
  await releaseExpiredReservations(raffle.id).catch(() => null)

  const [soldCount, reservedCount, participantCount] = await Promise.all([
    prisma.ticket.count({ where: { raffleId: raffle.id, status: 'SOLD' } }),
    prisma.ticket.count({ where: { raffleId: raffle.id, status: 'RESERVED' } }),
    prisma.order.count({ where: { raffleId: raffle.id, status: { in: ['CONFIRMED', 'PENDING'] } } }),
  ])

  return { ...raffle, soldCount, reservedCount, participantCount }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const raffle = await prisma.raffle.findUnique({ where: { slug } })
  if (!raffle) return {}
  return { title: `${raffle.title} | Rifas Online`, description: raffle.description }
}

export default async function RafflePage({ params }: Props) {
  const { slug } = await params
  const raffle = await getRaffle(slug)
  if (!raffle) notFound()

  const isActive = raffle.status === 'ACTIVE'
  const available = raffle.totalTickets - raffle.soldCount - raffle.reservedCount
  const themeVars = buildRaffleTheme(raffle.primaryColor, raffle.secondaryColor)
  const hasTheme = Object.keys(themeVars).length > 0

  return (
    <div
      className="min-h-screen bg-background pb-24 lg:pb-0"
      style={hasTheme ? (themeVars as React.CSSProperties) : undefined}
    >
      {/* Header */}
      <header className="bg-white border-b border-outline-variant sticky top-0 z-10 shadow-sm">
        <div className="max-w-layout mx-auto px-margin-mobile lg:px-margin-desktop py-4 flex items-center gap-3">
          <a href="/" className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span className="text-sm">Volver</span>
          </a>
          <div className="h-4 w-px bg-outline-variant" />
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span>
            <span className="font-display font-bold text-on-surface">Rifas Online</span>
          </div>
        </div>
      </header>

      <main className="max-w-layout mx-auto px-margin-mobile lg:px-margin-desktop py-6 lg:py-8">

        {/* Prize hero — full width, lo primero que se ve */}
        <div className="mb-6">
          <PrizeHero prizes={raffle.prizes} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Columna izquierda: info */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Galería */}
            <div className="relative">
              <div className="absolute top-3 left-3 z-10">
                <StatusChip status={raffle.status} />
              </div>
              <RaffleGallery imageUrls={raffle.imageUrls} title={raffle.title} />
            </div>

            {/* Countdown */}
            {(raffle.status === 'ACTIVE' || raffle.status === 'CLOSED') && (
              <CountdownTimer drawDate={raffle.drawDate.toISOString()} />
            )}

            {/* Info */}
            <div className="card p-5 flex flex-col gap-4">
              <div>
                <h1 className="font-display font-bold text-headline-md text-on-surface">{raffle.title}</h1>
                <p className="text-body-md text-on-surface-variant mt-2">{raffle.description}</p>
              </div>

              <div className="flex flex-col gap-2">
                <InfoRow icon="calendar_month" label="Sorteo" value={formatDate(raffle.drawDate)} />
                <InfoRow icon="confirmation_number" label="Total de números" value={String(raffle.totalTickets)} />
                <InfoRow icon="sell" label="Precio por número" value={formatCurrency(raffle.ticketPrice)} highlight />
              </div>

              {/* Social proof + urgency + progress */}
              <SocialProofBar
                sold={raffle.soldCount}
                reserved={raffle.reservedCount}
                total={raffle.totalTickets}
                participantCount={raffle.participantCount}
              />
            </div>
          </div>

          {/* Columna derecha: compra */}
          <div className="lg:col-span-3" id="buy-form">
            <div className="card p-5 lg:p-6">
              <h2 className="font-display font-bold text-headline-md text-on-surface mb-1">
                {isActive ? '¿Cuál es tu número de la suerte?' : 'Esta rifa ya no acepta participaciones'}
              </h2>
              {isActive && (
                <p className="text-sm text-on-surface-variant mb-6">
                  Elegí uno o más números y participá del sorteo.
                </p>
              )}

              {isActive ? (
                <BuyForm
                  raffleId={raffle.id}
                  raffleSlug={raffle.slug}
                  ticketPrice={raffle.ticketPrice}
                  totalTickets={raffle.totalTickets}
                  tickets={raffle.tickets}
                  paymentMethods={raffle.paymentMethods}
                  whatsappNumber={raffle.whatsappNumber}
                  bankHolder={raffle.bankHolder}
                  bankCbu={raffle.bankCbu}
                  bankAlias={raffle.bankAlias}
                  bankNote={raffle.bankNote}
                />
              ) : (
                <div className="text-center py-8 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl mb-3 block">lock</span>
                  <p>Rifa {raffle.status === 'CLOSED' ? 'cerrada' : 'finalizada'}.</p>
                  <a href="/" className="btn-outline-primary mt-4 inline-flex">Ver otras rifas</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky CTA mobile — solo si está activa */}
      {isActive && (
        <StickyBuyCTA ticketPrice={raffle.ticketPrice} available={available} />
      )}
    </div>
  )
}

function InfoRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
      <span className="text-sm text-on-surface-variant min-w-[120px]">{label}:</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value}</span>
    </div>
  )
}
