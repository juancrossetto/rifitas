import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { deleteRaffleImage } from '@/lib/cloudinary'
import { z } from 'zod'

const patchSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  cloudinaryIds: z.array(z.string()).optional(),
  totalTickets: z.number().int().min(10).optional(),
  ticketPrice: z.number().min(1).optional(),
  prizes: z.array(z.string().min(1)).min(1).max(5).optional(),
  drawDate: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'FINISHED']).optional(),
  paymentMethods: z.array(z.enum(['MERCADOPAGO', 'WHATSAPP', 'TRANSFER'])).min(1).optional(),
  whatsappNumber: z.string().optional(),
  bankHolder: z.string().optional(),
  bankCbu: z.string().optional(),
  bankAlias: z.string().optional(),
  bankNote: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.issues }, { status: 400 })
    }

    const raffle = await prisma.raffle.update({ where: { id }, data: parsed.data })
    return NextResponse.json(raffle)
  } catch (err) {
    console.error('[PATCH /api/admin/rifas/[id]]', err)
    const msg = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const raffle = await prisma.raffle.findUnique({ where: { id } })

  if (raffle?.cloudinaryIds?.length) {
    await Promise.all(raffle.cloudinaryIds.map((id) => deleteRaffleImage(id).catch(() => null)))
  }

  await prisma.raffle.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
