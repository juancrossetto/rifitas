import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['confirm', 'reject']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })

  const order = await prisma.order.findUnique({
    where: { id },
    include: { tickets: true },
  })
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  if (parsed.data.action === 'confirm') {
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      }),
      prisma.ticket.updateMany({
        where: { orderId: id },
        data: { status: 'SOLD' },
      }),
    ])
  } else {
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      prisma.ticket.updateMany({
        where: { orderId: id },
        data: { status: 'AVAILABLE', orderId: null },
      }),
    ])
  }

  return NextResponse.json({ ok: true })
}
