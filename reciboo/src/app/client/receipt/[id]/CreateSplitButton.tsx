'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

export default function CreateSplitButton({ receiptId }: { receiptId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCreateSplit() {
    setLoading(true)
    const res = await fetch('/api/splits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptId }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/client/split/${data.splitGroupId}`)
    } else {
      alert('Erro ao criar divisão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <Button className="w-full" onClick={handleCreateSplit} disabled={loading}>
      <Users className="h-4 w-4 mr-2" />
      {loading ? 'A criar divisão...' : 'Dividir conta'}
    </Button>
  )
}
