import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { uploadRaffleImage, deleteRaffleImage } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await uploadRaffleImage(buffer)

  return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { publicId } = await req.json()
  if (!publicId) return NextResponse.json({ error: 'publicId requerido' }, { status: 400 })

  await deleteRaffleImage(publicId).catch(() => null)
  return NextResponse.json({ ok: true })
}
