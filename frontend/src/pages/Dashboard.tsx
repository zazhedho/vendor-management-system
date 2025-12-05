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
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    const canViewDashboard = hasPermission('dashboard', 'view');
    if (!canViewDashboard) {
      setLoading(false);
      return;
    }

    const canViewEvents = hasPermission('event', 'view');
    const canViewVendors = hasPermission('vendor', 'view');
    const canViewPayments = hasPermission('payment', 'view');
    const canManagePayments = hasPermission('payment', 'create') || hasPermission('payment', 'update') || hasPermission('payment', 'delete');
    const canViewMySubmissions = hasPermission('event', 'view_my_submissions') || hasPermission('event', 'submit_pitch');

    try {
      setLoading(true);

      const eventsPromise = canViewEvents ? eventsApi.getAll({ limit: 5 }) : Promise.resolve(null);
      const vendorsPromise = canViewVendors ? vendorsApi.getAll({ limit: 100 }) : Promise.resolve(null);
      const paymentsPromise = canViewPayments
        ? (canManagePayments ? paymentsApi.getAll({ limit: 100 }) : paymentsApi.getMyPayments().catch(() => null))
        : Promise.resolve(null);
      const submissionsPromise = canViewMySubmissions
        ? eventsApi.getMySubmissions({ limit: 50, order_by: 'updated_at', order_direction: 'desc' }).catch(() => null)
        : Promise.resolve(null);

      const [eventsRes, vendorsRes, paymentsRes, submissionsRes] = await Promise.all([
        eventsPromise,
        vendorsPromise,
        paymentsPromise,
        submissionsPromise,
      ]);

      const newStats: DashboardStats = {};

      let activitiesBuffer: any[] = [];

      if (eventsRes && eventsRes.data) {
        const events = eventsRes.data || [];
        newStats.totalEvents = eventsRes.total_data || events.length;
        setRecentEvents(Array.isArray(events) ? events.slice(0, 5) : []);
        activitiesBuffer = Array.isArray(events)
          ? events.slice(0, 4).map((event: any, index: number) => ({
              id: `activity-${index}`,
              description: `Event "${event.title || event.name}" status updated`,
              timestamp: event.updated_at || event.created_at || new Date().toISOString(),
            }))
          : [];
      } else {
        setRecentEvents([]);
      }

      if (vendorsRes && vendorsRes.data) {
        const vendors = vendorsRes.data || [];
        newStats.totalVendors = vendorsRes.total_data || vendors.length;
      }

      if (paymentsRes && paymentsRes.data) {
        const payments = paymentsRes.data || [];
        newStats.totalPayments = Array.isArray(payments) ? payments.length : 0;
        newStats.pendingPayments = Array.isArray(payments)
          ? payments.filter((p: any) => p.status === 'pending').length
          : 0;
      }

      if (submissionsRes && submissionsRes.data) {
        const submissions = submissionsRes.data || [];
        newStats.mySubmissions = Array.isArray(submissions) ? submissions.length : 0;
        newStats.wonEvents = Array.isArray(submissions)
          ? submissions.filter((s: any) => s.status === 'won' || s.is_winner).length
          : 0;
        if (Array.isArray(submissions)) {
          activitiesBuffer = submissions.slice(0, 4).map((submission: any, index: number) => ({
            id: `activity-${index}`,
            description: `Submitted pitch for event`,
            timestamp: submission.created_at || new Date().toISOString(),
          }));
        }
      }

      setRecentActivities(activitiesBuffer);

      setStats(newStats);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatsCards = () => {
    const cards = [];

    if (stats.totalEvents !== undefined) {
      cards.push({
        title: 'Total Events',
        value: stats.totalEvents.toString(),
        icon: Calendar,
        variant: 'primary' as const,
      });
    }

    if (stats.totalVendors !== undefined) {
      cards.push({
        title: 'Total Vendors',
        value: stats.totalVendors.toString(),
        icon: Users,
        variant: 'success' as const,
      });
    }

    if (stats.mySubmissions !== undefined) {
      cards.push({
        title: 'My Submissions',
        value: stats.mySubmissions.toString(),
        icon: FileText,
        variant: 'primary' as const,
      });
    }

    if (stats.wonEvents !== undefined) {
      cards.push({
        title: 'Won Events',
        value: stats.wonEvents.toString(),
        icon: CheckCircle,
        variant: 'success' as const,
      });
    }

    if (stats.totalPayments !== undefined) {
      cards.push({
        title: 'Total Payments',
        value: stats.totalPayments.toString(),
        icon: CreditCard,
        variant: 'info' as const,
      });
    }

    if (stats.pendingPayments !== undefined) {
      cards.push({
        title: 'Pending Payments',
        value: stats.pendingPayments.toString(),
        icon: TrendingUp,
        variant: 'warning' as const,
      });
    }

    return cards;
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
              {hasPermission('event', 'view_submissions') || !hasPermission('event', 'view_my_submissions') ? 'Recent Events' : 'Available Events'}
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
