import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  amountOwed: z.number().positive(),
  selectedItems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
  })),
})

export async function POST(
  req: Request,
  { params }: { params: { shareCode: string } }
) {
  try {
    const splitGroup = await prisma.splitGroup.findUnique({
      where: { shareCode: params.shareCode.toUpperCase() },
    })

    if (!splitGroup) {
      return NextResponse.json({ error: 'Divisão não encontrada.' }, { status: 404 })
    }

    if (splitGroup.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Esta divisão já foi concluída.' }, { status: 400 })
    }

    const body = await req.json()
    const data = schema.parse(body)

    const member = await prisma.splitMember.create({
      data: {
        splitGroupId: splitGroup.id,
        name: data.name,
        email: data.email,
        amountOwed: data.amountOwed,
        status: 'PENDING',
        selectedItems: data.selectedItems,
      },
    })

    return NextResponse.json({ memberId: member.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
