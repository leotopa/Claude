import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  supabaseId: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['CLIENT', 'ESTABLISHMENT']),
  establishmentName: z.string().optional(),
  address: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      if (existing.role === data.role) {
        return NextResponse.json({ userId: existing.id })
      }
      return NextResponse.json({ error: 'Conta já existe com papel diferente.' }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
      },
    })

    if (data.role === 'ESTABLISHMENT') {
      await prisma.establishment.create({
        data: {
          userId: user.id,
          name: data.establishmentName || data.name,
          address: data.address || '',
          subscriptionPlan: 'STARTER',
          subscriptionStatus: 'TRIAL',
        },
      })
    }

    return NextResponse.json({ userId: user.id }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
