export interface BaselineRoute {
  path: string
  slug: string
}

export const BASELINE_ROUTES: BaselineRoute[] = [
  { path: '/', slug: 'root' },
  { path: '/pay/sample-id', slug: 'pay-sample-id' },
  { path: '/merchant/dashboard', slug: 'merchant-dashboard' },
  { path: '/merchant/dashboard/payments', slug: 'merchant-dashboard-payments' },
  { path: '/merchant/dashboard/profile', slug: 'merchant-dashboard-profile' },
]
