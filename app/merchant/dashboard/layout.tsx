import { DashboardLayout } from '@/app/components/layout/dashboard-layout'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const metadata = {
  title: 'Merchant Dashboard',
}

export default async function MerchantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch user data on server side to pass to layout (optional)
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}
