import type { Metadata } from 'next'
import './globals.css'
import { validateEnv } from '@/lib/env'
import { auth } from '@/lib/auth'
import SessionProvider from '@/components/layout/SessionProvider'
import CookieConsent from '@/components/CookieConsent'

// Runs at build/startup time on the server
if (typeof window === 'undefined') {
  validateEnv()
}

export const metadata: Metadata = {
  title: 'Kynjo.Homes',
  description: 'Smart estate management for modern neighborhoods',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
        <CookieConsent />
      </body>
    </html>
  )
}