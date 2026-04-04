import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventsApi } from '../api/events';
import { vendorsApi } from '../api/vendors';
import { paymentsApi } from '../api/payments';
import { Calendar, Users, CreditCard, TrendingUp, FileText, CheckCircle, Activity, ArrowRight, PlusCircle, FolderOpen, AlertTriangle, Clock3 } from 'lucide-react';
import { Card, Badge, Button, Spinner } from '../components/ui';

interface DashboardStats {
  totalEvents?: number;
  totalVendors?: number;
  totalPayments?: number;
  pendingPayments?: number;
  mySubmissions?: number;
  wonEvents?: number;
}

const INDIVIDUAL_REQUIRED_DOCS = ['ktp', 'npwp', 'bank_book'];
const COMPANY_REQUIRED_DOCS = ['akta', 'npwp', 'skt', 'ktp', 'nib', 'rekening'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [eventFilter, setEventFilter] = React.useState<'all' | 'open' | 'closingSoon'>('all');

  const canViewDashboard = hasPermission('dashboard', 'view');
  const canListEvents = hasPermission('event', 'list');
  const canListVendors = hasPermission('vendor', 'list');
  const canListPayments = hasPermission('payment', 'list');
  const canManagePayments = hasPermission('payment', 'create') || hasPermission('payment', 'update') || hasPermission('payment', 'delete');
  const canViewMySubmissions = hasPermission('event', 'view_my_submissions') || hasPermission('event', 'submit_pitch');
  const canCreateEvents = hasPermission('event', 'create');
  const canCreateVendors = hasPermission('vendor', 'update');
  const canCreatePayments = hasPermission('payment', 'create');
  const canViewVendorProfile = hasPermission('vendor', 'view');

  const { data: eventsRes, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', { limit: 5 }],
    queryFn: () => eventsApi.getAll({ limit: 5 }),
    enabled: !!user && canViewDashboard && canListEvents,
  });

  const { data: vendorsRes, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors', { limit: 100 }],
    queryFn: () => vendorsApi.getAll({ limit: 100 }),
    enabled: !!user && canViewDashboard && canListVendors,
  });

  const { data: paymentsRes, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', { limit: 100, type: canManagePayments ? 'all' : 'my' }],
    queryFn: () => canManagePayments ? paymentsApi.getAll({ limit: 100 }) : paymentsApi.getMyPayments(),
    enabled: !!user && canViewDashboard && canListPayments,
  });

  const { data: submissionsRes, isLoading: submissionsLoading } = useQuery({
    queryKey: ['submissions', { limit: 50 }],
    queryFn: () => eventsApi.getMySubmissions({ limit: 50, order_by: 'updated_at', order_direction: 'desc' }),
    enabled: !!user && canViewDashboard && canViewMySubmissions,
  });

  const { data: myVendorProfileRes, isLoading: myVendorProfileLoading } = useQuery({
    queryKey: ['dashboard', 'my-vendor-profile'],
    queryFn: () => vendorsApi.getMyVendorProfile(),
    enabled: !!user && canViewDashboard && canViewVendorProfile && !canListVendors,
  });

  const loading = eventsLoading || vendorsLoading || paymentsLoading || submissionsLoading || myVendorProfileLoading;

  const stats: DashboardStats = {};
  const events = eventsRes?.data || [];
  const vendors = vendorsRes?.data || [];
  const payments = paymentsRes?.data || [];
  const submissions = submissionsRes?.data || [];
  const myVendor = myVendorProfileRes?.data?.vendor;
  const myVendorProfile = myVendorProfileRes?.data?.profile;

  if (eventsRes) stats.totalEvents = eventsRes.total_data || events.length;
  if (vendorsRes) stats.totalVendors = vendorsRes.total_data || vendors.length;
  if (paymentsRes) {
    stats.totalPayments = Array.isArray(payments) ? payments.length : 0;
    stats.pendingPayments = Array.isArray(payments) ? payments.filter((p: any) => p.status === 'pending').length : 0;
  }
  if (submissionsRes) {
    stats.mySubmissions = Array.isArray(submissions) ? submissions.length : 0;
    stats.wonEvents = Array.isArray(submissions) ? submissions.filter((s: any) => s.status === 'won' || s.is_winner).length : 0;
  }

  const recentEvents = Array.isArray(events) ? events.slice(0, 5) : [];
  const recentActivities = Array.isArray(submissions) && submissions.length > 0
    ? submissions.slice(0, 4).map((submission: any, index: number) => ({
        id: `activity-${index}`,
        description: submission.event_title
          ? `Submitted pitch for "${submission.event_title}"`
          : 'Submitted pitch for event',
        timestamp: submission.created_at || new Date().toISOString(),
        href: '/submissions',
      }))
    : Array.isArray(events)
    ? events.slice(0, 4).map((event: any, index: number) => ({
        id: `activity-${index}`,
        description: `Event "${event.title || event.name}" status updated`,
        timestamp: event.updated_at || event.created_at || new Date().toISOString(),
        href: event.id ? `/events/${event.id}` : '/events',
      }))
    : [];

  const getStatsCards = () => {
    const cards = [];

    if (stats.totalEvents !== undefined) {
      cards.push({
        title: 'Total Events',
        value: stats.totalEvents.toString(),
        icon: Calendar,
        variant: 'primary' as const,
        href: '/events',
        helper: 'Open event module',
      });
    }

    if (stats.totalVendors !== undefined) {
      cards.push({
        title: 'Total Vendors',
        value: stats.totalVendors.toString(),
        icon: Users,
        variant: 'success' as const,
        href: canListVendors ? '/vendors' : '/vendor/profile',
        helper: 'Open vendor module',
      });
    }

    if (stats.mySubmissions !== undefined) {
      cards.push({
        title: 'My Submissions',
        value: stats.mySubmissions.toString(),
        icon: FileText,
        variant: 'primary' as const,
        href: '/submissions',
        helper: 'Review submissions',
      });
    }

    if (stats.wonEvents !== undefined) {
      cards.push({
        title: 'Won Events',
        value: stats.wonEvents.toString(),
        icon: CheckCircle,
        variant: 'success' as const,
        href: '/submissions',
        helper: 'See winning submissions',
      });
    }

    if (stats.totalPayments !== undefined) {
      cards.push({
        title: 'Total Payments',
        value: stats.totalPayments.toString(),
        icon: CreditCard,
        variant: 'info' as const,
        href: '/payments',
        helper: 'Open payment module',
      });
    }

    if (stats.pendingPayments !== undefined) {
      cards.push({
        title: 'Pending Payments',
        value: stats.pendingPayments.toString(),
        icon: TrendingUp,
        variant: 'warning' as const,
        href: '/payments',
        helper: 'Review pending payments',
      });
    }

    return cards;
  };

  const isClosingSoon = (dateValue?: string) => {
    if (!dateValue) return false;
    const targetDate = new Date(dateValue);
    if (Number.isNaN(targetDate.getTime())) return false;

    const now = new Date();
    const diffInMs = targetDate.getTime() - now.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays >= 0 && diffInDays <= 7;
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
      case 'revision':
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

  const quickActions = [
    canCreateEvents ? { label: 'Create Event', href: '/events/new', icon: PlusCircle } : null,
    canCreateVendors ? { label: 'Create Vendor', href: '/vendor/profile/new', icon: Users } : null,
    canCreatePayments ? { label: 'Create Payment', href: '/payments/new', icon: CreditCard } : null,
    canViewVendorProfile ? { label: 'Vendor Profile', href: '/vendor/profile', icon: FolderOpen } : null,
  ].filter(Boolean) as Array<{ label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> }>;

  const handleNavigate = (href?: string) => {
    if (!href) return;
    navigate(href);
  };

  const openEventsCount = Array.isArray(events)
    ? events.filter((event: any) => ['open', 'in_progress'].includes((event.status || '').toLowerCase())).length
    : 0;
  const closingSoonEventsCount = Array.isArray(events)
    ? events.filter((event: any) => ['open', 'in_progress'].includes((event.status || '').toLowerCase()) && isClosingSoon(event.end_date || event.start_date)).length
    : 0;
  const vendorRecords = Array.isArray(vendors) ? vendors.map((item: any) => item.vendor || item) : [];
  const vendorReviewQueueCount = vendorRecords.filter((vendor: any) => ['pending', 'verify'].includes((vendor.status || '').toLowerCase())).length;
  const vendorRevisionCount = vendorRecords.filter((vendor: any) => (vendor.status || '').toLowerCase() === 'revision').length;
  const pendingPaymentCount = Array.isArray(payments)
    ? payments.filter((payment: any) => (payment.status || '').toLowerCase() === 'pending').length
    : 0;
  const myVendorFiles = myVendorProfile?.files || [];
  const requiredVendorDocs = myVendor?.vendor_type === 'individual' ? INDIVIDUAL_REQUIRED_DOCS : COMPANY_REQUIRED_DOCS;
  const uploadedVendorDocTypes = myVendorFiles.map((file: any) => file.file_type);
  const missingVendorDocCount = myVendor
    ? requiredVendorDocs.filter((type) => !uploadedVendorDocTypes.includes(type)).length
    : 0;
  const revisionVendorDocCount = myVendorFiles.filter((file: any) => (file.status || '').toLowerCase() === 'revision').length;

  const focusAreas = [];

  if (canListVendors && vendorReviewQueueCount > 0) {
    focusAreas.push({
      title: 'Vendor Review Queue',
      value: vendorReviewQueueCount.toString(),
      description: 'Vendor profiles waiting for review or verification.',
      href: '/vendors',
      icon: Users,
      tone: 'warning',
    });
  }

  if (canListVendors && vendorRevisionCount > 0) {
    focusAreas.push({
      title: 'Vendor Revisions',
      value: vendorRevisionCount.toString(),
      description: 'Vendor profiles need follow-up after revision feedback.',
      href: '/vendors',
      icon: AlertTriangle,
      tone: 'danger',
    });
  }

  if (canListPayments && pendingPaymentCount > 0) {
    focusAreas.push({
      title: 'Pending Payments',
      value: pendingPaymentCount.toString(),
      description: 'Payments still waiting to be processed.',
      href: '/payments',
      icon: CreditCard,
      tone: 'info',
    });
  }

  if (canListEvents && closingSoonEventsCount > 0) {
    focusAreas.push({
      title: 'Closing Soon',
      value: closingSoonEventsCount.toString(),
      description: 'Open events that are ending within 7 days.',
      href: '/events',
      icon: Clock3,
      tone: 'warning',
    });
  }

  if (canListEvents && openEventsCount > 0) {
    focusAreas.push({
      title: 'Open Events',
      value: openEventsCount.toString(),
      description: 'Events that can still receive submissions or updates.',
      href: '/events',
      icon: Calendar,
      tone: 'success',
    });
  }

  if (!canListVendors && canViewVendorProfile && !myVendorProfile) {
    focusAreas.push({
      title: 'Create Vendor Profile',
      value: 'Start',
      description: 'Complete your vendor profile to join the workflow.',
      href: '/vendor/profile/new',
      icon: FolderOpen,
      tone: 'info',
    });
  }

  if (!canListVendors && canViewVendorProfile && missingVendorDocCount > 0) {
    focusAreas.push({
      title: 'Missing Documents',
      value: missingVendorDocCount.toString(),
      description: 'Mandatory vendor documents still need to be uploaded.',
      href: '/vendor/profile/documents',
      icon: FileText,
      tone: 'warning',
    });
  }

  if (!canListVendors && canViewVendorProfile && revisionVendorDocCount > 0) {
    focusAreas.push({
      title: 'Document Revisions',
      value: revisionVendorDocCount.toString(),
      description: 'Some uploaded documents need revision.',
      href: '/vendor/profile/documents',
      icon: AlertTriangle,
      tone: 'danger',
    });
  }

  if (!canListVendors && canViewVendorProfile && (myVendor?.status || '').toLowerCase() === 'revision') {
    focusAreas.push({
      title: 'Profile Needs Update',
      value: 'Action',
      description: 'Your vendor profile is in revision and needs to be updated.',
      href: '/vendor/profile/edit',
      icon: Users,
      tone: 'danger',
    });
  }

  const filteredRecentEvents = recentEvents.filter((event: any) => {
    if (eventFilter === 'open') {
      return ['open', 'in_progress'].includes((event.status || '').toLowerCase());
    }

    if (eventFilter === 'closingSoon') {
      return ['open', 'in_progress'].includes((event.status || '').toLowerCase()) && isClosingSoon(event.end_date || event.start_date);
    }

    return true;
  });

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

      {quickActions.length > 0 && (
        <Card className="border-primary-100 bg-gradient-to-r from-primary-50 via-white to-secondary-50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-secondary-900">Quick Actions</h2>
              <p className="text-sm text-secondary-500 mt-1">Open the module you need directly from the dashboard.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.href}
                    variant="secondary"
                    onClick={() => handleNavigate(action.href)}
                    leftIcon={<Icon size={16} />}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {focusAreas.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-secondary-900">Focus Areas</h2>
              <p className="text-sm text-secondary-500">The items below need attention first and take you straight to the related module.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {focusAreas.map((item, index) => {
              const Icon = item.icon;
              const toneStyles: Record<string, string> = {
                info: 'border-info-100 bg-info-50/70 text-info-700',
                success: 'border-success-100 bg-success-50/70 text-success-700',
                warning: 'border-warning-100 bg-warning-50/70 text-warning-800',
                danger: 'border-danger-100 bg-danger-50/70 text-danger-700',
              };

              return (
                <Card
                  key={`${item.title}-${index}`}
                  className="group cursor-pointer border border-secondary-200 p-5 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  onClick={() => handleNavigate(item.href)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleNavigate(item.href);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneStyles[item.tone]}`}>
                        {item.title}
                      </div>
                      <div className="mt-4 text-3xl font-bold text-secondary-900">{item.value}</div>
                      <p className="mt-2 text-sm text-secondary-500">{item.description}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-secondary-100">
                      <Icon size={20} className="text-primary-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700">
                    Open module
                    <ArrowRight size={16} className="ml-2" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

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
              <Card
                key={index}
                className="group cursor-pointer hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                onClick={() => handleNavigate(stat.href)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleNavigate(stat.href);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-500 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-secondary-900">{stat.value}</h3>
                    <p className="mt-3 text-xs font-medium text-primary-600 group-hover:text-primary-700">
                      {stat.helper}
                    </p>
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-secondary-900">
                {hasPermission('event', 'view_submissions') || !hasPermission('event', 'view_my_submissions') ? 'Recent Events' : 'Available Events'}
              </h2>
              <Activity size={20} className="text-secondary-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', value: 'all' as const },
                { label: 'Open', value: 'open' as const },
                { label: 'Closing Soon', value: 'closingSoon' as const },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setEventFilter(filter.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    eventFilter === filter.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          {filteredRecentEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredRecentEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors cursor-pointer border border-secondary-100"
                  onClick={() => handleNavigate(event.id ? `/events/${event.id}` : '/events')}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                      keyboardEvent.preventDefault();
                      handleNavigate(event.id ? `/events/${event.id}` : '/events');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <h3 className="font-semibold text-secondary-900 truncate">{event.title || event.name || 'Untitled Event'}</h3>
                      <p className="text-sm text-secondary-500 mt-1">
                        {event.category || event.event_type || 'General'}
                      </p>
                      {(event.end_date || event.start_date) && (
                        <p className="text-xs text-secondary-400 mt-2">
                          {isClosingSoon(event.end_date || event.start_date)
                            ? 'Closing within 7 days'
                            : `Timeline: ${new Date(event.end_date || event.start_date).toLocaleDateString()}`}
                        </p>
                      )}
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
              <p>{eventFilter === 'all' ? 'No events found' : 'No events match this filter'}</p>
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
                <div
                  key={activity.id}
                  className="relative pl-8 cursor-pointer rounded-lg transition-colors hover:bg-secondary-50"
                  onClick={() => handleNavigate(activity.href)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleNavigate(activity.href);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
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
