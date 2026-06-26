import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import QRCode from 'qrcode'

const itemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
})

const schema = z.object({
  items: z.array(itemSchema).min(1),
  subtotal: z.number(),
  tax: z.number(),
  gratuity: z.number().default(0),
  totalAmount: z.number(),
})

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { establishment: true },
    })

    if (!user?.establishment) {
      return NextResponse.json({ error: 'Apenas estabelecimentos podem emitir recibos.' }, { status: 403 })
    }

    const body = await req.json()
    const data = schema.parse(body)

    const receipt = await prisma.receipt.create({
      data: {
        establishmentId: user.establishment.id,
        subtotal: data.subtotal,
        tax: data.tax,
        gratuity: data.gratuity,
        totalAmount: data.totalAmount,
        items: data.items,
        status: 'OPEN',
        receiptItems: {
          create: data.items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const receiptUrl = `${appUrl}/api/nfc/receive?receiptId=${receipt.id}`
    const qrCode = await QRCode.toDataURL(receiptUrl, { width: 256, margin: 2 })

    const updated = await prisma.receipt.update({
      where: { id: receipt.id },
      data: { qrCode },
    })

    await prisma.establishment.update({
      where: { id: user.establishment.id },
      data: { monthlyReceiptCount: { increment: 1 } },
    })

    return NextResponse.json({ id: receipt.id, qrCode }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { establishment: true },
  })

  if (!user) return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 })

  if (user.role === 'ESTABLISHMENT' && user.establishment) {
    const receipts = await prisma.receipt.findMany({
      where: { establishmentId: user.establishment.id },
      include: { receiptItems: true, client: { select: { name: true, email: true } } },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(receipts)
  }

  const receipts = await prisma.receipt.findMany({
    where: { clientId: user.id },
    include: { receiptItems: true, establishment: { select: { name: true, address: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(receipts)
}
