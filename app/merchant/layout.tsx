'use client'

import { DashboardLayout } from '@/app/components/layout/dashboard-layout'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-guards'

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = useAuth()
  const pathname = usePathname()
  
  // Hide sidebar during onboarding
  const isOnboarding = pathname.includes('/onboarding')

  return (
    <DashboardLayout 
      user={session?.user} 
      showSidebar={!isOnboarding}
      showHeader={!isOnboarding}
    >
      {children}
    </DashboardLayout>
  )
}