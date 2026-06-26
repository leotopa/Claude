import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true },
      })

      if (user?.role === 'ESTABLISHMENT') {
        return NextResponse.redirect(new URL('/establishment/dashboard', requestUrl.origin))
      }
      return NextResponse.redirect(new URL('/client/dashboard', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}
