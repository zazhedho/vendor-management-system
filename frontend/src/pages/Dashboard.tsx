import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventsApi } from '../api/events';
import { vendorsApi } from '../api/vendors';
import { paymentsApi } from '../api/payments';
import { toast } from 'react-toastify';
import { Calendar, Users, CreditCard, Star, TrendingUp, FileText, CheckCircle } from 'lucide-react';

interface DashboardStats {
  totalEvents?: number;
  totalVendors?: number;
  totalPayments?: number;
  pendingPayments?: number;
  mySubmissions?: number;
  wonEvents?: number;
  avgRating?: number;
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

      // Create recent activities from events
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
        pendingPayments: 0, // TODO: Filter by user's events
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
          color: 'bg-blue-500',
        },
        {
          title: 'Total Vendors',
          value: stats.totalVendors?.toString() || '0',
          icon: Users,
          color: 'bg-green-500',
        },
        {
          title: 'Total Payments',
          value: stats.totalPayments?.toString() || '0',
          icon: CreditCard,
          color: 'bg-purple-500',
        },
        {
          title: 'Pending Payments',
          value: stats.pendingPayments?.toString() || '0',
          icon: TrendingUp,
          color: 'bg-yellow-500',
        },
      ];
    } else if (user?.role === 'client' || user?.role === 'manager') {
      return [
        {
          title: 'My Events',
          value: stats.totalEvents?.toString() || '0',
          icon: Calendar,
          color: 'bg-blue-500',
        },
        {
          title: 'Pending Payments',
          value: stats.pendingPayments?.toString() || '0',
          icon: CreditCard,
          color: 'bg-yellow-500',
        },
      ];
    } else if (user?.role === 'vendor') {
      return [
        {
          title: 'My Submissions',
          value: stats.mySubmissions?.toString() || '0',
          icon: FileText,
          color: 'bg-blue-500',
        },
        {
          title: 'Won Events',
          value: stats.wonEvents?.toString() || '0',
          icon: CheckCircle,
          color: 'bg-green-500',
        },
        {
          title: 'Total Payments',
          value: stats.totalPayments?.toString() || '0',
          icon: CreditCard,
          color: 'bg-purple-500',
        },
        {
          title: 'Pending Payments',
          value: stats.pendingPayments?.toString() || '0',
          icon: TrendingUp,
          color: 'bg-yellow-500',
        },
      ];
    }
    return [];
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';

    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = getStatsCards();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
      </div>

      {statsCards.length > 0 && (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${statsCards.length >= 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-6 mb-8`}>
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {user?.role === 'vendor' ? 'Available Events' : 'Recent Events'}
          </h2>
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{event.title || event.name || 'Untitled Event'}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.category || event.event_type || 'General'}
                      </p>
                      {event.date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {event.status && (
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No events yet</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  );
};
