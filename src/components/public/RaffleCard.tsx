import Image from 'next/image'
import Link from 'next/link'
import { StatusChip } from '@/components/ui/StatusChip'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency, formatDate } from '@/lib/utils'

interface RaffleCardProps {
  id: string
  slug: string
  title: string
  imageUrls?: string[]
  prizes: string[]
  ticketPrice: number
  totalTickets: number
  soldCount: number
  reservedCount: number
  drawDate: string | Date
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'FINISHED'
}

export function RaffleCard({
  slug, title, imageUrls, prizes, ticketPrice, totalTickets,
  soldCount, reservedCount, drawDate, status,
}: RaffleCardProps) {
  return (
    <Link href={`/rifas/${slug}`} className="card flex flex-col group">
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-surface-container">
        {imageUrls?.[0] ? (
          <Image
            src={imageUrls[0]}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-outline">confirmation_number</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusChip status={status} />
        </div>
        {prizes.length > 1 && (
          <div className="absolute top-3 right-3 bg-primary text-on-primary text-xs font-bold px-2 py-0.5 rounded-full font-display">
            {prizes.length} premios
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-display font-bold text-on-surface text-lg leading-tight">{title}</h3>
          <div className="mt-1 flex flex-col gap-0.5">
            {prizes.map((p, i) => (
              <p key={i} className="text-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: i === 0 ? "'FILL' 1" : "'FILL' 0" }}>
                  emoji_events
                </span>
                <span>{i === 0 ? <strong>{p}</strong> : p}</span>
              </p>
            ))}
          </div>
        </div>

        <ProgressBar sold={soldCount} reserved={reservedCount} total={totalTickets} />

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-outline-variant">
          <div>
            <p className="text-xs text-on-surface-variant">Precio por número</p>
            <p className="font-display font-bold text-primary text-lg">{formatCurrency(ticketPrice)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-on-surface-variant">Sorteo</p>
            <p className="text-sm font-semibold text-on-surface">{formatDate(drawDate)}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
