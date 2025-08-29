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
  let user = null;
  
  try {
    // Fetch user data on server side to pass to layout
    const supabase = await createServerClient()
    const {
      data: { user: userData },
      error
    } = await supabase.auth.getUser()
    
    if (!error) {
      user = userData;
    }
  } catch (error) {
    console.error('Error fetching user in merchant layout:', error);
    // Continue with user as null
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>
}