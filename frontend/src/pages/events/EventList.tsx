import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { Event } from '../../types';
import { Plus, Search, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { Button, Card, Table, Badge, ConfirmModal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export const EventList: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isVendor = hasRole('vendor');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchTerm]);

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

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
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
        <div className="text-sm text-secondary-600">
          <p>{formatDate(event.start_date)}</p>
          <p className="text-xs text-secondary-400">to {formatDate(event.end_date)}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (event: Event) => (
        <Badge variant={getStatusVariant(event.status)} className="capitalize">
          {event.status}
        </Badge>
      )
    },
    ...(!isVendor ? [{
      header: 'Actions',
      accessor: (event: Event) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/events/${event.id}/edit`); }}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
            onClick={(e: React.MouseEvent) => handleDeleteClick(e, event.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    }] : [])
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Events</h1>
          <p className="text-secondary-500">{isVendor ? "Browse available events and submit your proposals" : "Manage and track all your events"}</p>
        </div>
        {!isVendor && (
          <Button
            onClick={() => navigate('/events/new')}
            leftIcon={<Plus size={20} />}
          >
            Create Event
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" size={20} />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
      </Card>

      <Table
        data={events}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(event) => navigate(`/events/${event.id}`)}
        emptyMessage={isVendor ? "No events available at the moment." : "No events found. Create one to get started."}
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
