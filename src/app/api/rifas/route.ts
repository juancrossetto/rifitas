import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const raffles = await prisma.raffle.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { drawDate: 'asc' },
    include: {
      _count: { select: { tickets: true } },
    },
  })

  const withCounts = await Promise.all(
    raffles.map(async (raffle) => {
      const [soldCount, reservedCount] = await Promise.all([
        prisma.ticket.count({ where: { raffleId: raffle.id, status: 'SOLD' } }),
        prisma.ticket.count({ where: { raffleId: raffle.id, status: 'RESERVED' } }),
      ])
      return { ...raffle, soldCount, reservedCount }
    })
  )

  return NextResponse.json(withCounts)
}
