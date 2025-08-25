import { DashboardLayout } from '@/app/components/layout/dashboard-layout'
import { createServerClient } from '@/lib/supabase-server'

export const metadata = {
  title: 'Subscriptions - Cryptrac',
}

export default async function SubscriptionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
