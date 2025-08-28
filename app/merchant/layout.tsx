import { DashboardLayout } from '@/app/components/layout/dashboard-layout'
import { createServerClient } from '@/lib/supabase-server'

export const metadata = {
  title: 'Merchant Portal',
}

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch user data on server side to pass to layout
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}