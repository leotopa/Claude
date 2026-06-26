import { createServerSupabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { name: true, role: true },
  })

  if (!user || user.role !== 'CLIENT') {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-reciboo-offwhite">
      <Navbar role="CLIENT" userName={user.name} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
