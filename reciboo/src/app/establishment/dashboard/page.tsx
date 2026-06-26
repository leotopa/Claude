import { createServerSupabase } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Receipt, TrendingUp, Users, Zap, Plus, ArrowRight } from 'lucide-react'

export default async function EstablishmentDashboard() {
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
              splitGroup: { include: { splitMembers: true } },
            },
            orderBy: { date: 'desc' },
          },
        },
      },
    },
  })

  if (!user?.establishment) redirect('/auth/login')

  const est = user.establishment
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const todayReceipts = est.receipts.filter((r) => new Date(r.date) >= startOfToday)
  const monthReceipts = est.receipts.filter((r) => new Date(r.date) >= startOfMonth)
  const activeSplits = est.receipts.filter((r) => r.status === 'SPLIT_IN_PROGRESS').length

  const todayRevenue = todayReceipts.reduce((s, r) => s + r.totalAmount, 0)
  const monthRevenue = monthReceipts.reduce((s, r) => s + r.totalAmount, 0)

  const planLabels = { STARTER: 'Starter', GROWTH: 'Growth', ENTERPRISE: 'Enterprise' }
  const planColors = { STARTER: 'default', GROWTH: 'amber', ENTERPRISE: 'success' } as const

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{est.name}</h1>
          <p className="text-reciboo-mint/70">{est.address}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={planColors[est.subscriptionPlan]}>
            {planLabels[est.subscriptionPlan]}
          </Badge>
          <Link href="/establishment/emit">
            <Button size="sm" variant="amber">
              <Plus className="h-4 w-4 mr-1.5" />
              Emitir recibo
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Recibos hoje', value: todayReceipts.length, icon: Receipt, color: 'text-reciboo-teal', bg: 'bg-reciboo-teal/20' },
          { label: 'Recibos este mês', value: monthReceipts.length, icon: TrendingUp, color: 'text-reciboo-mint', bg: 'bg-reciboo-mint/20' },
          { label: 'Receita hoje', value: formatCurrency(todayRevenue), icon: Zap, color: 'text-reciboo-amber', bg: 'bg-reciboo-amber/20' },
          { label: 'Divisões ativas', value: activeSplits, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border border-white/10 bg-white/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-white/50 uppercase tracking-wide">{label}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Month revenue */}
      <Card className="mb-8 border border-white/10 bg-gradient-to-r from-reciboo-teal/20 to-transparent">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-reciboo-mint/70 mb-1">Receita processada este mês</p>
            <p className="text-4xl font-extrabold text-white">{formatCurrency(monthRevenue)}</p>
          </div>
          <TrendingUp className="h-12 w-12 text-reciboo-teal/40" />
        </CardContent>
      </Card>

      {/* Recent receipts */}
      <Card className="border border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-base">Recibos recentes</CardTitle>
          <Link href="/establishment/receipts">
            <Button variant="ghost" size="sm" className="text-reciboo-mint hover:text-white hover:bg-white/10">
              Ver todos
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {est.receipts.length === 0 ? (
            <div className="px-6 pb-8 pt-4 text-center">
              <Receipt className="mx-auto mb-3 h-10 w-10 text-white/20" />
              <p className="text-white/40 text-sm">Ainda sem recibos. Emita o primeiro!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {est.receipts.slice(0, 8).map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {receipt.clientId ? 'Cliente registado' : 'Cliente anónimo'}
                    </p>
                    <p className="text-xs text-white/50">{formatDateTime(receipt.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{formatCurrency(receipt.totalAmount)}</span>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
