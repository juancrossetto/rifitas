import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      raffle: true,
      tickets: { orderBy: { number: 'asc' } },
    },
  })

  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  return NextResponse.json(order)
}
