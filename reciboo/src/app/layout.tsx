import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reciboo — Recibos digitais para Portugal',
  description: 'Receba e organize os seus recibos digitalmente via NFC. Divida a conta com amigos sem complicações.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="antialiased">{children}</body>
    </html>
  )
}
