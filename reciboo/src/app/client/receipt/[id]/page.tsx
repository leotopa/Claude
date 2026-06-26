import { createServerSupabase } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ArrowLeft, Store, Calendar, Users, Receipt, Percent } from 'lucide-react'
import CreateSplitButton from './CreateSplitButton'

interface Props {
  params: { id: string }
}

export default async function ReceiptDetailPage({ params }: Props) {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
  if (!user) redirect('/auth/login')

  const receipt = await prisma.receipt.findFirst({
    where: { id: params.id, clientId: user.id },
    include: {
      establishment: true,
      receiptItems: true,
      splitGroup: {
        include: { splitMembers: true },
      },
    },
  })

  if (!receipt) notFound()

  const items = receipt.receiptItems

  const statusConfig = {
    OPEN: { label: 'Aberto', variant: 'default' as const },
    SPLIT_IN_PROGRESS: { label: 'A dividir', variant: 'amber' as const },
    CLOSED: { label: 'Fechado', variant: 'secondary' as const },
  }
  const { label, variant } = statusConfig[receipt.status]

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/client/dashboard">
          <Button variant="ghost" size="sm" className="text-reciboo-gray hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-reciboo-dark px-6 py-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-reciboo-teal/20">
              <Receipt className="h-6 w-6 text-reciboo-teal" />
            </div>
            <Badge variant={variant}>{label}</Badge>
          </div>
          <h1 className="text-xl font-bold text-white">{receipt.establishment.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-white/60 text-sm">
            <Store className="h-3.5 w-3.5" />
            <span>{receipt.establishment.address}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-white/60 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateTime(receipt.date)}</span>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Items */}
          <div className="px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-reciboo-gray mb-3">Itens</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-900 font-medium">{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="ml-2 text-xs text-reciboo-gray">× {item.quantity}</span>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 px-6 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-reciboo-gray">
                <span>Subtotal</span>
                <span>{formatCurrency(receipt.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-reciboo-gray">
                <span className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  IVA (23%)
                </span>
                <span>{formatCurrency(receipt.tax)}</span>
              </div>
              {receipt.gratuity > 0 && (
                <div className="flex justify-between text-sm text-reciboo-gray">
                  <span>Gorjeta</span>
                  <span>{formatCurrency(receipt.gratuity)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-reciboo-teal">{formatCurrency(receipt.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Split section */}
          <div className="border-t border-gray-100 px-6 py-4">
            {receipt.splitGroup ? (
              <div>
                <p className="text-sm text-reciboo-gray mb-3">
                  Divisão de conta em curso —{' '}
                  <span className="font-semibold text-reciboo-teal">
                    {receipt.splitGroup.splitMembers.filter((m) => m.status === 'PAID').length}/
                    {receipt.splitGroup.splitMembers.length}
                  </span>{' '}
                  pagaram
                </p>
                <Link href={`/client/split/${receipt.splitGroup.id}`}>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Ver divisão
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm text-reciboo-gray mb-3">
                  Divida esta conta com quem está na mesa. Cada pessoa escolhe o que consumiu.
                </p>
                <CreateSplitButton receiptId={receipt.id} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
