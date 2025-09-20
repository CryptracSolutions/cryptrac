'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Building, 
  CreditCard,
  Settings,
  Activity,
  DollarSign,
  BarChart3,
  Bell,
  Eye,
  EyeOff,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, MetricCard } from '@/app/components/ui/card';
import { TimelineList } from '@/app/components/ui/timeline-list';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { PageLayout, GridContainer, GridItem } from '@/components/ui/layouts';
import { createClient } from '@/lib/supabase-browser';

export default function AdminDashboard() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { role?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Verify admin access
        if (session.user.email !== 'admin@cryptrac.com' && session.user.user_metadata?.role !== 'admin') {
          router.push('/merchant/dashboard');
          return;
        }
        setUser(session.user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    getUser();
  }, [router, supabase.auth]);

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#7f5efd]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Platform-wide stats (mock data)
  const platformStats = [
    {
      title: "Total Platform Revenue",
      value: "$2,847,392.18",
      change: "+18.2%",
      changeType: "positive" as const,
      icon: DollarSign,
      description: "All-time platform revenue",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Active Merchants",
      value: "1,247",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Building,
      description: "Currently active merchants",
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "Total Transactions",
      value: "89,432",
      change: "+24.1%",
      changeType: "positive" as const,
      icon: CreditCard,
      description: "Platform-wide transactions",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "System Health",
      value: "99.9%",
      change: "+0.1%",
      changeType: "positive" as const,
      icon: Activity,
      description: "Platform uptime",
      color: "from-emerald-500 to-teal-500"
    },
  ];

  const adminSections = [
    {
      title: "User Management",
      description: "Manage merchant accounts and permissions",
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      actions: [
        { label: "View All Users", href: "/admin/users" },
        { label: "Pending Approvals", href: "/admin/approvals" },
        { label: "User Analytics", href: "/admin/user-analytics" }
      ]
    },
    {
      title: "System Monitoring",
      description: "Monitor platform performance and health",
      icon: Activity,
      color: "from-green-500 to-emerald-500",
      actions: [
        { label: "Performance Metrics", href: "/admin/performance" },
        { label: "Error Logs", href: "/admin/errors" },
        { label: "System Alerts", href: "/admin/alerts" }
      ]
    },
    {
      title: "Financial Overview",
      description: "Track revenue, fees, and financial metrics",
      icon: DollarSign,
      color: "from-purple-500 to-pink-500",
      actions: [
        { label: "Revenue Analytics", href: "/admin/revenue" },
        { label: "Fee Structure", href: "/admin/fees" },
        { label: "Financial Reports", href: "/admin/financial-reports" }
      ]
    },
    {
      title: "Security & Compliance",
      description: "Manage security settings and compliance",
      icon: Shield,
      color: "from-orange-500 to-red-500",
      actions: [
        { label: "Security Settings", href: "/admin/security" },
        { label: "Compliance Reports", href: "/admin/compliance" },
        { label: "Audit Logs", href: "/admin/audit" }
      ]
    }
  ];

  const recentActivity = [
    {
      type: "merchant_signup",
      title: "New Merchant Registration",
      description: "TechCorp Solutions joined the platform",
      time: "2 minutes ago",
      status: "pending"
    },
    {
      type: "payment_processed",
      title: "Large Payment Processed",
      description: "$15,420.00 payment from CryptoStore",
      time: "5 minutes ago",
      status: "completed"
    },
    {
      type: "system_alert",
      title: "System Alert",
      description: "High transaction volume detected",
      time: "12 minutes ago",
      status: "warning"
    },
    {
      type: "user_support",
      title: "Support Ticket",
      description: "Priority ticket from PremiumMerchant",
      time: "18 minutes ago",
      status: "pending"
    }
  ];

  return (
    <DashboardLayout user={user}>
      <PageLayout variant="fluid" padding="none">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-phonic text-6xl font-normal text-gray-900">Admin Dashboard</h1>
              <p className="font-capsule text-base font-normal text-gray-600 mt-2">Platform overview and administrative controls</p>
            </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              leftIcon={showSensitiveData ? <EyeOff size={16} /> : <Eye size={16} />}
            >
              {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
            </Button>
            <Button
              onClick={refreshData}
              disabled={refreshing}
              variant="primary"
              loading={refreshing}
              leftIcon={!refreshing ? <RefreshCw size={16} /> : undefined}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Platform Statistics */}
        <GridContainer columns={4} gap="md" responsive={true}>
          {platformStats.map((stat, index) => (
            <GridItem key={index} span="auto">
              <MetricCard
                title={stat.title}
                value={stat.value}
                trend={{
                  value: parseFloat(stat.change.replace(/[^0-9.-]/g, '')),
                  direction: stat.changeType === 'positive' ? 'up' : 'down'
                }}
                subtitle={stat.description}
                icon={<stat.icon className="h-4 w-4" />}
              />
            </GridItem>
          ))}
        </GridContainer>

        {/* Admin Sections */}
        <GridContainer columns={2} gap="md" responsive={true}>
          {adminSections.map((section, index) => (
            <GridItem key={index} span="auto">
              <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200 h-full">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gradient-to-r ${section.color} rounded-lg`}>
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="font-phonic text-2xl font-normal text-gray-900">{section.title}</CardTitle>
                    <CardDescription className="font-capsule text-base font-normal text-gray-600 mt-1">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.actions.map((action, actionIndex) => (
                  <Button
                    key={actionIndex}
                    variant="secondary"
                    className="w-full justify-start h-12 font-phonic text-base font-normal"
                    onClick={() => router.push(action.href)}
                  >
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </GridItem>
          ))}
        </GridContainer>

        {/* Recent Activity */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="font-capsule text-base font-normal text-gray-600 mt-1">
                    Latest platform events and notifications
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="secondary"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TimelineList
              events={recentActivity.map((activity, index) => ({
                id: index.toString(),
                type: activity.status === 'completed' ? 'success' : activity.status === 'warning' ? 'error' : 'pending',
                title: activity.title,
                subtitle: activity.description,
                timestamp: activity.time
              }))}
              showConnector
              dense
            />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-[#7f5efd] to-[#a78bfa] rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="font-phonic text-3xl font-normal text-gray-900">Quick Actions</CardTitle>
                <CardDescription className="font-capsule text-base font-normal text-gray-600 mt-1">
                  Common administrative tasks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="secondary"
                className="h-16 flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/merchants')}
              >
                <Building size={24} />
                Manage Merchants
              </Button>
              <Button
                variant="secondary"
                className="h-16 flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/analytics')}
              >
                <BarChart3 size={24} />
                View Analytics
              </Button>
              <Button
                variant="secondary"
                className="h-16 flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/settings')}
              >
                <Settings size={24} />
                System Settings
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </PageLayout>
    </DashboardLayout>
  );
}

export const dynamic = 'force-dynamic';
