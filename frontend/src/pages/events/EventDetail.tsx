import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { Event } from '../../types';
import { ArrowLeft, Edit, Calendar, Tag, FileText, Users, Trophy } from 'lucide-react';
import { Button, Card, Badge, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export const EventDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchEvent(id);
  }, [id]);

  const fetchEvent = async (eventId: string) => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getById(eventId);
      if (response.status && response.data) {
        setEvent(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setIsLoading(false);
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <Card className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Event not found</h3>
        <Button onClick={() => navigate('/events')}>Back to Events</Button>
      </Card>
    );
  }

  const isVendor = hasRole(['vendor']);
  const canEdit = hasRole(['admin', 'client']);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/events')} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <div className="flex gap-3">
          {canEdit && (
            <Button onClick={() => navigate(`/events/${id}/edit`)} leftIcon={<Edit size={16} />}>
              Edit Event
            </Button>
          )}
          {isVendor && event.status === 'open' && (
            <Button variant="primary" onClick={() => navigate(`/events/${id}/submit`)}>
              Submit Pitch
            </Button>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <Card className="bg-gradient-to-br from-primary-900 to-primary-800 text-white border-none overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant={getStatusVariant(event.status)} className="bg-white/20 text-white border-none backdrop-blur-sm mb-4">
                {event.status}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              <div className="flex items-center gap-4 text-primary-100">
                {event.category && (
                  <span className="flex items-center text-sm">
                    <Tag size={16} className="mr-1.5" />
                    {event.category}
                  </span>
                )}
                <span className="flex items-center text-sm">
                  <Calendar size={16} className="mr-1.5" />
                  {formatDate(event.start_date)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary-600" />
              Description
            </h2>
            {event.description ? (
              <div className="prose prose-sm max-w-none text-secondary-700">
                <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </div>
            ) : (
              <p className="text-secondary-500 italic">No description provided</p>
            )}
          </Card>

          {/* Event Pamphlet/Images */}
          {event.files && event.files.filter(f => f.file_type === 'image').length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">Event Pamphlet</h2>
              <div className="space-y-4">
                {event.files.filter(f => f.file_type === 'image').map((file) => (
                  <div key={file.id} className="rounded-lg overflow-hidden border border-secondary-200">
                    <img 
                      src={file.file_url} 
                      alt={file.caption || 'Event pamphlet'} 
                      className="w-full h-auto object-contain"
                    />
                    {file.caption && (
                      <p className="text-sm text-secondary-600 p-3 bg-secondary-50">{file.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Documents Section */}
          {event.files && event.files.filter(f => f.file_type !== 'image').length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} className="text-primary-600" />
                Documents
              </h2>
              <div className="space-y-2">
                {event.files.filter(f => f.file_type !== 'image').map((file) => (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center p-3 border border-secondary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
                  >
                    <FileText size={20} className="text-secondary-400 group-hover:text-primary-600 mr-3" />
                    <div className="overflow-hidden flex-1">
                      <p className="font-medium text-secondary-900 group-hover:text-primary-700 capitalize truncate">
                        {file.file_type}
                      </p>
                      {file.caption && (
                        <p className="text-xs text-secondary-500 truncate">{file.caption}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-secondary-900 mb-4">Event Timeline</h3>
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary-100">
              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary-100 border-2 border-primary-600"></div>
                <p className="text-xs text-secondary-500 font-medium uppercase tracking-wider mb-1">Start Date</p>
                <p className="text-sm font-medium text-secondary-900">{formatDate(event.start_date)}</p>
              </div>
              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-secondary-100 border-2 border-secondary-400"></div>
                <p className="text-xs text-secondary-500 font-medium uppercase tracking-wider mb-1">End Date</p>
                <p className="text-sm font-medium text-secondary-900">{formatDate(event.end_date)}</p>
              </div>
            </div>
          </Card>

          {event.winner_vendor_id && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900">Winner Selected</h3>
                  <p className="text-xs text-yellow-700">Event Completed</p>
                </div>
              </div>
              <p className="text-sm text-yellow-800 bg-white/50 p-3 rounded-lg border border-yellow-100">
                Vendor ID: <span className="font-mono font-medium">{event.winner_vendor_id.slice(0, 8)}...</span>
              </p>
            </Card>
          )}

          <Card>
            <h3 className="font-semibold text-secondary-900 mb-4">System Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-secondary-100">
                <span className="text-secondary-500">Created</span>
                <span className="text-secondary-900">{new Date(event.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-secondary-500">Last Update</span>
                <span className="text-secondary-900">
                  {event.updated_at ? new Date(event.updated_at).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
