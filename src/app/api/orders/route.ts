import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPreference } from '@/lib/mercadopago'
import { releaseExpiredReservations } from '@/lib/reservations'
import { z } from 'zod'

const orderSchema = z.object({
  raffleId: z.string(),
  ticketNumbers: z.array(z.number()).min(1).max(20),
  buyerName: z.string().min(2),
  buyerEmail: z.string().email().optional().or(z.literal('')),
  buyerPhone: z.string().min(6).optional().or(z.literal('')),
  paymentMethod: z.enum(['MERCADOPAGO', 'WHATSAPP', 'TRANSFER']),
}).refine(
  (d) => (d.buyerEmail && d.buyerEmail.length > 0) || (d.buyerPhone && d.buyerPhone.length > 0),
  { message: 'Se requiere al menos un email o teléfono', path: ['buyerEmail'] }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 })
    }

    const { raffleId, ticketNumbers, buyerName, buyerEmail, buyerPhone, paymentMethod } = parsed.data

    const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } })
    if (!raffle || raffle.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Rifa no disponible' }, { status: 400 })
    }

    // Liberar reservas vencidas — si falla no bloqueamos la compra
    try {
      await releaseExpiredReservations(raffleId)
    } catch (cleanupErr) {
      console.error('[orders] cleanup failed (non-fatal):', cleanupErr)
    }

    // Verificar disponibilidad de números
    const existingTickets = await prisma.ticket.findMany({
      where: { raffleId, number: { in: ticketNumbers }, status: { not: 'AVAILABLE' } },
    })

    if (existingTickets.length > 0) {
      const taken = existingTickets.map((t) => t.number)
      return NextResponse.json({ error: 'Números no disponibles', taken }, { status: 409 })
    }

    const totalAmount = raffle.ticketPrice * ticketNumbers.length
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          raffleId,
          buyerName,
          buyerEmail: buyerEmail || '',
          buyerPhone: buyerPhone || '',
          totalAmount,
          paymentMethod,
          expiresAt,
        },
      })

      // Crear/reservar tickets
      await Promise.all(
        ticketNumbers.map((number) =>
          tx.ticket.upsert({
            where: { raffleId_number: { raffleId, number } },
            create: { raffleId, number, status: 'RESERVED', orderId: newOrder.id },
            update: { status: 'RESERVED', orderId: newOrder.id },
          })
        )
      )

      return newOrder
    })

    if (paymentMethod === 'MERCADOPAGO') {
      // MP requiere un email válido; si el usuario no lo ingresó usamos el teléfono como fallback
      const mpEmail = (buyerEmail && buyerEmail.length > 0)
        ? buyerEmail
        : `${(buyerPhone || 'sin-email').replace(/\s+/g, '')}@comprador.rifar.app`

      const preference = await createPreference({
        orderId: order.id,
        raffleTitle: raffle.title,
        ticketNumbers,
        unitPrice: raffle.ticketPrice,
        quantity: ticketNumbers.length,
        buyerEmail: mpEmail,
      })

      await prisma.order.update({
        where: { id: order.id },
        data: { mpPreferenceId: preference.id },
      })

      return NextResponse.json({
        orderId: order.id,
        mpPreferenceId: preference.id,
        mpInitPoint: preference.init_point,
      })
    }

    return NextResponse.json({ orderId: order.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[orders] unhandled error:', message)
    return NextResponse.json({ error: 'Error interno del servidor', detail: message }, { status: 500 })
  }
}
