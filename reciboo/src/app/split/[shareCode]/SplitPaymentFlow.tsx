'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, calcItemShare } from '@/lib/utils'
import { Receipt, CheckCircle, Store, Users, CreditCard, ChevronRight } from 'lucide-react'
import StripePaymentWrapper from './StripePaymentWrapper'

interface Item {
  id: string
  name: string
  price: number
  quantity: number
}

interface SplitGroupData {
  id: string
  shareCode: string
  totalAmount: number
  amountCollected: number
  status: string
  receipt: {
    id: string
    subtotal: number
    tax: number
    gratuity: number
    totalAmount: number
    establishment: { name: string; address: string }
    items: Item[]
  }
  members: { id: string; name: string; amountOwed: number; status: string }[]
}

type Step = 'name' | 'items' | 'payment' | 'success'

export default function SplitPaymentFlow({ splitGroup }: { splitGroup: SplitGroupData }) {
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [memberId, setMemberId] = useState<string | null>(null)
  const [myShare, setMyShare] = useState(0)

  const isCompleted = splitGroup.status === 'COMPLETED'

  function toggleItem(itemId: string, qty: number) {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return { ...prev, [itemId]: qty }
    })
  }

  const selectedItemData = splitGroup.receipt.items.filter((i) => selectedItems[i.id])
  const mySubtotal = selectedItemData.reduce((sum, i) => sum + i.price * (selectedItems[i.id] ?? 1), 0)
  const myShareAmount = calcItemShare(mySubtotal, splitGroup.receipt.subtotal, splitGroup.receipt.tax, splitGroup.receipt.gratuity)

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setStep('items')
  }

  async function handleItemsSubmit() {
    if (mySubtotal === 0 && selectedItemData.length === 0) return

    const res = await fetch(`/api/splits/${splitGroup.shareCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: email || undefined,
        amountOwed: myShareAmount,
        selectedItems: selectedItemData.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: selectedItems[i.id],
        })),
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setMemberId(data.memberId)
      setMyShare(myShareAmount)
      setStep('payment')
    } else {
      alert('Erro ao registar. Tente novamente.')
    }
  }

  if (isCompleted) {
    return (
      <CompletedScreen establishmentName={splitGroup.receipt.establishment.name} />
    )
  }

  return (
    <div className="min-h-screen bg-reciboo-offwhite">
      {/* Header */}
      <div className="bg-reciboo-dark px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-reciboo-teal/20">
              <Receipt className="h-5 w-5 text-reciboo-teal" />
            </div>
            <div>
              <h1 className="font-bold text-white">{splitGroup.receipt.establishment.name}</h1>
              <p className="text-xs text-white/50">{splitGroup.receipt.establishment.address}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">Total da conta</span>
            <span className="font-bold text-reciboo-teal text-lg">
              {formatCurrency(splitGroup.receipt.totalAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-white/60 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {splitGroup.members.filter((m) => m.status === 'PAID').length}/{splitGroup.members.length} pagaram
            </span>
            <span className="text-white/60">
              Código: <strong className="text-reciboo-mint">{splitGroup.shareCode}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-6">
        {/* Step: Name */}
        {step === 'name' && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Qual é o teu nome?</h2>
              <p className="text-sm text-reciboo-gray mb-5">Para identificarmos a tua parte na conta.</p>
              <form onSubmit={handleNameSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nome</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="O teu nome"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email <span className="text-gray-400 font-normal">(opcional — para recibo)</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="o.teu@email.pt"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Continuar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step: Items */}
        {step === 'items' && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">O que consumiste?</h2>
              <p className="text-sm text-reciboo-gray mb-5">Seleciona os itens que foram teus.</p>

              <div className="space-y-2 mb-5">
                {splitGroup.receipt.items.map((item) => {
                  const selected = !!selectedItems[item.id]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id, item.quantity)}
                      className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        selected
                          ? 'border-reciboo-teal bg-reciboo-teal/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          selected ? 'border-reciboo-teal bg-reciboo-teal' : 'border-gray-300'
                        }`}>
                          {selected && <CheckCircle className="h-4 w-4 text-white" />}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="ml-2 text-xs text-gray-500">× {item.quantity}</span>
                          )}
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* My share preview */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 mb-5">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Os meus itens</span>
                  <span>{formatCurrency(mySubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>IVA proporcional</span>
                  <span>{formatCurrency(Math.max(0, myShareAmount - mySubtotal - (mySubtotal / splitGroup.receipt.subtotal || 0) * splitGroup.receipt.gratuity))}</span>
                </div>
                {splitGroup.receipt.gratuity > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Gorjeta proporcional</span>
                    <span>{formatCurrency((mySubtotal / (splitGroup.receipt.subtotal || 1)) * splitGroup.receipt.gratuity)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-1">
                  <span>A minha parte</span>
                  <span className="text-reciboo-teal">{formatCurrency(myShareAmount)}</span>
                </div>
              </div>

              <Button
                onClick={handleItemsSubmit}
                className="w-full"
                size="lg"
                disabled={mySubtotal === 0}
              >
                Pagar {formatCurrency(myShareAmount)}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="ghost"
                className="w-full mt-2 text-gray-500"
                onClick={() => setStep('name')}
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Payment */}
        {step === 'payment' && memberId && (
          <StripePaymentWrapper
            memberId={memberId}
            shareCode={splitGroup.shareCode}
            amount={myShare}
            memberName={name}
            onSuccess={() => setStep('success')}
            onBack={() => setStep('items')}
          />
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <Card className="border-0 shadow-sm text-center">
            <CardContent className="p-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Pagamento efetuado!</h2>
              <p className="text-reciboo-gray mb-1">
                Pagaste <strong className="text-gray-900">{formatCurrency(myShare)}</strong>
              </p>
              <p className="text-sm text-reciboo-gray">
                O teu pagamento foi confirmado e o anfitrião foi notificado.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Who has paid */}
        {splitGroup.members.length > 0 && step !== 'success' && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-reciboo-gray mb-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Estado dos pagamentos
            </h3>
            <div className="space-y-2">
              {splitGroup.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${m.status === 'PAID' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{formatCurrency(m.amountOwed)}</span>
                    {m.status === 'PAID' ? (
                      <Badge variant="success" className="text-xs">Pago</Badge>
                    ) : (
                      <Badge variant="pending" className="text-xs">Pendente</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CompletedScreen({ establishmentName }: { establishmentName: string }) {
  return (
    <div className="min-h-screen bg-reciboo-offwhite flex items-center justify-center px-4">
      <Card className="border-0 shadow-sm text-center max-w-sm w-full">
        <CardContent className="p-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Conta fechada!</h2>
          <p className="text-reciboo-gray">
            Todos pagaram a sua parte em <strong>{establishmentName}</strong>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
