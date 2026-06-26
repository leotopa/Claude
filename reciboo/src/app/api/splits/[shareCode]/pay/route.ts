import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const schema = z.object({
  memberId: z.string(),
  amount: z.number().positive(),
})

export async function POST(
  req: Request,
  { params }: { params: { shareCode: string } }
) {
  try {
    const splitGroup = await prisma.splitGroup.findUnique({
      where: { shareCode: params.shareCode.toUpperCase() },
      include: { receipt: { include: { establishment: true } } },
    })

    if (!splitGroup) {
      return NextResponse.json({ error: 'Divisão não encontrada.' }, { status: 404 })
    }

    const body = await req.json()
    const { memberId, amount } = schema.parse(body)

    const member = await prisma.splitMember.findUnique({ where: { id: memberId } })
    if (!member) {
      return NextResponse.json({ error: 'Participante não encontrado.' }, { status: 404 })
    }

    if (member.status === 'PAID') {
      return NextResponse.json({ error: 'Já pagou.' }, { status: 400 })
    }

    const amountCents = Math.round(amount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: {
        splitGroupId: splitGroup.id,
        memberId,
        shareCode: params.shareCode,
        establishmentName: splitGroup.receipt.establishment.name,
      },
      automatic_payment_methods: { enabled: true },
    })

    await prisma.splitMember.update({
      where: { id: memberId },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
