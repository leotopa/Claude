'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Receipt, User, Mail, Lock, Store, Smartphone, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Role = 'CLIENT' | 'ESTABLISHMENT'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [role, setRole] = useState<Role>((params.get('role') as Role) || 'CLIENT')
  const [name, setName] = useState('')
  const [establishmentName, setEstablishmentName] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('A password deve ter pelo menos 8 caracteres.')
      setLoading(false)
      return
    }

    const supabase = createBrowserSupabase()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabaseId: authData.user?.id,
        email,
        name,
        role,
        establishmentName: role === 'ESTABLISHMENT' ? establishmentName : undefined,
        address: role === 'ESTABLISHMENT' ? address : undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    if (role === 'ESTABLISHMENT') {
      router.push('/establishment/dashboard')
    } else {
      router.push('/client/dashboard')
    }
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-reciboo-dark flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-reciboo-teal">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Reciboo</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="mt-1 text-white/60">Escolhe o teu perfil para começar</p>
        </div>

        {/* Role selector */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
              role === 'CLIENT'
                ? 'border-reciboo-teal bg-reciboo-teal/10 text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
            }`}
          >
            <Smartphone className={`h-6 w-6 ${role === 'CLIENT' ? 'text-reciboo-teal' : ''}`} />
            <span className="text-sm font-semibold">Sou Cliente</span>
            <span className="text-xs opacity-70">Grátis para sempre</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('ESTABLISHMENT')}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
              role === 'ESTABLISHMENT'
                ? 'border-reciboo-amber bg-reciboo-amber/10 text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
            }`}
          >
            <Store className={`h-6 w-6 ${role === 'ESTABLISHMENT' ? 'text-reciboo-amber' : ''}`} />
            <span className="text-sm font-semibold">Sou Estabelecimento</span>
            <span className="text-xs opacity-70">30 dias grátis</span>
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O teu nome"
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30"
                  required
                />
              </div>
            </div>

            {role === 'ESTABLISHMENT' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Nome do estabelecimento</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      value={establishmentName}
                      onChange={(e) => setEstablishmentName(e.target.value)}
                      placeholder="Café Central"
                      className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      required={role === 'ESTABLISHMENT'}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white/80">Morada</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua das Flores 12, Lisboa"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    required={role === 'ESTABLISHMENT'}
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="o.teu@email.pt"
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30"
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
                  placeholder="Mínimo 8 caracteres"
                  className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/30"
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

            <Button
              type="submit"
              className={`w-full ${role === 'ESTABLISHMENT' ? 'bg-reciboo-amber hover:bg-[#cc8400]' : ''}`}
              size="lg"
              disabled={loading}
            >
              {loading ? 'A criar conta...' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            Já tens conta?{' '}
            <Link href="/auth/login" className="text-reciboo-teal hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-reciboo-dark" />}>
      <RegisterForm />
    </Suspense>
  )
}
