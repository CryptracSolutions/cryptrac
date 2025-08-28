export const metadata = {
  title: 'Merchant Dashboard',
}

export default async function MerchantDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The DashboardLayout is now applied at the merchant level
  // This layout just passes through the children
  return <>{children}</>
}
