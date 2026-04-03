import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@estateiq/database'
import DashboardShell from '@/components/layout/DashboardShell'
import { ResidentProvider } from '@/context/ResidentContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import SubscriptionBanner from '@/components/SubscriptionBanner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const resident = await prisma.resident.findUnique({
    where: { userId: session.user.id },
  })
  if (!resident) redirect('/onboarding')

  return (
    <ResidentProvider>
      <SubscriptionProvider>
        <DashboardShell>
          <SubscriptionBanner />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </DashboardShell>
      </SubscriptionProvider>
    </ResidentProvider>
  )
}