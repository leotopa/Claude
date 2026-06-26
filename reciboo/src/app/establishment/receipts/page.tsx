import { createServerSupabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Receipt, Filter } from 'lucide-react'

export default async function EstablishmentReceipts() {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      establishment: {
        include: {
          receipts: {
            include: {
              receiptItems: true,
              client: { select: { name: true, email: true } },
              splitGroup: {
                include: { splitMembers: true },
              },
            },
            orderBy: { date: 'desc' },
          },
        },
      },
    },
  })

  if (!user?.establishment) redirect('/auth/login')

  const receipts = user.establishment.receipts

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Todos os recibos</h1>
          <p className="text-reciboo-mint/70">{receipts.length} recibos no total</p>
        </div>
      </div>

      {receipts.length === 0 ? (
        <Card className="border border-white/10 bg-white/5">
          <CardContent className="py-16 text-center">
            <Receipt className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <h3 className="text-lg font-semibold text-white/60 mb-1">Ainda sem recibos</h3>
            <p className="text-sm text-white/40">Os recibos emitidos aparecerão aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-white/10 bg-white/5">
          <div className="divide-y divide-white/5">
            {receipts.map((receipt) => {
              const paidMembers = receipt.splitGroup?.splitMembers.filter((m) => m.status === 'PAID').length ?? 0
              const totalMembers = receipt.splitGroup?.splitMembers.length ?? 0

              return (
                <div key={receipt.id} className="px-6 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">
                          {receipt.client?.name ?? 'Cliente anónimo'}
                        </span>
                        {receipt.client?.email && (
                          <span className="text-xs text-white/40">{receipt.client.email}</span>
                        )}
                      </div>
                      <p className="text-xs text-white/50">{formatDateTime(receipt.date)}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {receipt.receiptItems.map((item) => (
                          <span key={item.id} className="text-xs text-white/40 bg-white/5 rounded px-1.5 py-0.5">
                            {item.quantity}× {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCurrency(receipt.totalAmount)}</p>
                        {receipt.splitGroup && (
                          <p className="text-xs text-reciboo-mint/70">
                            {paidMembers}/{totalMembers} pagaram
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          receipt.status === 'OPEN' ? 'default' :
                          receipt.status === 'SPLIT_IN_PROGRESS' ? 'amber' : 'secondary'
                        }
                      >
                        {receipt.status === 'OPEN' ? 'Aberto' :
                         receipt.status === 'SPLIT_IN_PROGRESS' ? 'A dividir' : 'Fechado'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
