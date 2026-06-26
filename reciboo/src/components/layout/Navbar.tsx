'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Receipt, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface NavbarProps {
  role?: 'CLIENT' | 'ESTABLISHMENT'
  userName?: string
}

export default function Navbar({ role, userName }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isEstablishment = role === 'ESTABLISHMENT'

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-reciboo-dark/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-reciboo-teal">
            <Receipt className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Reciboo
          </span>
        </Link>

        {role && (
          <div className="hidden md:flex items-center gap-6">
            {isEstablishment ? (
              <>
                <NavLink href="/establishment/dashboard" current={pathname}>Dashboard</NavLink>
                <NavLink href="/establishment/receipts" current={pathname}>Recibos</NavLink>
                <NavLink href="/establishment/emit" current={pathname}>Emitir</NavLink>
              </>
            ) : (
              <>
                <NavLink href="/client/dashboard" current={pathname}>Os meus recibos</NavLink>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {role ? (
            <>
              <span className="hidden md:block text-sm text-reciboo-mint">{userName}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:text-reciboo-mint hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-1.5" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-white hover:text-reciboo-mint hover:bg-white/10">
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" variant="default">
                  Registar
                </Button>
              </Link>
            </>
          )}
          {role && (
            <button
              className="md:hidden text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {mobileOpen && role && (
        <div className="md:hidden border-t border-white/10 bg-reciboo-dark px-4 py-3 flex flex-col gap-2">
          {isEstablishment ? (
            <>
              <MobileNavLink href="/establishment/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</MobileNavLink>
              <MobileNavLink href="/establishment/receipts" onClick={() => setMobileOpen(false)}>Recibos</MobileNavLink>
              <MobileNavLink href="/establishment/emit" onClick={() => setMobileOpen(false)}>Emitir</MobileNavLink>
            </>
          ) : (
            <MobileNavLink href="/client/dashboard" onClick={() => setMobileOpen(false)}>Os meus recibos</MobileNavLink>
          )}
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, current, children }: { href: string; current: string; children: React.ReactNode }) {
  const isActive = current === href || current.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        isActive ? 'text-reciboo-teal' : 'text-white/70 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  )
}
