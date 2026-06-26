import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const receiptId = url.searchParams.get('receiptId')

  if (!receiptId) {
    return NextResponse.redirect(new URL('/', url.origin))
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const loginUrl = new URL('/auth/login', url.origin)
    loginUrl.searchParams.set('redirect', url.toString())
    return NextResponse.redirect(loginUrl)
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  })

  if (!user || user.role !== 'CLIENT') {
    return NextResponse.redirect(new URL('/auth/login', url.origin))
  }

  const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } })
  if (!receipt) {
    return NextResponse.redirect(new URL('/client/dashboard', url.origin))
  }

  if (!receipt.clientId) {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { clientId: user.id },
    })
  }

  return NextResponse.redirect(new URL(`/client/receipt/${receiptId}`, url.origin))
}
