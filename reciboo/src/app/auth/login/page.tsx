'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Receipt, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserSupabase()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email ou password incorretos.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/me')
    const user = await res.json()

    if (user?.role === 'ESTABLISHMENT') {
      router.push('/establishment/dashboard')
    } else {
      router.push('/client/dashboard')
    }
    router.refresh()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      setError('Introduza o seu email.')
      return
    }
    setLoading(true)
    const supabase = createBrowserSupabase()
    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (magicError) {
      setError('Erro ao enviar link. Tente novamente.')
    } else {
      setError('')
      alert('Link enviado para o seu email!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-reciboo-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-reciboo-teal">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Reciboo</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
          <p className="mt-1 text-white/60">Entra na tua conta Reciboo</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="o.teu@email.pt"
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-reciboo-teal"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-reciboo-teal"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'A entrar...' : 'Entrar'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-white/40">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
            onClick={handleMagicLink}
            disabled={loading}
          >
            <Mail className="h-4 w-4 mr-2" />
            Entrar com link mágico
          </Button>

          <p className="mt-6 text-center text-sm text-white/50">
            Ainda não tens conta?{' '}
            <Link href="/auth/register" className="text-reciboo-teal hover:underline font-medium">
              Registar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
