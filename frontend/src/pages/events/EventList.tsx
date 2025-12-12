import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import { Event } from '../../types';
import { Plus, Eye, Edit, Trash2, X, Calendar } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal, ActionMenu, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { usePagination, useDebounce } from '../../hooks';
import { toast } from 'react-toastify';

export const EventList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('event', 'create');
  const canUpdate = hasPermission('event', 'update');
  const canDelete = hasPermission('event', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { currentPage, setCurrentPage, goToNextPage, goToPrevPage, canGoNext, canGoPrev } = usePagination(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['events', { page: currentPage, search: debouncedSearch, status: statusFilter }],
    queryFn: () => {
      const params: any = {
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
      };

      if (statusFilter) {
        params['filters[status]'] = statusFilter;
      }

      return eventsApi.getAll(params);
    },
    placeholderData: (previousData) => previousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDeleteId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => eventsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update event status');
    },
  });

  const handleStatusChange = (eventId: string, newStatus: string) => {
    statusMutation.mutate({ id: eventId, status: newStatus });
  };

  const events = response?.data || [];
  const totalPages = response?.total_pages || 1;

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter;

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'danger';
      case 'closed': return 'warning';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      header: 'Event',
      accessor: (event: Event) => (
        <div>
          <p className="font-medium text-secondary-900">{event.title}</p>
          {event.description && (
            <p className="text-xs text-secondary-500 line-clamp-1 max-w-md">{event.description}</p>
          )}
        </div>
      )
    },
    {
      header: 'Category',
      accessor: (event: Event) => (
        <span className="text-secondary-700">{event.category || '-'}</span>
      )
    },
    {
      header: 'Period',
      accessor: (event: Event) => (
        <span className="text-sm text-secondary-600">
          {formatDate(event.start_date)} - {formatDate(event.end_date)}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (event: Event) => (
        canUpdate ? (
          <select
            value={event.status}
            onChange={(e) => handleStatusChange(event.id, e.target.value)}
            className="px-2 py-1 text-sm border border-secondary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        ) : (
          <Badge variant={getStatusVariant(event.status)} className="capitalize">
            {event.status}
          </Badge>
        )
      )
    },
    {
      header: 'Actions',
      accessor: (event: Event) => (
        <ActionMenu
          items={[
            {
              label: 'View',
              icon: <Eye size={14} />,
              onClick: () => navigate(`/events/${event.id}`),
            },
            {
              label: 'Edit',
              icon: <Edit size={14} />,
              onClick: () => navigate(`/events/${event.id}/edit`),
              hidden: !canUpdate,
            },
            {
              label: 'Delete',
              icon: <Trash2 size={14} />,
              onClick: () => setDeleteId(event.id),
              variant: 'danger',
              hidden: !canDelete,
            },
          ]}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Events</h1>
          <p className="text-secondary-500">{canCreate || canUpdate ? "Manage and track all your events" : "Browse available events and submit your proposals"}</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate('/events/new')}
            leftIcon={<Plus size={20} />}
          >
            Create Event
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <div className="w-full sm:w-auto sm:min-w-[180px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-secondary-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                leftIcon={<X size={16} />}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Table
        data={events}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(event) => navigate(`/events/${event.id}`)}
        emptyState={
          <EmptyState
            icon={Calendar}
            title={canCreate ? "No Events Found" : "No Events Available"}
            description={canCreate ? "You haven't created any events yet. Start by creating your first event to engage vendors." : "There are no events available at the moment. Check back later for new opportunities."}
            actionLabel={canCreate ? "Create Event" : undefined}
            onAction={canCreate ? () => navigate('/events/new') : undefined}
            variant="compact"
          />
        }
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={goToPrevPage}
            disabled={!canGoPrev}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-secondary-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={goToNextPage}
            disabled={!canGoNext(totalPages)}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmModal
        show={!!deleteId}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
