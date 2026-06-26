'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, QrCode, RefreshCw, Smartphone } from 'lucide-react'

interface Props {
  qrCode: string
  receiptId: string
  total: number
  onReset: () => void
}

export default function QRDisplay({ qrCode, receiptId, total, onReset }: Props) {
  return (
    <div className="max-w-sm mx-auto text-center">
      <div className="mb-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-reciboo-teal/20 mb-4">
          <CheckCircle className="h-8 w-8 text-reciboo-teal" />
        </div>
        <h1 className="text-2xl font-bold text-white">Recibo emitido!</h1>
        <p className="text-reciboo-mint/70 mt-1">Total: <strong className="text-white">{formatCurrency(total)}</strong></p>
      </div>

      <Card className="border border-white/10 bg-white p-2 mb-6 inline-block rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCode} alt="QR Code do recibo" className="w-64 h-64 rounded-xl" />
      </Card>

      <div className="mb-6 rounded-xl border border-reciboo-teal/30 bg-reciboo-teal/10 px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-reciboo-mint text-sm">
          <Smartphone className="h-4 w-4" />
          <span>O cliente aponta a câmara para receber o recibo</span>
        </div>
      </div>

      <Button onClick={onReset} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 gap-2">
        <RefreshCw className="h-4 w-4" />
        Emitir novo recibo
      </Button>
    </div>
  )
}
