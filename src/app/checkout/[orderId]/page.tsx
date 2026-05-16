import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'

interface Props {
  params: Promise<{ orderId: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { orderId } = await params
  const { status } = await searchParams

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      raffle: true,
      tickets: { orderBy: { number: 'asc' } },
    },
  })

  if (!order) notFound()

  const isMpSuccess = status === 'success' || order.status === 'CONFIRMED'
  const isMpPending = status === 'pending'
  const isMpFailure = status === 'failure'

  const isWhatsApp = order.paymentMethod === 'WHATSAPP'
  const isTransfer = order.paymentMethod === 'TRANSFER'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b border-outline-variant py-4">
        <div className="max-w-layout mx-auto px-margin-mobile lg:px-margin-desktop flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">confirmation_number</span>
          <span className="font-display font-bold text-xl text-on-surface">Rifas Online</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-margin-mobile py-12">
        <div className="w-full max-w-lg">
          {/* Estado del pago */}
          {isMpSuccess && (
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h1 className="font-display font-bold text-headline-md text-on-surface">¡Pago confirmado!</h1>
              <p className="text-on-surface-variant mt-2">Tu participación está registrada. ¡Mucha suerte!</p>
            </div>
          )}

          {isMpPending && (
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-reserved/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-reserved text-4xl">schedule</span>
              </div>
              <h1 className="font-display font-bold text-headline-md text-on-surface">Pago pendiente</h1>
              <p className="text-on-surface-variant mt-2">Estamos esperando la confirmación de MercadoPago. Te notificaremos por email.</p>
            </div>
          )}

          {isMpFailure && (
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-error text-4xl">cancel</span>
              </div>
              <h1 className="font-display font-bold text-headline-md text-on-surface">Pago rechazado</h1>
              <p className="text-on-surface-variant mt-2">No pudimos procesar el pago. Los números quedan liberados.</p>
              <a href={`/rifas/${order.raffle.slug}`} className="btn-primary mt-4 inline-flex">
                Intentar de nuevo
              </a>
            </div>
          )}

          {(isWhatsApp || isTransfer) && !isMpSuccess && !isMpPending && !isMpFailure && (
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  bookmark_added
                </span>
              </div>
              <h1 className="font-display font-bold text-headline-md text-on-surface">¡Números reservados!</h1>
              <p className="text-on-surface-variant mt-2">
                Tenés 30 minutos para confirmar el pago.
              </p>
            </div>
          )}

          {/* Detalle de la orden */}
          <div className="card p-5 flex flex-col gap-4">
            <h2 className="font-display font-semibold text-on-surface">Detalle de tu orden</h2>

            <div className="space-y-2 text-sm">
              <Row label="Rifa" value={order.raffle.title} />
              <Row label="Sorteo" value={formatDate(order.raffle.drawDate)} />
              <Row label="Comprador" value={order.buyerName} />
              <Row label="Email" value={order.buyerEmail} />
              <Row label="Teléfono" value={order.buyerPhone} />
            </div>

            <div>
              <p className="text-sm text-on-surface-variant mb-2">Números seleccionados:</p>
              <div className="flex flex-wrap gap-1.5">
                {order.tickets.map((t) => (
                  <span key={t.id} className="bg-primary text-on-primary rounded px-2 py-1 text-xs font-bold font-montserrat">
                    {String(t.number).padStart(2, '0')}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-outline-variant">
              <span className="font-semibold">Total</span>
              <span className="font-display font-bold text-xl text-primary">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Instrucciones de pago */}
          {isTransfer && order.raffle.bankCbu && !isMpSuccess && (
            <div className="card p-5 mt-4">
              <h3 className="font-display font-semibold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_balance</span>
                Datos para transferencia
              </h3>
              <div className="space-y-2 text-sm">
                {order.raffle.bankHolder && <Row label="Titular" value={order.raffle.bankHolder} />}
                <Row label="CBU" value={order.raffle.bankCbu} mono />
                {order.raffle.bankAlias && <Row label="Alias" value={order.raffle.bankAlias} mono />}
                {order.raffle.bankNote && <p className="text-on-surface-variant mt-2">{order.raffle.bankNote}</p>}
              </div>
            </div>
          )}

          {isWhatsApp && order.raffle.whatsappNumber && !isMpSuccess && (
            <div className="mt-4">
              <WhatsAppButton
                phone={order.raffle.whatsappNumber}
                message={`Hola! Reservé los números ${order.tickets.map((t) => t.number).join(', ')} para la rifa "${order.raffle.title}". Orden: ${order.id}`}
              />
            </div>
          )}

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
              Ver más rifas
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-on-surface-variant">{label}:</span>
      <span className={`font-medium text-on-surface text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
