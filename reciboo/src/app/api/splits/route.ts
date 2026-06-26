import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { generateShareCode } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  receiptId: z.string(),
})

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
    if (!user) return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 })

    const body = await req.json()
    const { receiptId } = schema.parse(body)

    const receipt = await prisma.receipt.findFirst({
      where: { id: receiptId, clientId: user.id },
    })

    if (!receipt) return NextResponse.json({ error: 'Recibo não encontrado.' }, { status: 404 })

    const existing = await prisma.splitGroup.findUnique({ where: { receiptId } })
    if (existing) return NextResponse.json({ splitGroupId: existing.id })

    let shareCode = generateShareCode()
    let attempts = 0
    while (attempts < 5) {
      const exists = await prisma.splitGroup.findUnique({ where: { shareCode } })
      if (!exists) break
      shareCode = generateShareCode()
      attempts++
    }

    const splitGroup = await prisma.splitGroup.create({
      data: {
        receiptId,
        hostUserId: user.id,
        totalAmount: receipt.totalAmount,
        amountCollected: 0,
        status: 'COLLECTING',
        shareCode,
      },
    })

    await prisma.receipt.update({
      where: { id: receiptId },
      data: { status: 'SPLIT_IN_PROGRESS' },
    })

    return NextResponse.json({ splitGroupId: splitGroup.id, shareCode }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
