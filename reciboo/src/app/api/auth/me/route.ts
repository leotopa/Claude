import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json(null, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, email: true, name: true, role: true },
  })

  return NextResponse.json(user)
}
