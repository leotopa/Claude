'use client'

import { useState, useEffect } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Lock, ChevronLeft } from 'lucide-react'

interface Props {
  memberId: string
  shareCode: string
  amount: number
  memberName: string
  onSuccess: () => void
  onBack: () => void
}

export default function StripePaymentWrapper({ memberId, shareCode, amount, memberName, onSuccess, onBack }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/splits/${shareCode}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, amount }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError('Erro ao iniciar pagamento.')
        }
      })
      .catch(() => setError('Erro de rede. Tente novamente.'))
      .finally(() => setLoading(false))
  }, [memberId, shareCode, amount])

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse flex flex-col gap-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !clientSecret) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center">
          <p className="text-red-500 mb-4">{error || 'Erro desconhecido.'}</p>
          <Button variant="outline" onClick={onBack}>Voltar</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Elements stripe={getStripe()} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <CheckoutForm
        amount={amount}
        memberName={memberName}
        memberId={memberId}
        shareCode={shareCode}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  )
}

function CheckoutForm({ amount, memberName, memberId, shareCode, onSuccess, onBack }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setPaying(true)
    setError('')

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message || 'Pagamento falhou.')
      setPaying(false)
      return
    }

    await fetch(`/api/splits/${shareCode}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })

    onSuccess()
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <CreditCard className="h-5 w-5 text-reciboo-teal" />
          <div>
            <h2 className="font-bold text-gray-900">Pagamento</h2>
            <p className="text-sm text-reciboo-gray">
              {memberName} · <strong className="text-gray-900">{formatCurrency(amount)}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handlePay} className="space-y-4">
          <PaymentElement />

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={paying || !stripe}>
            <Lock className="h-4 w-4 mr-2" />
            {paying ? 'A processar...' : `Pagar ${formatCurrency(amount)}`}
          </Button>

          <Button type="button" variant="ghost" className="w-full text-gray-500" onClick={onBack} disabled={paying}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar aos itens
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Lock className="h-3 w-3" />
          Pagamento seguro por Stripe
        </div>
      </CardContent>
    </Card>
  )
}
