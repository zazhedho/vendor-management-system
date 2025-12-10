import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import { EventSubmission, EventSubmissionGroup } from '../../types';
import { FileText, Award, Trophy, Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X, Send } from 'lucide-react';
import { Button, Card, Badge, Spinner, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import { ScoreSubmissionModal } from './ScoreSubmissionModal';
import { SelectWinnerModal } from './SelectWinnerModal';
import { toast } from 'react-toastify';

export const SubmissionList: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorPage, setVendorPage] = useState(1);
  const [scoreModalData, setScoreModalData] = useState<{ submissionId: string; currentScore?: number } | null>(null);
  const [winnerModalData, setWinnerModalData] = useState<{ eventId: string; eventTitle: string; submissions: EventSubmission[] } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  
  const debouncedSearch = useDebounce(searchTerm, 300);

  const canSubmit = hasPermission('event', 'submit_pitch');
  const canListSubmissions = hasPermission('event', 'list_submissions');
  const canViewEventSubmissions = hasPermission('event', 'view_submissions') || canListSubmissions;
  const canViewMySubmissions = hasPermission('event', 'view_my_submissions') || canSubmit;
  const canViewVendorSubmissions = hasPermission('vendor', 'view_submissions');
  const canViewSubmissions = canViewEventSubmissions || canViewVendorSubmissions || canViewMySubmissions;
  const canScore = hasPermission('event', 'score');
  const canSelectWinner = hasPermission('event', 'select_winner');
  const hasSubmissionAccess = canSubmit || canViewSubmissions;
  const isVendorView = canViewMySubmissions && !canViewEventSubmissions;
  const vendorPageSize = 10;

  // Vendor submissions query
  const { data: vendorResponse, isLoading: isLoadingVendor } = useQuery({
    queryKey: ['mySubmissions', { page: vendorPage, search: debouncedSearch }],
    queryFn: () => eventsApi.getMySubmissions({
      page: vendorPage,
      limit: vendorPageSize,
      search: debouncedSearch,
      order_by: 'updated_at',
      order_direction: 'desc'
    }),
    enabled: hasSubmissionAccess && isVendorView,
  });

  // Grouped submissions query (admin view)
  const { data: groupedResponse, isLoading: isLoadingGrouped } = useQuery({
    queryKey: ['groupedSubmissions', { page: currentPage, search: debouncedSearch }],
    queryFn: () => eventsApi.getGroupedSubmissions({
      page: currentPage,
      limit: 10,
      search: debouncedSearch,
      submission_page: 1,
      submission_limit: 10
    }),
    enabled: hasSubmissionAccess && !isVendorView && canViewEventSubmissions,
  });

  // Shortlist mutation
  const shortlistMutation = useMutation({
    mutationFn: ({ submissionId, isShortlisted }: { submissionId: string; isShortlisted: boolean }) =>
      eventsApi.shortlistSubmission(submissionId, isShortlisted),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groupedSubmissions'] });
      toast.success(variables.isShortlisted ? 'Submission shortlisted' : 'Shortlist removed');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update shortlist');
    },
  });

  const vendorSubmissions = vendorResponse?.data || [];
  const vendorTotalPages = vendorResponse?.total_pages || 1;
  const vendorTotalData = vendorResponse?.total_data || vendorSubmissions.length;
  const groupedData = groupedResponse?.data || null;

  const isLoading = isVendorView ? isLoadingVendor : isLoadingGrouped;

  const handleReset = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setVendorPage(1);
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

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const toggleShortlist = (submissionId: string, current: boolean) => {
    shortlistMutation.mutate({ submissionId, isShortlisted: !current });
  };

  const getStatusBadge = (submission: EventSubmission) => {
    if (submission.is_winner) {
      return <Badge variant="success"><Trophy className="w-3 h-3 inline mr-1" />Winner</Badge>;
    }
    if (submission.is_shortlisted) {
      return <Badge variant="info"><Star className="w-3 h-3 inline mr-1" />Shortlisted</Badge>;
    }
    if (submission.score !== null && submission.score !== undefined) {
      return <Badge variant="warning">Scored</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!hasSubmissionAccess) {
    return (
      <Card className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Access Restricted</h3>
        <p className="text-secondary-600">You do not have permission to view submissions.</p>
      </Card>
    );
  }

  // Vendor/self view - show their submissions
  if (isVendorView) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        </div>

        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by event name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVendorPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {searchTerm && (
              <Button onClick={handleReset} variant="secondary" leftIcon={<X className="w-4 h-4" />}>
                Reset
              </Button>
            )}
          </div>
        </Card>

        {vendorSubmissions.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No Submissions Found"
            description={debouncedSearch ? "No submissions match your search criteria. Try adjusting your search terms." : "You haven't submitted any pitches yet. Browse available events and submit your proposals to participate."}
            variant="compact"
          />
        ) : (
          <>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendorSubmissions.map((submission) => (
                    <React.Fragment key={submission.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{submission.event?.title}</div>
                          <div className="text-sm text-gray-500">{submission.event?.category}</div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(submission)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {submission.score !== null && submission.score !== undefined ? submission.score.toFixed(1) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(submission.id)}
                            leftIcon={expandedRows.has(submission.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          >
                            {expandedRows.has(submission.id) ? 'Hide' : 'Show'} Details
                          </Button>
                        </td>
                      </tr>
                      {expandedRows.has(submission.id) && (
                        <tr>
                          <td colSpan={5} className="px-6 py-6 bg-gradient-to-br from-gray-50 to-gray-100">
                            <div className="grid grid-cols-1 gap-4">
                              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <div className="flex items-start gap-2 mb-2">
                                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <h4 className="text-sm font-semibold text-gray-900">Proposal Details</h4>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed pl-7">{submission.proposal_details}</p>
                              </div>
                              
                              {submission.additional_materials && (
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                  <div className="flex items-start gap-2 mb-2">
                                    <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <h4 className="text-sm font-semibold text-gray-900">Additional Materials</h4>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed pl-7">{submission.additional_materials}</p>
                                </div>
                              )}
                              
                              {submission.comments && (
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                  <div className="flex items-start gap-2 mb-2">
                                    <Award className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <h4 className="text-sm font-semibold text-gray-900">Evaluator Comments</h4>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed pl-7">{submission.comments}</p>
                                </div>
                              )}
                              
                              {submission.files && submission.files.length > 0 && (
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                  <div className="flex items-start gap-2 mb-3">
                                    <FileText className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <h4 className="text-sm font-semibold text-gray-900">Attachments ({submission.files.length})</h4>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-7">
                                    {submission.files.map((file) => (
                                      <a
                                        key={file.id}
                                        href={file.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                      >
                                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                        <span className="truncate">{file.caption || file.file_type}</span>
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
            {vendorTotalPages > 1 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
                <p className="text-sm text-gray-600">
                  Showing {(vendorPage - 1) * vendorPageSize + 1} - {Math.min(vendorPage * vendorPageSize, vendorTotalData)} of {vendorTotalData}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" disabled={vendorPage === 1} onClick={() => setVendorPage(Math.max(1, vendorPage - 1))} leftIcon={<ChevronLeft className="w-4 h-4" />}>
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">Page {vendorPage} of {vendorTotalPages}</span>
                  <Button variant="secondary" disabled={vendorPage >= vendorTotalPages} onClick={() => setVendorPage(Math.min(vendorTotalPages, vendorPage + 1))} rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Review view - show grouped submissions
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">All Submissions</h1>
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by event name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchTerm && (
            <Button onClick={handleReset} variant="secondary" leftIcon={<X className="w-4 h-4" />}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      {!groupedData || groupedData.event_groups.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No Submissions Found"
          description="No submissions match your search criteria. Try adjusting your search terms or wait for vendors to submit their proposals."
          variant="compact"
        />
      ) : (
        <div className="space-y-4">
          {groupedData.event_groups.map((group: EventSubmissionGroup) => (
            <Card key={group.event.id}>
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{group.event.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{group.event.category}</span>
                      <span>•</span>
                      <span>{group.total_submissions} submission{group.total_submissions !== 1 ? 's' : ''}</span>
                      {group.event.winner_vendor && (
                        <>
                          <span>•</span>
                          <Badge variant="success">
                            <Trophy className="w-3 h-3 inline mr-1" />
                            Winner: {group.event.winner_vendor.profile?.vendor_name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canSelectWinner && !group.event.winner_vendor_id && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setWinnerModalData({ eventId: group.event.id, eventTitle: group.event.title, submissions: group.submissions })}
                        leftIcon={<Trophy className="w-4 h-4" />}
                      >
                        Select Winner
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEvent(group.event.id)}
                      leftIcon={expandedEvents.has(group.event.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    >
                      {expandedEvents.has(group.event.id) ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>
                </div>
              </div>

              {expandedEvents.has(group.event.id) && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.submissions.map((submission) => (
                        <React.Fragment key={submission.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{submission.vendor?.profile?.vendor_name}</div>
                              {submission.vendor?.vendor_code && (
                                <div className="text-xs text-gray-500 font-mono">{submission.vendor.vendor_code}</div>
                              )}
                              <div className="text-sm text-gray-500">{submission.vendor?.profile?.business_field}</div>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(submission)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {submission.score !== null && submission.score !== undefined ? submission.score.toFixed(1) : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(submission.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {canScore && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setScoreModalData({ submissionId: submission.id, currentScore: submission.score || undefined })}
                                    leftIcon={<Award className="w-4 h-4" />}
                                  >
                                    Score
                                  </Button>
                                )}
                                {canScore && (
                                  <Button
                                    variant={submission.is_shortlisted ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => toggleShortlist(submission.id, submission.is_shortlisted || false)}
                                    disabled={shortlistMutation.isPending}
                                  >
                                    {submission.is_shortlisted ? 'Unshortlist' : 'Shortlist'}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRow(submission.id)}
                                  leftIcon={expandedRows.has(submission.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                >
                                  Details
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {expandedRows.has(submission.id) && (
                            <tr>
                              <td colSpan={5} className="px-6 py-6 bg-gradient-to-br from-gray-50 to-gray-100">
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <div className="flex items-start gap-2 mb-2">
                                      <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <h4 className="text-sm font-semibold text-gray-900">Proposal Details</h4>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed pl-7">{submission.proposal_details}</p>
                                  </div>
                                  
                                  {submission.additional_materials && (
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                      <div className="flex items-start gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <h4 className="text-sm font-semibold text-gray-900">Additional Materials</h4>
                                      </div>
                                      <p className="text-sm text-gray-700 leading-relaxed pl-7">{submission.additional_materials}</p>
                                    </div>
                                  )}
                                  
                                  {submission.comments && (
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                      <div className="flex items-start gap-2 mb-2">
                                        <Award className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                        <h4 className="text-sm font-semibold text-gray-900">Evaluator Comments</h4>
                                      </div>
                                      <p className="text-sm text-gray-700 leading-relaxed pl-7">{submission.comments}</p>
                                    </div>
                                  )}
                                  
                                  {submission.files && submission.files.length > 0 && (
                                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                      <div className="flex items-start gap-2 mb-3">
                                        <FileText className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                        <h4 className="text-sm font-semibold text-gray-900">Attachments ({submission.files.length})</h4>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-7">
                                        {submission.files.map((file) => (
                                          <a
                                            key={file.id}
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                          >
                                            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                            <span className="truncate">{file.caption || file.file_type}</span>
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
              )}
            </Card>
          ))}

          {/* Event pagination */}
          {groupedData.total_pages > 1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm text-gray-700">
                Page {groupedData.current_page} of {groupedData.total_pages} ({groupedData.total_events} events)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(prev => Math.min(groupedData.total_pages, prev + 1))}
                  disabled={currentPage === groupedData.total_pages}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {scoreModalData && (
        <ScoreSubmissionModal
          submissionId={scoreModalData.submissionId}
          currentScore={scoreModalData.currentScore}
          onClose={() => setScoreModalData(null)}
          onSuccess={() => {
            setScoreModalData(null);
            queryClient.invalidateQueries({ queryKey: ['groupedSubmissions'] });
            queryClient.invalidateQueries({ queryKey: ['mySubmissions'] });
          }}
        />
      )}

      {winnerModalData && (
        <SelectWinnerModal
          eventId={winnerModalData.eventId}
          eventTitle={winnerModalData.eventTitle}
          submissions={winnerModalData.submissions}
          onClose={() => setWinnerModalData(null)}
          onSuccess={() => {
            setWinnerModalData(null);
            queryClient.invalidateQueries({ queryKey: ['groupedSubmissions'] });
          }}
        />
      )}
    </div>
  );
};
