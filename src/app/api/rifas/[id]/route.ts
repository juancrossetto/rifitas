import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const raffle = await prisma.raffle.findUnique({
    where: { slug: id },
    include: {
      tickets: { orderBy: { number: 'asc' } },
    },
  })

  if (!raffle) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  return NextResponse.json(raffle)
}
