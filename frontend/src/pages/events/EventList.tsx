import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { Event } from '../../types';
import { Plus, Search, Eye, Edit, Trash2, X } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal, ActionMenu } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const EventList: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('event', 'create');
  const canUpdate = hasPermission('event', 'update');
  const canDelete = hasPermission('event', 'delete');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEvents();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = async () => {
    setSearchTerm('');
    setCurrentPage(1);
    
    setIsLoading(true);
    try {
      const response = await eventsApi.getAll({
        page: 1,
        limit: 10,
        search: ''
      });
      if (response.status) {
        setEvents(response.data || []);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });

      if (response.status) {
        setEvents(response.data || []);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await eventsApi.delete(deleteId);
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      await eventsApi.updateStatus(eventId, newStatus);
      toast.success('Event status updated successfully');
      fetchEvents();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update event status');
    }
  };

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
            <option value="pending">Pending</option>
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
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <Button onClick={handleSearch} leftIcon={<Search size={20} />}>
            Search
          </Button>
          {searchTerm && (
            <Button onClick={handleReset} variant="secondary" leftIcon={<X size={20} />}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      <Table
        data={events}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(event) => navigate(`/events/${event.id}`)}
        emptyMessage={canUpdate ? "No events found. Create one to get started." : "No events available at the moment."}
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-secondary-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
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
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
