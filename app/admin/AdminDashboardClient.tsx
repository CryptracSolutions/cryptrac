'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Building, 
  CreditCard, 
  Settings,
  Database,
  AlertTriangle,
  Activity,
  DollarSign,
  UserCheck,
  Globe,
  BarChart3,
  FileText,
  Bell,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Coins,
  Star,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7f5efd]"></div>
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-lg text-gray-600 mt-2">Platform overview and administrative controls</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="flex items-center gap-2 font-medium"
            >
              {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
            </Button>
            <Button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2 font-medium bg-[#7f5efd] hover:bg-[#6b4fd8] text-white"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformStats.map((stat, index) => (
            <Card key={index} className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gradient-to-r ${stat.color} rounded-lg`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {stat.changeType === 'positive' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminSections.map((section, index) => (
            <Card key={index} className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gradient-to-r ${section.color} rounded-lg`}>
                    <section.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">{section.title}</CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-1">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.actions.map((action, actionIndex) => (
                  <Button
                    key={actionIndex}
                    variant="outline"
                    className="w-full justify-start h-12 text-base font-medium"
                    onClick={() => router.push(action.href)}
                  >
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="text-base text-gray-600 mt-1">
                    Latest platform events and notifications
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2 font-medium"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{activity.time}</p>
                  </div>
                  <Badge
                    variant={activity.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
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
                <CardTitle className="text-2xl font-bold text-gray-900">Quick Actions</CardTitle>
                <CardDescription className="text-base text-gray-600 mt-1">
                  Common administrative tasks
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 text-base font-medium flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/merchants')}
              >
                <Building className="h-6 w-6" />
                Manage Merchants
              </Button>
              <Button
                variant="outline"
                className="h-16 text-base font-medium flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/analytics')}
              >
                <BarChart3 className="h-6 w-6" />
                View Analytics
              </Button>
              <Button
                variant="outline"
                className="h-16 text-base font-medium flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/settings')}
              >
                <Settings className="h-6 w-6" />
                System Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export const dynamic = 'force-dynamic';
