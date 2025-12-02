import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { EventSubmission } from '../../types';
import { FileText, Award, Trophy, Star, Eye, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Card, Badge, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { ScoreSubmissionModal } from './ScoreSubmissionModal';
import { SelectWinnerModal } from './SelectWinnerModal';

export const SubmissionList: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [submissions, setSubmissions] = useState<EventSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [scoreModalData, setScoreModalData] = useState<{ submissionId: string; currentScore?: number } | null>(null);
  const [winnerModalData, setWinnerModalData] = useState<{ eventId: string; eventTitle: string } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const isVendor = hasRole(['vendor']);
  const canManage = hasRole(['admin', 'superadmin', 'client']);

  useEffect(() => {
    if (isVendor) {
      fetchVendorSubmissions();
    } else if (canManage) {
      fetchAllSubmissions();
    }
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    if (canManage) {
      fetchAllSubmissions();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleRow = (submissionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
    }
    setExpandedRows(newExpanded);
  };

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

  const fetchAllSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await eventsApi.getAllSubmissions({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });
      if (response.status && response.data) {
        setSubmissions(response.data);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
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
        } else {
          fetchAllSubmissions();
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

      {/* Admin Search */}
      {canManage && (
        <Card>
          <div className="flex items-center gap-4">
            <Search size={20} className="text-secondary-500" />
            <input
              type="text"
              placeholder="Search by event name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button onClick={handleSearch}>
              <Search size={16} className="mr-2" />
              Search
            </Button>
            {hasRole(['client']) && submissions.length > 0 && submissions[0].event && (
              <Button
                variant="primary"
                onClick={() => {
                  const event = submissions[0].event;
                  if (event) {
                    setWinnerModalData({ eventId: event.id, eventTitle: event.title });
                  }
                }}
                leftIcon={<Trophy size={16} />}
              >
                Select Winner
              </Button>
            )}
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
              : 'No submissions found. Try adjusting your search.'}
          </p>
          {isVendor && <Button onClick={() => navigate('/events')}>Browse Events</Button>}
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600 w-8"></th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">
                    {canManage ? 'Vendor' : 'Event'}
                  </th>
                  {canManage && (
                    <th className="text-left py-3 px-4 font-medium text-secondary-600">Event</th>
                  )}
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-secondary-600">Score</th>
                  <th className="text-center py-3 px-4 font-medium text-secondary-600">Files</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">Submitted</th>
                  <th className="text-right py-3 px-4 font-medium text-secondary-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {submissions.map((submission) => (
                  <React.Fragment key={submission.id}>
                    <tr className="hover:bg-secondary-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleRow(submission.id)}
                          className="text-secondary-600 hover:text-secondary-900"
                        >
                          {expandedRows.has(submission.id) ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-secondary-900">
                          {canManage
                            ? submission.vendor?.profile?.vendor_name || `Vendor ${submission.vendor_id.slice(0, 8)}...`
                            : submission.event?.title || `Event ${submission.event_id.slice(0, 8)}...`
                          }
                        </p>
                        {canManage && submission.vendor?.profile && (
                          <p className="text-xs text-secondary-500">
                            {submission.vendor.profile.email}
                          </p>
                        )}
                      </div>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4">
                        <p className="text-secondary-700">{submission.event?.title || '-'}</p>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      {getStatusBadge(submission)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {submission.score !== null && submission.score !== undefined ? (
                        <span className="inline-flex items-center gap-1 text-yellow-600 font-medium">
                          <Star size={14} className="fill-yellow-500" />
                          {submission.score}
                        </span>
                      ) : (
                        <span className="text-secondary-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-secondary-600">{submission.files?.length || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-secondary-600">{formatDate(submission.created_at)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {isVendor && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/events/${submission.event_id}`)}
                            leftIcon={<Eye size={14} />}
                          >
                            View
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
                              leftIcon={<Star size={14} />}
                            >
                              Score
                            </Button>
                            <Button
                              variant={submission.is_shortlisted ? 'secondary' : 'primary'}
                              size="sm"
                              onClick={() => handleShortlist(submission.id, submission.is_shortlisted)}
                              leftIcon={<Award size={14} />}
                            >
                              {submission.is_shortlisted ? 'Remove' : 'Shortlist'}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(submission.id) && (
                    <tr>
                      <td colSpan={canManage ? 8 : 7} className="py-4 px-4 bg-secondary-25">
                        <div className="space-y-3">
                          {submission.proposal_details && (
                            <div>
                              <p className="text-xs font-medium text-secondary-600 mb-1">Proposal Details:</p>
                              <p className="text-sm text-secondary-800 whitespace-pre-wrap">{submission.proposal_details}</p>
                            </div>
                          )}
                          {submission.additional_materials && (
                            <div>
                              <p className="text-xs font-medium text-secondary-600 mb-1">Additional Materials:</p>
                              <p className="text-sm text-secondary-800 whitespace-pre-wrap">{submission.additional_materials}</p>
                            </div>
                          )}
                          {submission.comments && (
                            <div>
                              <p className="text-xs font-medium text-secondary-600 mb-1">Comments:</p>
                              <p className="text-sm text-secondary-800 whitespace-pre-wrap">{submission.comments}</p>
                            </div>
                          )}
                          {submission.files && submission.files.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-secondary-600 mb-2">Attached Files:</p>
                              <div className="flex flex-wrap gap-2">
                                {submission.files.map((file) => (
                                  <a
                                    key={file.id}
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-secondary-200 hover:border-primary-500 rounded text-sm text-secondary-700 hover:text-primary-600 transition-colors"
                                  >
                                    <FileText size={14} />
                                    {file.caption || file.file_type}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {canManage && totalPages > 1 && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-500">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
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
            } else {
              fetchAllSubmissions();
            }
          }}
        />
      )}

      {/* Winner Selection Modal */}
      {winnerModalData && (
        <SelectWinnerModal
          eventId={winnerModalData.eventId}
          eventTitle={winnerModalData.eventTitle}
          submissions={submissions.filter(s => s.is_shortlisted && s.event_id === winnerModalData.eventId)}
          onClose={() => setWinnerModalData(null)}
          onSuccess={() => {
            setWinnerModalData(null);
            fetchAllSubmissions();
          }}
        />
      )}
    </div>
  );
};
