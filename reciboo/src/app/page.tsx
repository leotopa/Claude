import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Receipt, Smartphone, Users, Zap, Shield, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-reciboo-dark text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-reciboo-dark/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-reciboo-teal">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold">Reciboo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(10,147,150,0.15)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-reciboo-teal/30 bg-reciboo-teal/10 px-4 py-1.5 text-sm text-reciboo-mint">
            <Zap className="h-3.5 w-3.5" />
            Recibos digitais via NFC para Portugal
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
            O fim do{' '}
            <span className="text-gradient-teal">papel</span>
            <br />
            nas mesas portuguesas
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 leading-relaxed">
            Estabelecimentos emitem recibos digitais via NFC. Clientes recebem automaticamente no telemóvel. Dividam a conta na mesa, sem apps extras nem calculadoras.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/register?role=CLIENT">
              <Button size="xl" className="w-full sm:w-auto gap-2">
                <Smartphone className="h-5 w-5" />
                Sou Cliente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/register?role=ESTABLISHMENT">
              <Button size="xl" variant="outline" className="w-full sm:w-auto gap-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50">
                <Receipt className="h-5 w-5" />
                Sou Estabelecimento
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">Como funciona</h2>
          <p className="mb-16 text-center text-white/60">Três passos. Zero papel.</p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: Receipt,
                title: 'Estabelecimento emite',
                desc: 'O restaurante, café ou loja cria o recibo digitalmente com todos os itens, IVA e gorjeta.',
              },
              {
                step: '02',
                icon: Smartphone,
                title: 'Cliente toca & recebe',
                desc: 'Com um simples toque NFC (ou scan de QR no MVP), o recibo aparece automaticamente no telemóvel.',
              },
              {
                step: '03',
                icon: Users,
                title: 'Dividam a conta',
                desc: 'Cada pessoa escolhe o que consumiu. O sistema calcula a parte individual incluindo IVA e gorjeta.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-5xl font-black text-reciboo-teal/20">{step}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-reciboo-teal/20">
                    <Icon className="h-6 w-6 text-reciboo-teal" />
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold">{title}</h3>
                <p className="text-white/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features split */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Client side */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-reciboo-teal/20 px-3 py-1 text-sm text-reciboo-teal font-medium">
                <Smartphone className="h-3.5 w-3.5" />
                Para Clientes — Grátis
              </div>
              <h3 className="mb-6 text-2xl font-bold">A sua carteira digital de recibos</h3>
              <ul className="space-y-3">
                {[
                  'Receba recibos automaticamente por NFC',
                  'Organize por data, local e categoria',
                  'Veja o histórico de gastos ao detalhe',
                  'Divida contas com quem quiser',
                  'Pague a sua parte via cartão, Apple Pay ou Google Pay',
                  'Sem papéis, sem confusão',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-white/80">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-reciboo-teal mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register?role=CLIENT" className="mt-8 block">
                <Button className="w-full" size="lg">
                  Criar conta de cliente
                </Button>
              </Link>
            </div>

            {/* Establishment side */}
            <div className="rounded-2xl border border-reciboo-amber/20 bg-reciboo-amber/5 p-8">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-reciboo-amber/20 px-3 py-1 text-sm text-reciboo-amber font-medium">
                <Receipt className="h-3.5 w-3.5" />
                Para Estabelecimentos — A partir de €9/mês
              </div>
              <h3 className="mb-6 text-2xl font-bold">Modernize o seu negócio</h3>
              <ul className="space-y-3">
                {[
                  'Dispositivo NFC no balcão incluído',
                  'Emita recibos digitais em segundos',
                  'Dashboard de analytics em tempo real',
                  'Acompanhe divisões de conta ao vivo',
                  'Reduza custos com papel e impressão',
                  'Relatórios mensais automáticos',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-white/80">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-reciboo-amber mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register?role=ESTABLISHMENT" className="mt-8 block">
                <Button variant="amber" className="w-full" size="lg">
                  Experimentar 30 dias grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Planos para estabelecimentos</h2>
          <p className="mb-12 text-white/60">Clientes usam o Reciboo sempre grátis.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: '9',
                receipts: '200',
                features: ['Até 200 recibos/mês', 'Dashboard básico', 'QR Code + NFC', 'Suporte por email'],
              },
              {
                name: 'Growth',
                price: '29',
                receipts: '1.000',
                features: ['Até 1.000 recibos/mês', 'Analytics avançados', 'Divisão de conta', 'Relatórios PDF', 'Suporte prioritário'],
                popular: true,
              },
              {
                name: 'Enterprise',
                price: '79',
                receipts: 'Ilimitados',
                features: ['Recibos ilimitados', 'Multi-localização', 'API personalizada', 'Onboarding dedicado', 'SLA garantido'],
              },
            ].map(({ name, price, receipts, features, popular }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-6 text-left ${
                  popular
                    ? 'border-2 border-reciboo-teal bg-reciboo-teal/10'
                    : 'border border-white/10 bg-white/5'
                }`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-reciboo-teal px-3 py-1 text-xs font-bold text-white">
                      Mais popular
                    </span>
                  </div>
                )}
                <h3 className="mb-1 text-lg font-bold">{name}</h3>
                <div className="mb-1">
                  <span className="text-4xl font-extrabold">€{price}</span>
                  <span className="text-white/60">/mês</span>
                </div>
                <p className="mb-4 text-sm text-reciboo-mint">{receipts} recibos/mês</p>
                <ul className="mb-6 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-reciboo-teal" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register?role=ESTABLISHMENT">
                  <Button variant={popular ? 'default' : 'outline'} className={`w-full ${!popular ? 'border-white/30 text-white hover:bg-white/10' : ''}`}>
                    Começar
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-white/5 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '0 €', label: 'Para clientes' },
              { value: '23%', label: 'IVA calculado automaticamente' },
              { value: '<2s', label: 'Para emitir um recibo' },
              { value: '100%', label: 'Sem papel' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-extrabold text-reciboo-teal">{value}</div>
                <div className="mt-1 text-sm text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-reciboo-teal">
              <Receipt className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-white">Reciboo</span>
          </div>
          <p className="text-sm text-white/40">© 2025 Reciboo. Feito em Portugal.</p>
          <div className="flex gap-4 text-sm text-white/40">
            <Link href="#" className="hover:text-white/70">Privacidade</Link>
            <Link href="#" className="hover:text-white/70">Termos</Link>
            <Link href="#" className="hover:text-white/70">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
