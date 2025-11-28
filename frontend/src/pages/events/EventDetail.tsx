import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { Event } from '../../types';
import { ArrowLeft, Edit, Calendar, Tag, FileText, Users } from 'lucide-react';

export const EventDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Event not found</h3>
        <button onClick={() => navigate('/events')} className="btn btn-primary mt-4">
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          <span>Back to Events</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              {event.category && (
                <span className="text-sm text-gray-600 flex items-center">
                  <Tag size={16} className="mr-1" />
                  {event.category}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(`/events/${id}/edit`)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Edit size={20} />
            <span>Edit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <FileText size={20} className="text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Description</h2>
            </div>
            {event.description ? (
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
            ) : (
              <p className="text-gray-500 italic">No description provided</p>
            )}
          </div>

          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Users size={20} className="text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Submissions</h2>
            </div>
            <p className="text-gray-500 italic">No submissions yet</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Event Details</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Calendar size={16} className="mr-2" />
                  <span className="text-sm font-medium">Start Date</span>
                </div>
                <p className="text-gray-900 ml-6">{formatDate(event.start_date)}</p>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Calendar size={16} className="mr-2" />
                  <span className="text-sm font-medium">End Date</span>
                </div>
                <p className="text-gray-900 ml-6">{formatDate(event.end_date)}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-900">
                  {new Date(event.created_at).toLocaleString('id-ID')}
                </p>
              </div>

              {event.updated_at && (
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(event.updated_at).toLocaleString('id-ID')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {event.winner_vendor_id && (
            <div className="card bg-green-50 border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">Winner</h3>
              <p className="text-sm text-green-800">
                Vendor ID: {event.winner_vendor_id.slice(0, 12)}...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
