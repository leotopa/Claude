import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Store, Calendar, ChevronRight } from 'lucide-react'

interface ReceiptCardProps {
  id: string
  establishmentName: string
  date: Date | string
  totalAmount: number
  status: 'OPEN' | 'SPLIT_IN_PROGRESS' | 'CLOSED'
  itemCount: number
}

const statusConfig = {
  OPEN: { label: 'Aberto', variant: 'default' as const },
  SPLIT_IN_PROGRESS: { label: 'A dividir', variant: 'amber' as const },
  CLOSED: { label: 'Fechado', variant: 'secondary' as const },
}

export default function ReceiptCard({
  id,
  establishmentName,
  date,
  totalAmount,
  status,
  itemCount,
}: ReceiptCardProps) {
  const { label, variant } = statusConfig[status]

  return (
    <Link href={`/client/receipt/${id}`}>
      <Card className="card-hover cursor-pointer border-0 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-reciboo-teal/10">
            <Store className="h-5 w-5 text-reciboo-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{establishmentName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">{formatDate(date)}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
            <Badge variant={variant}>{label}</Badge>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
        </CardContent>
      </Card>
    </Link>
  )
}
