import React, { useMemo, useState, useEffect } from 'react';
import { eventsApi } from '../../api/events';
import { EventSubmission } from '../../types';
import { toast } from 'react-toastify';
import { X, Trophy, Award, Star, Search } from 'lucide-react';
import { Button, Badge, ConfirmModal, Input } from '../../components/ui';

interface SelectWinnerModalProps {
  eventId: string;
  eventTitle: string;
  submissions: EventSubmission[];
  onClose: () => void;
  onSuccess: () => void;
}

export const SelectWinnerModal: React.FC<SelectWinnerModalProps> = ({
  eventId,
  eventTitle,
  submissions,
  onClose,
  onSuccess,
}) => {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  useEffect(() => {
    setVisibleCount(20);
  }, [debouncedSearch, submissions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmissionId) {
      toast.error('Please select a submission');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const response = await eventsApi.selectWinner(eventId, selectedSubmissionId);
      if (response.status) {
        toast.success('Winner selected successfully!');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to select winner');
      }
    } catch (error: any) {
      console.error('Failed to select winner:', error);
      toast.error(error.message || 'Failed to select winner');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const selectedVendorName = submissions.find(s => s.id === selectedSubmissionId)?.vendor?.profile?.vendor_name || 'this vendor';
  const shortlistedSubmissions = useMemo(
    () => submissions.filter((s) => s.is_shortlisted || s.is_winner),
    [submissions]
  );

  const sortedSubmissions = useMemo(() => {
    return [...shortlistedSubmissions].sort((a, b) => {
      if (a.is_winner) return -1;
      if (b.is_winner) return 1;
      const scoreA = a.score ?? -Infinity;
      const scoreB = b.score ?? -Infinity;
      if (scoreA !== scoreB) return scoreB - scoreA;
      const nameA = a.vendor?.profile?.vendor_name || '';
      const nameB = b.vendor?.profile?.vendor_name || '';
      return nameA.localeCompare(nameB);
    });
  }, [shortlistedSubmissions]);

  const filteredSubmissions = useMemo(() => {
    if (!debouncedSearch) return sortedSubmissions;
    const term = debouncedSearch.toLowerCase();
    return sortedSubmissions.filter((s) => {
      const name = s.vendor?.profile?.vendor_name?.toLowerCase() || '';
      const email = s.vendor?.profile?.email?.toLowerCase() || '';
      const id = s.vendor_id?.toLowerCase() || '';
      return name.includes(term) || email.includes(term) || id.includes(term);
    });
  }, [debouncedSearch, sortedSubmissions]);

  const visibleSubmissions = filteredSubmissions.slice(0, visibleCount);

  useEffect(() => {
    if (!shortlistedSubmissions.find((s) => s.id === selectedSubmissionId)) {
      setSelectedSubmissionId('');
    }
  }, [shortlistedSubmissions, selectedSubmissionId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              Select Winner
            </h2>
            <p className="text-xs text-secondary-500">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
            <X size={20} />
          </button>
        </div>

        {shortlistedSubmissions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Award size={36} className="mx-auto text-secondary-400 mb-3" />
            <h3 className="font-medium text-secondary-900 mb-1">No Shortlisted Submissions</h3>
            <p className="text-sm text-secondary-600 mb-4">Shortlist submissions first.</p>
            <Button size="sm" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-3 pt-3">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor by name, email, or ID..."
                leftIcon={<Search size={16} className="text-secondary-400" />}
              />
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-3 space-y-2">
              {visibleSubmissions.map((submission) => (
                <label
                  key={submission.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSubmissionId === submission.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="winner"
                    value={submission.id}
                    checked={selectedSubmissionId === submission.id}
                    onChange={(e) => setSelectedSubmissionId(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-secondary-900 truncate">
                        {submission.vendor?.profile?.vendor_name || `ID: ${submission.vendor_id.slice(0, 8)}`}
                      </span>
                      {submission.is_winner && (
                        <Badge variant="success" className="text-xs px-1.5 py-0.5">Winner</Badge>
                      )}
                    </div>
                    <p className="text-xs text-secondary-500 truncate">
                      {submission.vendor?.profile?.email || '-'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {submission.score != null && (
                      <div className="flex items-center gap-1 text-xs text-secondary-600">
                        <Star size={12} className="text-yellow-500" fill="currentColor" />
                        {submission.score}
                      </div>
                    )}
                  </div>
                </label>
              ))}
              {visibleCount < filteredSubmissions.length && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setVisibleCount((c) => c + 20)}
                  >
                    Load More
                  </Button>
                </div>
              )}
              {filteredSubmissions.length === 0 && (
                <p className="text-center text-sm text-secondary-500 py-4">No submissions match your search.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-3 border-t bg-secondary-50">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" leftIcon={<Trophy size={14} />} disabled={isSubmitting}>
                Select Winner
              </Button>
            </div>
          </form>
        )}
      </div>

      <ConfirmModal
        show={showConfirm}
        title="Confirm Winner Selection"
        message={`Are you sure you want to select "${selectedVendorName}" as the winner? This action cannot be undone.`}
        confirmText="Confirm"
        variant="warning"
        isLoading={isSubmitting}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};
