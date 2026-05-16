import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  number: z.number().int().min(1),
  status: z.enum(['AVAILABLE', 'SOLD']),
  buyerName: z.string().optional(),
})

// GET: obtener todos los tickets de una rifa
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const tickets = await prisma.ticket.findMany({
    where: { raffleId: id },
    orderBy: { number: 'asc' },
    include: { order: { select: { buyerName: true, buyerPhone: true, paymentMethod: true } } },
  })

  return NextResponse.json(tickets)
}

// PATCH: marcar/desmarcar un número manualmente
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id: raffleId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { number, status, buyerName } = parsed.data

  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } })
  if (!raffle) return NextResponse.json({ error: 'Rifa no encontrada' }, { status: 404 })
  if (number > raffle.totalTickets) {
    return NextResponse.json({ error: 'Número fuera de rango' }, { status: 400 })
  }

  if (status === 'SOLD') {
    // Crear una orden manual si se marca como vendido manualmente
    const order = await prisma.order.create({
      data: {
        raffleId,
        buyerName: buyerName ?? 'Venta manual',
        buyerEmail: 'manual@admin',
        buyerPhone: '-',
        totalAmount: raffle.ticketPrice,
        paymentMethod: 'TRANSFER',
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    })

    await prisma.ticket.upsert({
      where: { raffleId_number: { raffleId, number } },
      create: { raffleId, number, status: 'SOLD', orderId: order.id },
      update: { status: 'SOLD', orderId: order.id },
    })
  } else {
    // Liberar el número
    await prisma.ticket.upsert({
      where: { raffleId_number: { raffleId, number } },
      create: { raffleId, number, status: 'AVAILABLE' },
      update: { status: 'AVAILABLE', orderId: null },
    })
  }

  return NextResponse.json({ ok: true })
}
