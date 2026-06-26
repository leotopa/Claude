'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Copy, Share2, CheckCircle, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Member {
  id: string
  name: string
  amountOwed: number
  status: string
  paidAt: Date | null
}

interface Props {
  splitGroupId: string
  shareLink: string
  initialMembers: Member[]
}

export default function SplitRealtimeWrapper({ splitGroupId, shareLink, initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabase()
    const channel = supabase
      .channel(`split:${splitGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'SplitMember',
          filter: `splitGroupId=eq.${splitGroupId}`,
        },
        (payload) => {
          setMembers((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? { ...m, status: payload.new.status, paidAt: payload.new.paidAt }
                : m
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'SplitMember',
          filter: `splitGroupId=eq.${splitGroupId}`,
        },
        (payload) => {
          setMembers((prev) => [
            ...prev,
            {
              id: payload.new.id,
              name: payload.new.name,
              amountOwed: payload.new.amountOwed,
              status: payload.new.status,
              paidAt: payload.new.paidAt,
            },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [splitGroupId])

  async function copyLink() {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareWhatsApp() {
    const text = `Divide a conta comigo no Reciboo: ${shareLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={copyLink} className="text-xs">
        {copied ? <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
        {copied ? 'Copiado!' : 'Copiar link'}
      </Button>
      <Button variant="outline" size="sm" onClick={shareWhatsApp} className="text-xs text-green-600 border-green-200 hover:bg-green-50">
        <Share2 className="h-3.5 w-3.5 mr-1.5" />
        WhatsApp
      </Button>

      {/* Live member list — rendered here for realtime updates */}
      <div className="col-span-2 mt-2 space-y-1">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                m.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-800">{m.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{formatCurrency(m.amountOwed)}</span>
              {m.status === 'PAID'
                ? <CheckCircle className="h-4 w-4 text-green-500" />
                : <Clock className="h-4 w-4 text-gray-300" />
              }
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
