import './globals.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/inter/900.css'
import type { Metadata } from 'next'
import BottomNav from './components/BottomNav'

export const metadata: Metadata = {
  title: 'Couple Kits',
  description: 'Dashboard Couple Kits'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <BottomNav />
      </body>
    </html>
  )
}
