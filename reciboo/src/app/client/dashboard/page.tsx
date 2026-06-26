import { createServerSupabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ReceiptCard from '@/components/receipt/ReceiptCard'
import { formatCurrency } from '@/lib/utils'
import { Receipt, TrendingDown, Calendar, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default async function ClientDashboard() {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      receipts: {
        include: {
          establishment: { select: { name: true, address: true } },
          receiptItems: true,
        },
        orderBy: { date: 'desc' },
      },
    },
  })

  if (!user) redirect('/auth/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  type ReceiptRow = { id: string; date: Date; totalAmount: number; status: string; establishment: { name: string }; receiptItems: { id: string }[] }
  const allReceipts: ReceiptRow[] = (user as any).receipts ?? []
  const monthReceipts = allReceipts.filter((r) => new Date(r.date) >= startOfMonth)
  const totalSpentMonth = monthReceipts.reduce((sum, r) => sum + r.totalAmount, 0)

  const groupedByDate = allReceipts.reduce<Record<string, ReceiptRow[]>>((acc, receipt) => {
    const dateKey = new Date(receipt.date).toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(receipt)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user.name.split(' ')[0]}
        </h1>
        <p className="text-reciboo-gray">Os teus recibos digitais</p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-reciboo-teal/10">
              <TrendingDown className="h-5 w-5 text-reciboo-teal" />
            </div>
            <div>
              <p className="text-xs font-medium text-reciboo-gray uppercase tracking-wide">Gasto este mês</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpentMonth)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-reciboo-amber/10">
              <Receipt className="h-5 w-5 text-reciboo-amber" />
            </div>
            <div>
              <p className="text-xs font-medium text-reciboo-gray uppercase tracking-wide">Recibos este mês</p>
              <p className="text-2xl font-bold text-gray-900">{monthReceipts.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
              <Tag className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-reciboo-gray uppercase tracking-wide">Total de recibos</p>
              <p className="text-2xl font-bold text-gray-900">{allReceipts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt list */}
      {allReceipts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold text-gray-700">Ainda sem recibos</h3>
          <p className="text-sm text-reciboo-gray">
            Os teus recibos digitais aparecerão aqui quando pagares num estabelecimento Reciboo.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, receipts]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-reciboo-gray" />
                <h2 className="text-sm font-semibold text-reciboo-gray capitalize">{date}</h2>
              </div>
              <div className="space-y-2">
                {receipts.map((receipt) => (
                  <ReceiptCard
                    key={receipt.id}
                    id={receipt.id}
                    establishmentName={receipt.establishment.name}
                    date={receipt.date}
                    totalAmount={receipt.totalAmount}
                    status={receipt.status as 'OPEN' | 'SPLIT_IN_PROGRESS' | 'CLOSED'}
                    itemCount={receipt.receiptItems.length}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
