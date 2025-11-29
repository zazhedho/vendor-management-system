import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventsApi } from '../api/events';
import { vendorsApi } from '../api/vendors';
import { paymentsApi } from '../api/payments';
import { toast } from 'react-toastify';
import { Calendar, Users, CreditCard, TrendingUp, FileText, CheckCircle, Activity } from 'lucide-react';
import { Card, Badge, Spinner } from '../components/ui';

interface DashboardStats {
  totalEvents?: number;
  totalVendors?: number;
  totalPayments?: number;
  pendingPayments?: number;
  mySubmissions?: number;
  wonEvents?: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (user.role === 'admin' || user.role === 'superadmin') {
        await fetchAdminData();
      } else if (user.role === 'client' || user.role === 'manager') {
        await fetchClientData();
      } else if (user.role === 'vendor') {
        await fetchVendorData();
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [eventsRes, vendorsRes, paymentsRes] = await Promise.all([
        eventsApi.getAll({ limit: 5 }),
        vendorsApi.getAll({ limit: 100 }),
        paymentsApi.getAll({ limit: 100 })
      ]);

      const totalEvents = eventsRes.data?.pagination?.total || eventsRes.data?.length || 0;
      const totalVendors = vendorsRes.data?.pagination?.total || vendorsRes.data?.length || 0;
      const allPayments = paymentsRes.data?.data || paymentsRes.data || [];
      const pendingPayments = Array.isArray(allPayments)
        ? allPayments.filter((p: any) => p.status === 'pending').length
        : 0;

      setStats({
        totalEvents,
        totalVendors,
        totalPayments: Array.isArray(allPayments) ? allPayments.length : 0,
        pendingPayments,
      });

      const events = eventsRes.data?.data || eventsRes.data || [];
      setRecentEvents(Array.isArray(events) ? events.slice(0, 5) : []);

      const activities = Array.isArray(events) ? events.slice(0, 4).map((event: any, index: number) => ({
        id: `activity-${index}`,
        description: `Event "${event.title || event.name}" was created`,
        timestamp: event.created_at || new Date().toISOString(),
      })) : [];
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const fetchClientData = async () => {
    try {
      const eventsRes = await eventsApi.getAll({ limit: 5 });
      const events = eventsRes.data?.data || eventsRes.data || [];

      setStats({
        totalEvents: Array.isArray(events) ? events.length : 0,
        pendingPayments: 0,
      });

      setRecentEvents(Array.isArray(events) ? events.slice(0, 5) : []);

      const activities = Array.isArray(events) ? events.slice(0, 4).map((event: any, index: number) => ({
        id: `activity-${index}`,
        description: `Event "${event.title || event.name}" status updated`,
        timestamp: event.updated_at || event.created_at || new Date().toISOString(),
      })) : [];
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching client data:', error);
    }
  };

  const fetchVendorData = async () => {
    try {
      const [submissionsRes, paymentsRes, eventsRes] = await Promise.all([
        eventsApi.getMySubmissions().catch(() => ({ data: [] })),
        paymentsApi.getMyPayments().catch(() => ({ data: [] })),
        eventsApi.getAll({ limit: 5 }).catch(() => ({ data: [] }))
      ]);

      const submissions = submissionsRes.data || [];
      const payments = paymentsRes.data || [];
      const events = eventsRes.data?.data || eventsRes.data || [];

      const wonSubmissions = Array.isArray(submissions)
        ? submissions.filter((s: any) => s.status === 'won' || s.is_winner).length
        : 0;

      setStats({
        mySubmissions: Array.isArray(submissions) ? submissions.length : 0,
        wonEvents: wonSubmissions,
        totalPayments: Array.isArray(payments) ? payments.length : 0,
        pendingPayments: Array.isArray(payments)
          ? payments.filter((p: any) => p.status === 'pending').length
          : 0,
      });

      setRecentEvents(Array.isArray(events) ? events.slice(0, 5) : []);

      const activities = Array.isArray(submissions) ? submissions.slice(0, 4).map((submission: any, index: number) => ({
        id: `activity-${index}`,
        description: `Submitted pitch for event`,
        timestamp: submission.created_at || new Date().toISOString(),
      })) : [];
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    }
  };

  const getStatsCards = () => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      return [
        {
          title: 'Total Events',
          value: stats.totalEvents?.toString() || '0',
          icon: Calendar,
          variant: 'primary',
        },
        {
          title: 'Total Vendors',
          value: stats.totalVendors?.toString() || '0',
          icon: Users,
          variant: 'success',
        },
        {
          title: 'Total Payments',
          value: stats.totalPayments?.toString() || '0',
          icon: CreditCard,
          variant: 'info',
        },
        {
          title: 'Pending Payments',
          value: stats.pendingPayments?.toString() || '0',
          icon: TrendingUp,
          variant: 'warning',
        },
      ];
    } else if (user?.role === 'client' || user?.role === 'manager') {
      return [
        {
          title: 'My Events',
          value: stats.totalEvents?.toString() || '0',
          icon: Calendar,
          variant: 'primary',
        },
        {
          title: 'Pending Payments',
          value: stats.pendingPayments?.toString() || '0',
          icon: CreditCard,
          variant: 'warning',
        },
      ];
    } else if (user?.role === 'vendor') {
      return [
        {
          title: 'My Submissions',
          value: stats.mySubmissions?.toString() || '0',
          icon: FileText,
          variant: 'primary',
        },
        {
          title: 'Won Events',
          value: stats.wonEvents?.toString() || '0',
          icon: CheckCircle,
          variant: 'success',
        },
        {
          title: 'Total Payments',
          value: stats.totalPayments?.toString() || '0',
          icon: CreditCard,
          variant: 'info',
        },
        {
          title: 'Pending Payments',
          value: stats.pendingPayments?.toString() || '0',
          icon: TrendingUp,
          variant: 'warning',
        },
      ];
    }
    return [];
  };

  const getStatusVariant = (status: string) => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'paid':
        return 'success';
      case 'pending':
      case 'in_progress':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'danger';
      case 'draft':
        return 'secondary';
      default:
        return 'info';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Recently';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
      if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statsCards = getStatsCards();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-500 mt-2">Welcome back, {user?.name}!</p>
      </div>

      {statsCards.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${statsCards.length >= 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6`}>
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            const bgColors: Record<string, string> = {
              primary: 'bg-primary-50 text-primary-600',
              success: 'bg-success-50 text-success-600',
              warning: 'bg-warning-50 text-warning-600',
              info: 'bg-info-50 text-info-600',
              danger: 'bg-danger-50 text-danger-600',
            };
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-500 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-secondary-900">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-xl ${bgColors[stat.variant || 'primary']}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-secondary-900">
              {user?.role === 'vendor' ? 'Available Events' : 'Recent Events'}
            </h2>
            <Activity size={20} className="text-secondary-400" />
          </div>
          {recentEvents.length > 0 ? (
            <div className="space-y-4">
              {recentEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors cursor-pointer border border-secondary-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="font-semibold text-secondary-900 truncate">{event.title || event.name || 'Untitled Event'}</h3>
                      <p className="text-sm text-secondary-500 mt-1">
                        {event.category || event.event_type || 'General'}
                      </p>
                    </div>
                    {event.status && (
                      <Badge variant={getStatusVariant(event.status)} className="capitalize">
                        {event.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              <Calendar className="mx-auto mb-2 opacity-50" size={32} />
              <p>No events found</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-secondary-900">Recent Activities</h2>
            <TrendingUp size={20} className="text-secondary-400" />
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary-100">
              {recentActivities.map((activity: any) => (
                <div key={activity.id} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-primary-500"></div>
                  <p className="text-sm font-medium text-secondary-900">{activity.description}</p>
                  <p className="text-xs text-secondary-500 mt-1">{formatTimestamp(activity.timestamp)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              <Activity className="mx-auto mb-2 opacity-50" size={32} />
              <p>No recent activities</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
