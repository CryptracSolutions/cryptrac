export const metadata = {
  title: 'Subscriptions - Cryptrac',
}

export default async function SubscriptionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The DashboardLayout is now applied at the merchant level
  // This layout just passes through the children
  return <>{children}</>
}
