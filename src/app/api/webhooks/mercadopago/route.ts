import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mpPayment } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.type !== 'payment') return NextResponse.json({ ok: true })

  const paymentId = body.data?.id
  if (!paymentId) return NextResponse.json({ ok: true })

  const payment = await mpPayment.get({ id: paymentId })
  const orderId = payment.external_reference

  if (!orderId) return NextResponse.json({ ok: true })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { tickets: true },
  })

  if (!order) return NextResponse.json({ ok: true })

  if (payment.status === 'approved') {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          mpPaymentId: String(paymentId),
          mpStatus: payment.status,
          confirmedAt: new Date(),
        },
      }),
      prisma.ticket.updateMany({
        where: { orderId },
        data: { status: 'SOLD' },
      }),
    ])
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED', mpStatus: payment.status },
      }),
      prisma.ticket.updateMany({
        where: { orderId },
        data: { status: 'AVAILABLE', orderId: null },
      }),
    ])
  }

  return NextResponse.json({ ok: true })
}
