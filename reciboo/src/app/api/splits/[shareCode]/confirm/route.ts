import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  memberId: z.string(),
})

export async function POST(
  req: Request,
  { params }: { params: { shareCode: string } }
) {
  try {
    const splitGroup = await prisma.splitGroup.findUnique({
      where: { shareCode: params.shareCode.toUpperCase() },
      include: { splitMembers: true },
    })

    if (!splitGroup) {
      return NextResponse.json({ error: 'Divisão não encontrada.' }, { status: 404 })
    }

    const body = await req.json()
    const { memberId } = schema.parse(body)

    const member = await prisma.splitMember.findUnique({ where: { id: memberId } })
    if (!member || member.splitGroupId !== splitGroup.id) {
      return NextResponse.json({ error: 'Participante não encontrado.' }, { status: 404 })
    }

    await prisma.splitMember.update({
      where: { id: memberId },
      data: {
        status: 'PAID',
        amountPaid: member.amountOwed,
        paidAt: new Date(),
        paymentMethod: 'stripe',
      },
    })

    const newAmountCollected = splitGroup.amountCollected + member.amountOwed

    const allPaid = splitGroup.splitMembers
      .filter((m: { id: string; status: string }) => m.id !== memberId)
      .every((m: { id: string; status: string }) => m.status === 'PAID')

    await prisma.splitGroup.update({
      where: { id: splitGroup.id },
      data: {
        amountCollected: newAmountCollected,
        status: allPaid ? 'COMPLETED' : 'COLLECTING',
      },
    })

    if (allPaid) {
      await prisma.receipt.update({
        where: { id: splitGroup.receiptId },
        data: { status: 'CLOSED' },
      })
    }

    return NextResponse.json({ ok: true, allPaid })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
