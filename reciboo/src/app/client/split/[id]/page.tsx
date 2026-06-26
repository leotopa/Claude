import { createServerSupabase } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ArrowLeft, CheckCircle, Clock, Copy, Share2, Users } from 'lucide-react'
import SplitRealtimeWrapper from './SplitRealtimeWrapper'

interface Props {
  params: { id: string }
}

export default async function SplitPage({ params }: Props) {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
  if (!user) redirect('/auth/login')

  const splitGroup = await prisma.splitGroup.findFirst({
    where: { id: params.id, hostUserId: user.id },
    include: {
      receipt: {
        include: { establishment: true, receiptItems: true },
      },
      splitMembers: {
        orderBy: { status: 'asc' },
      },
    },
  })

  if (!splitGroup) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const shareLink = `${appUrl}/split/${splitGroup.shareCode}`

  const paidCount = splitGroup.splitMembers.filter((m) => m.status === 'PAID').length
  const totalCount = splitGroup.splitMembers.length
  const remaining = splitGroup.totalAmount - splitGroup.amountCollected

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/client/receipt/${splitGroup.receiptId}`}>
          <Button variant="ghost" size="sm" className="text-reciboo-gray hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar ao recibo
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Divisão de conta</h1>
        <p className="text-reciboo-gray">{splitGroup.receipt.establishment.name}</p>
      </div>

      {/* Progress */}
      <Card className="border-0 shadow-sm mb-4">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-reciboo-teal" />
              <span className="text-sm font-medium text-gray-700">
                {paidCount} de {totalCount} pagaram
              </span>
            </div>
            <Badge variant={splitGroup.status === 'COMPLETED' ? 'success' : 'amber'}>
              {splitGroup.status === 'COMPLETED' ? 'Completo' : 'A recolher'}
            </Badge>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-reciboo-teal rounded-full transition-all duration-500"
              style={{ width: totalCount ? `${(paidCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-reciboo-gray">
              Recolhido: <strong className="text-gray-900">{formatCurrency(splitGroup.amountCollected)}</strong>
            </span>
            <span className="text-reciboo-gray">
              Em falta: <strong className="text-reciboo-amber">{formatCurrency(remaining)}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Share link */}
      <Card className="border-0 shadow-sm mb-4">
        <CardContent className="p-5">
          <h2 className="text-sm font-semibold text-reciboo-gray uppercase tracking-wide mb-3">Partilhar link</h2>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
            <span className="flex-1 text-sm text-gray-600 truncate">{shareLink}</span>
            <span className="text-xs font-bold text-reciboo-teal bg-reciboo-teal/10 px-2 py-0.5 rounded">
              {splitGroup.shareCode}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SplitRealtimeWrapper
              splitGroupId={splitGroup.id}
              shareLink={shareLink}
              initialMembers={splitGroup.splitMembers.map(m => ({
                id: m.id,
                name: m.name,
                amountOwed: m.amountOwed,
                status: m.status,
                paidAt: m.paidAt,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Participantes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {splitGroup.splitMembers.length === 0 ? (
            <div className="px-6 pb-6 text-center text-sm text-reciboo-gray">
              Ainda ninguém acedeu ao link.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {splitGroup.splitMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      member.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                      {member.paidAt && (
                        <p className="text-xs text-reciboo-gray">{formatDateTime(member.paidAt)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{formatCurrency(member.amountOwed)}</span>
                    {member.status === 'PAID' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
