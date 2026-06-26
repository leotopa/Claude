'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, calcTax } from '@/lib/utils'
import { Plus, Trash2, Smartphone, Receipt, QrCode, CheckCircle } from 'lucide-react'
import QRDisplay from './QRDisplay'

interface Item {
  id: string
  name: string
  price: string
  quantity: string
}

export default function EmitReceiptPage() {
  const [items, setItems] = useState<Item[]>([{ id: '1', name: '', price: '', quantity: '1' }])
  const [gratuity, setGratuity] = useState('0')
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), name: '', price: '', quantity: '1' },
    ])
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateItem(id: string, field: keyof Item, value: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0
    const qty = parseInt(item.quantity) || 1
    return sum + price * qty
  }, 0)

  const tax = calcTax(subtotal)
  const gratuityAmount = parseFloat(gratuity) || 0
  const total = subtotal + tax + gratuityAmount

  async function handleEmit() {
    setError('')
    const validItems = items.filter((i) => i.name && parseFloat(i.price) > 0)
    if (validItems.length === 0) {
      setError('Adicione pelo menos um item com nome e preço.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: validItems.map((i) => ({
          name: i.name,
          price: parseFloat(i.price),
          quantity: parseInt(i.quantity) || 1,
        })),
        subtotal,
        tax,
        gratuity: gratuityAmount,
        totalAmount: total,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setQrCode(data.qrCode)
      setReceiptId(data.id)
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao emitir recibo.')
    }
    setLoading(false)
  }

  function resetForm() {
    setItems([{ id: '1', name: '', price: '', quantity: '1' }])
    setGratuity('0')
    setQrCode(null)
    setReceiptId(null)
    setError('')
  }

  if (qrCode && receiptId) {
    return <QRDisplay qrCode={qrCode} receiptId={receiptId} total={total} onReset={resetForm} />
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Emitir recibo</h1>
        <p className="text-reciboo-mint/70">Preencha os itens e emita via NFC/QR Code</p>
      </div>

      <Card className="border border-white/10 bg-white/5 mb-4">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Receipt className="h-4 w-4 text-reciboo-teal" />
            Itens do recibo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-white/40 uppercase tracking-wide px-1">
            <span className="col-span-6">Descrição</span>
            <span className="col-span-3">Preço (€)</span>
            <span className="col-span-2">Qtd</span>
            <span className="col-span-1" />
          </div>

          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <Input
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                placeholder="Bica, Tosta, ..."
                className="col-span-6 bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm"
              />
              <Input
                type="number"
                value={item.price}
                onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="col-span-3 bg-white/10 border-white/20 text-white placeholder:text-white/30 h-9 text-sm"
              />
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                min="1"
                className="col-span-2 bg-white/10 border-white/20 text-white h-9 text-sm"
              />
              <button
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
                className="col-span-1 flex items-center justify-center text-white/30 hover:text-red-400 disabled:opacity-20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Button variant="ghost" size="sm" onClick={addItem} className="text-reciboo-teal hover:text-reciboo-teal hover:bg-reciboo-teal/10 w-full border border-dashed border-reciboo-teal/30 mt-2">
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar item
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-white/10 bg-white/5 mb-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm font-medium text-white/80 w-32">Gorjeta (€)</label>
            <Input
              type="number"
              value={gratuity}
              onChange={(e) => setGratuity(e.target.value)}
              min="0"
              step="0.50"
              className="bg-white/10 border-white/20 text-white h-9 text-sm max-w-32"
            />
          </div>

          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="flex justify-between text-sm text-white/60">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>IVA (23%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            {gratuityAmount > 0 && (
              <div className="flex justify-between text-sm text-white/60">
                <span>Gorjeta</span>
                <span>{formatCurrency(gratuityAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2">
              <span>Total</span>
              <span className="text-reciboo-teal text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button
        onClick={handleEmit}
        disabled={loading}
        size="lg"
        className="w-full gap-2"
      >
        <Smartphone className="h-5 w-5" />
        {loading ? 'A emitir...' : 'Emitir via NFC / QR Code'}
      </Button>
    </div>
  )
}
