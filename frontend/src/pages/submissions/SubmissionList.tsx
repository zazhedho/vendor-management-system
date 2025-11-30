import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { EventSubmission, Event } from '../../types';
import { FileText, Award, Trophy, Star, Eye, Filter } from 'lucide-react';
import { Button, Card, Badge, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { ScoreSubmissionModal } from './ScoreSubmissionModal';
import { SelectWinnerModal } from './SelectWinnerModal';

export const SubmissionList: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [scoreModalData, setScoreModalData] = useState<{ submissionId: string; currentScore?: number } | null>(null);
  const [winnerModalData, setWinnerModalData] = useState<{ eventId: string; eventTitle: string } | null>(null);

  const isVendor = hasRole(['vendor']);
  const isClient = hasRole(['client']);
  const canManage = hasRole(['admin', 'superadmin', 'client']);

  useEffect(() => {
    if (isVendor) {
      fetchVendorSubmissions();
    } else if (canManage) {
      fetchEvents();
    }
  }, []);

  useEffect(() => {
    if (canManage && selectedEvent) {
      fetchEventSubmissions(selectedEvent);
    }
  }, [selectedEvent]);

  const fetchVendorSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getMySubmissions();
      if (response.status && response.data) {
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getAll({ limit: 100 });
      if (response.status && response.data) {
        setEvents(response.data);
        // Auto-select first event
        if (response.data.length > 0) {
          setSelectedEvent(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventSubmissions = async (eventId: string) => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getSubmissions(eventId);
      if (response.status && response.data) {
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch event submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortlist = async (submissionId: string, currentStatus: boolean) => {
    try {
      const response = await eventsApi.shortlistSubmission(submissionId, !currentStatus);
      if (response.status) {
        toast.success(currentStatus ? 'Removed from shortlist' : 'Added to shortlist');
        if (isVendor) {
          fetchVendorSubmissions();
        } else if (selectedEvent) {
          fetchEventSubmissions(selectedEvent);
        }
      }
    } catch (error) {
      toast.error('Failed to update shortlist status');
    }
  };

  const getStatusBadge = (submission: EventSubmission) => {
    if (submission.is_winner) {
      return (
        <Badge variant="success">
          <Trophy size={14} className="inline mr-1" />
          Winner
        </Badge>
      );
    }
    if (submission.is_shortlisted) {
      return (
        <Badge variant="info">
          <Award size={14} className="inline mr-1" />
          Shortlisted
        </Badge>
      );
    }
    return <Badge variant="secondary">Submitted</Badge>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">
            {isVendor ? 'My Submissions' : 'Event Submissions Management'}
          </h1>
          <p className="text-secondary-600 mt-1">
            {isVendor
              ? 'View all your event submissions and their status'
              : 'Manage and review vendor submissions for events'}
          </p>
        </div>
      </div>

      {/* Admin Event Filter */}
      {canManage && (
        <Card>
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-secondary-500" />
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select Event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} - {event.status}
                </option>
              ))}
            </select>
            {isClient && selectedEvent && (() => {
              const event = events.find(e => e.id === selectedEvent);
              const hasWinner = event?.winner_vendor_id;
              const winnerVendorSuspended = event?.winner_vendor?.status === 'suspended';
              
              if (hasWinner && !winnerVendorSuspended) {
                return (
                  <Badge variant="success" className="flex items-center gap-1 px-3 py-2">
                    <Trophy size={14} />
                    Winner Selected
                  </Badge>
                );
              }
              return (
                <Button
                  variant={winnerVendorSuspended ? "secondary" : "primary"}
                  onClick={() => {
                    if (event) {
                      setWinnerModalData({ eventId: selectedEvent, eventTitle: event.title });
                    }
                  }}
                >
                  <Trophy size={16} className="mr-2" />
                  {winnerVendorSuspended ? 'Change Winner' : 'Select Winner'}
                </Button>
              );
            })()}
          </div>
        </Card>
      )}

      {submissions.length === 0 ? (
        <Card className="text-center py-12">
          <FileText size={48} className="mx-auto text-secondary-400 mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            {isVendor ? 'No Submissions Yet' : 'No Submissions Found'}
          </h3>
          <p className="text-secondary-600 mb-4">
            {isVendor
              ? "You haven't submitted any pitches to events yet."
              : selectedEvent
                ? 'No vendors have submitted pitches for this event yet.'
                : 'Please select an event to view submissions.'}
          </p>
          {isVendor && <Button onClick={() => navigate('/events')}>Browse Events</Button>}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {canManage
                        ? submission.vendor?.profile?.vendor_name || `Vendor ID: ${submission.vendor_id.slice(0, 8)}...`
                        : submission.event?.title || `Event ID: ${submission.event_id}`
                      }
                    </h3>
                    {getStatusBadge(submission)}
                  </div>
                  {canManage && submission.vendor?.profile && (
                    <p className="text-sm text-secondary-500 mb-2">
                      {submission.vendor.profile.email} | {submission.vendor.profile.phone || submission.vendor.profile.telephone || '-'}
                    </p>
                  )}

                  {submission.proposal_details && (
                    <p className="text-secondary-700 mb-3 line-clamp-2">
                      {submission.proposal_details}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-600">
                    <span className="flex items-center gap-1">
                      <FileText size={16} />
                      {submission.files?.length || 0} files
                    </span>
                    {submission.score !== null && submission.score !== undefined && (
                      <span className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500" />
                        Score: {submission.score}
                      </span>
                    )}
                    <span>Submitted: {formatDate(submission.created_at)}</span>
                  </div>
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  {isVendor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/events/${submission.event_id}`)}
                      leftIcon={<Eye size={16} />}
                    >
                      View Event
                    </Button>
                  )}
                  {canManage && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setScoreModalData({
                          submissionId: submission.id,
                          currentScore: submission.score
                        })}
                        leftIcon={<Star size={16} />}
                      >
                        Score
                      </Button>
                      <Button
                        variant={submission.is_shortlisted ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleShortlist(submission.id, submission.is_shortlisted)}
                        leftIcon={<Award size={16} />}
                      >
                        {submission.is_shortlisted ? 'Remove' : 'Shortlist'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Files Preview */}
              {submission.files && submission.files.length > 0 && (
                <div className="mt-4 pt-4 border-t border-secondary-200">
                  <p className="text-sm font-medium text-secondary-700 mb-2">Attached Files:</p>
                  <div className="flex flex-wrap gap-2">
                    {submission.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-100 hover:bg-secondary-200 rounded text-sm text-secondary-700 transition-colors"
                      >
                        <FileText size={14} />
                        {file.caption || file.file_type}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Score Modal */}
      {scoreModalData && (
        <ScoreSubmissionModal
          submissionId={scoreModalData.submissionId}
          currentScore={scoreModalData.currentScore}
          onClose={() => setScoreModalData(null)}
          onSuccess={() => {
            setScoreModalData(null);
            if (isVendor) {
              fetchVendorSubmissions();
            } else if (selectedEvent) {
              fetchEventSubmissions(selectedEvent);
            }
          }}
        />
      )}

      {/* Winner Selection Modal */}
      {winnerModalData && (
        <SelectWinnerModal
          eventId={winnerModalData.eventId}
          eventTitle={winnerModalData.eventTitle}
          submissions={submissions.filter(s => s.is_shortlisted)}
          onClose={() => setWinnerModalData(null)}
          onSuccess={() => {
            setWinnerModalData(null);
            if (selectedEvent) {
              fetchEventSubmissions(selectedEvent);
            }
          }}
        />
      )}
    </div>
  );
};
