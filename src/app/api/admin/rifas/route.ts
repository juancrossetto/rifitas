import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { z } from 'zod'

const raffleSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  imageUrls: z.array(z.string().url()).default([]),
  cloudinaryIds: z.array(z.string()).default([]),
  totalTickets: z.number().int().min(10).max(10000),
  ticketPrice: z.number().min(1),
  prizes: z.array(z.string().min(1)).min(1).max(5),
  drawDate: z.string().datetime(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'FINISHED']),
  paymentMethods: z.array(z.enum(['MERCADOPAGO', 'WHATSAPP', 'TRANSFER'])).min(1),
  whatsappNumber: z.string().optional(),
  bankHolder: z.string().optional(),
  bankCbu: z.string().optional(),
  bankAlias: z.string().optional(),
  bankNote: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
})

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const raffles = await prisma.raffle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { tickets: true, orders: true } } },
  })

  const withStats = await Promise.all(
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

  return NextResponse.json(withStats)
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = raffleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 })
    }

    const raffle = await prisma.raffle.create({ data: parsed.data })
    return NextResponse.json(raffle, { status: 201 })
  } catch (err) {
    console.error('[POST /api/admin/rifas]', err)
    const msg = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
