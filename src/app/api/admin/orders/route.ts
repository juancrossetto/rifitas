import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const filter = searchParams.get('filter') // 'pending' | 'confirmed' | 'cancelled' | (empty = all)
  const raffleId = searchParams.get('raffleId')
  const method = searchParams.get('method') // 'MERCADOPAGO' | 'WHATSAPP' | 'TRANSFER'

  const statusMap: Record<string, string> = {
    pending: 'PENDING',
    confirmed: 'CONFIRMED',
    cancelled: 'CANCELLED',
  }

  const where = {
    ...(filter && statusMap[filter] ? { status: statusMap[filter] as 'PENDING' | 'CONFIRMED' | 'CANCELLED' } : {}),
    ...(raffleId ? { raffleId } : {}),
    ...(method ? { paymentMethod: method as 'MERCADOPAGO' | 'WHATSAPP' | 'TRANSFER' } : {}),
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      raffle: { select: { id: true, title: true, slug: true, ticketPrice: true } },
      tickets: { orderBy: { number: 'asc' } },
    },
  })

  // Calcular tiempo restante para las pendientes
  const now = new Date()
  const enriched = orders.map((o) => ({
    ...o,
    minutesLeft: o.expiresAt ? Math.max(0, Math.round((o.expiresAt.getTime() - now.getTime()) / 60000)) : null,
    isExpired: o.expiresAt ? o.expiresAt < now : false,
  }))

  return NextResponse.json(enriched)
}
