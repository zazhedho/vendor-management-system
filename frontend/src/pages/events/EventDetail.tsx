import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { vendorsApi } from '../../api/vendors';
import { Event } from '../../types';
import { ArrowLeft, Edit, Calendar, Tag, FileText, Trophy, AlertCircle } from 'lucide-react';
import { Button, Card, Badge, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { SubmitPitchModal } from '../submissions/SubmitPitchModal';

export const EventDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const isVendor = hasRole(['vendor']);

  useEffect(() => {
    if (id) fetchEvent(id);
    if (isVendor) {
      fetchVendorProfile();
      checkExistingSubmission();
    }
  }, [id, isVendor]);

  const checkExistingSubmission = async () => {
    try {
      const response = await eventsApi.getMySubmissions();
      if (response.status && response.data) {
        const existingSubmission = response.data.find((s: any) => s.event_id === id);
        setHasSubmitted(!!existingSubmission);
      }
    } catch (error) {
      console.error('Failed to check submissions:', error);
    }
  };

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

  const fetchVendorProfile = async () => {
    try {
      const response = await vendorsApi.getMyVendorProfile();
      if (response.status && response.data) {
        setVendorProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch vendor profile:', error);
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

  const canEdit = hasRole(['admin', 'client']);
  const vendorStatus = vendorProfile?.vendor?.status;
  const isVendorActive = vendorStatus === 'active';
  const isEventOpen = event.status === 'open';
  const canSubmit = isVendor && isEventOpen && isVendorActive && !hasSubmitted;
  
  // Check if current vendor is the winner
  const currentVendorId = vendorProfile?.vendor?.id;
  const isCurrentVendorWinner = isVendor && event.winner_vendor_id && currentVendorId === event.winner_vendor_id;

  const getEventStatusMessage = (status: string) => {
    const messages: Record<string, string> = {
      draft: 'This event is still in draft and not yet published.',
      pending: 'This event is pending approval and not yet open for submissions.',
      closed: 'This event has been closed and no longer accepts submissions.',
      completed: 'This event has been completed and submissions are closed.',
      cancelled: 'This event has been cancelled.',
    };
    return messages[status] || 'This event is not open for submissions.';
  };

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
          {canSubmit && (
            <Button variant="primary" onClick={() => setShowSubmitModal(true)}>
              Submit Pitch
            </Button>
          )}
        </div>
      </div>

      {/* Winner Announcement - Show at top for vendors when winner is selected */}
      {isVendor && event.winner_vendor_id && (
        isCurrentVendorWinner ? (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <Trophy size={28} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-xl">Congratulations!</h3>
                <p className="text-green-700 mt-1">
                  You have been selected as the winner for this event. The client will contact you soon for further details.
                </p>
              </div>
            </div>
          </Card>
        ) : hasSubmitted ? (
          <Card className="bg-secondary-50 border-secondary-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-500 shrink-0">
                <Trophy size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900">Thank You for Participating</h3>
                <p className="text-sm text-secondary-600 mt-1">
                  Unfortunately, you were not selected as the winner for this event. Don't give up! Keep improving and try again in future events.
                </p>
              </div>
            </div>
          </Card>
        ) : null
      )}

      {/* Event Status Alert - Not Open (only show if no winner yet) */}
      {isVendor && !isEventOpen && !event.winner_vendor_id && (
        <Card className="bg-secondary-50 border-secondary-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-secondary-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-secondary-900">Event Not Open</h4>
              <p className="text-sm text-secondary-700 mt-1">
                {getEventStatusMessage(event.status)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Vendor Status Alert - Not Active (only show if no winner yet) */}
      {isVendor && isEventOpen && !isVendorActive && !hasSubmitted && !event.winner_vendor_id && (
        <Card className="bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-warning-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-warning-900">Cannot Submit Pitch</h4>
              <p className="text-sm text-warning-700 mt-1">
                Your vendor status is <strong>{vendorStatus || 'not active'}</strong>.
                Only vendors with <strong>active</strong> status can submit pitches to events.
                Please contact the administrator to activate your vendor account.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Already Submitted Alert (only show if no winner yet) */}
      {isVendor && hasSubmitted && !event.winner_vendor_id && (
        <Card className="bg-success-50 border-success-200">
          <div className="flex items-start gap-3">
            <FileText className="text-success-600 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-success-900">Pitch Already Submitted</h4>
              <p className="text-sm text-success-700 mt-1">
                You have already submitted a pitch for this event. You can view your submission in the <strong>My Submissions</strong> page.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 text-success-700 hover:text-success-900"
                onClick={() => navigate('/submissions')}
              >
                View My Submissions
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Submit Pitch Modal */}
      {showSubmitModal && event && id && (
        <SubmitPitchModal
          eventId={id}
          eventTitle={event.title}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => {
            setShowSubmitModal(false);
            fetchEvent(id);
          }}
        />
      )}

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

      {/* Winner Card - For Admin/Client/Superadmin below title */}
      {event.winner_vendor_id && !isVendor && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0">
              <Trophy size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Winner Selected</h3>
              <p className="text-sm text-yellow-800">
                <span className="font-medium">{event.winner_vendor?.profile?.vendor_name || `Vendor ID: ${event.winner_vendor_id.slice(0, 8)}...`}</span>
                {event.winner_vendor?.profile?.email && (
                  <span className="text-yellow-700 ml-2">({event.winner_vendor.profile.email})</span>
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Pamphlet/Images - Show first */}
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

          {/* Description - After pamphlet */}
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
