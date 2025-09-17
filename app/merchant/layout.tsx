'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { DashboardLayout } from '@/app/components/layout/dashboard-layout'
import { useAuth } from '@/lib/auth-guards'
import { createClient } from '@/lib/supabase-browser'

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  
  // Hide sidebar during onboarding
  const isOnboarding = pathname.includes('/onboarding')

  // Route guard: if merchant onboarding is incomplete, force to onboarding
  useEffect(() => {
    if (isOnboarding) return
    const checkOnboarding = async () => {
      const user = session?.user
      if (!user) return

      const role = (user.user_metadata as Record<string, unknown>)?.role || 'merchant'
      if (role !== 'merchant') return

      try {
        const { data: merchant, error } = await supabase
          .from('merchants')
          .select('onboarding_completed, onboarded, user_id')
          .eq('user_id', user.id)
          .single()

        const completed = !!(merchant?.onboarding_completed || merchant?.onboarded)
        if (error || !completed) {
          router.replace('/merchant/onboarding')
        }
      } catch {
        router.replace('/merchant/onboarding')
      }
    }
    checkOnboarding()
  }, [isOnboarding, session?.user, supabase, router])

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
