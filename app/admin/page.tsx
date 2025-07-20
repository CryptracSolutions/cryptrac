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
  Bell
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { DashboardLayout } from '@/app/components/layout/dashboard-layout';
import { createBrowserClient } from '@/lib/supabase-browser';

export default function AdminDashboard() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { role?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
      description: "All-time platform revenue"
    },
    {
      title: "Active Merchants",
      value: "1,247",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Building,
      description: "Currently active merchants"
    },
    {
      title: "Total Transactions",
      value: "89,432",
      change: "+24.1%",
      changeType: "positive" as const,
      icon: CreditCard,
      description: "Platform-wide transactions"
    },
    {
      title: "System Health",
      value: "99.9%",
      change: "+0.1%",
      changeType: "positive" as const,
      icon: Activity,
      description: "Platform uptime"
    },
  ];

  const adminSections = [
    {
      title: "User Management",
      description: "Manage merchants, reps, and partners",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-500",
      badge: "Phase 8",
      items: ["View all users", "Approve/suspend accounts", "Role management"]
    },
    {
      title: "Platform Analytics",
      description: "Deep insights into platform performance",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-green-500",
      badge: "Phase 8",
      items: ["Revenue analytics", "Transaction monitoring", "Growth metrics"]
    },
    {
      title: "System Settings",
      description: "Configure platform-wide settings",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-purple-500",
      badge: "Phase 8",
      items: ["Fee configuration", "API settings", "Security policies"]
    },
    {
      title: "Database Management",
      description: "Monitor and manage database operations",
      icon: Database,
      href: "/admin/database",
      color: "bg-orange-500",
      badge: "Phase 8",
      items: ["Database health", "Backup management", "Query optimization"]
    },
    {
      title: "Security Center",
      description: "Monitor security and compliance",
      icon: Shield,
      href: "/admin/security",
      color: "bg-red-500",
      badge: "Phase 8",
      items: ["Security alerts", "Compliance reports", "Audit logs"]
    },
    {
      title: "Support & Reports",
      description: "Customer support and reporting tools",
      icon: FileText,
      href: "/admin/support",
      color: "bg-indigo-500",
      badge: "Phase 8",
      items: ["Support tickets", "Financial reports", "Compliance exports"]
    }
  ];

  const recentAlerts = [
    {
      id: "1",
      type: "info",
      title: "New merchant signup",
      description: "TechCorp Inc. has completed registration",
      time: "5 minutes ago"
    },
    {
      id: "2",
      type: "warning",
      title: "High transaction volume",
      description: "Unusual activity detected on merchant ID #1247",
      time: "1 hour ago"
    },
    {
      id: "3",
      type: "success",
      title: "System update completed",
      description: "Platform updated to v0.3.0 successfully",
      time: "2 hours ago"
    }
  ];

  return (
    <DashboardLayout user={user}>
      <div className="p-8">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Platform-wide control center • God mode access
              </p>
            </div>
            <Badge variant="destructive" className="ml-auto">
              ADMIN ACCESS
            </Badge>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">Development Notice</span>
            </div>
            <p className="text-amber-700 mt-1">
              Full admin controls will be implemented in Phase 8. Current view shows platform overview and planned features.
            </p>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {platformStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span className={`inline-flex items-center ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.changeType === 'positive' ? '↗' : '↘'} {stat.change}
                  </span>
                  <span className="ml-1">from last month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Admin Sections */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Admin Control Panels
                </CardTitle>
                <CardDescription>
                  Platform management and administrative tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminSections.map((section, index) => (
                    <div
                      key={index}
                      className="relative p-4 rounded-lg border hover:bg-accent transition-colors group cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-md ${section.color} text-white`}>
                          <section.icon className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {section.badge}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm group-hover:text-primary">
                          {section.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {section.description}
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  System Alerts
                </CardTitle>
                <CardDescription>
                  Recent platform notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className={`p-1 rounded-full ${
                      alert.type === 'success' ? 'bg-green-100' :
                      alert.type === 'warning' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        alert.type === 'success' ? 'bg-green-500' :
                        alert.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" className="w-full">
                  View All Alerts
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve Pending Merchants
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  System Health Check
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Development Status */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Phase 8 Development Preview</h3>
                <p className="text-sm text-blue-700 mt-1">
                  This admin dashboard shows the planned structure for Phase 8. Full administrative controls, 
                  user management, platform analytics, and system configuration tools will be implemented then.
                </p>
              </div>
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                Coming in Phase 8
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export const dynamic = 'force-dynamic';
