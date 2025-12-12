import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation, EvaluationPhoto } from '../../types';
import { Plus, Star, Image, Upload, Award, Eye, X, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Button, Card, Table, Badge, ActionMenu, EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';

export const EvaluationList: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const canListAll = hasPermission('evaluation', 'list');
  const canCreate = hasPermission('evaluation', 'create');
  const canUpdate = hasPermission('evaluation', 'update');
  const canDelete = hasPermission('evaluation', 'delete');
  const canUploadPhoto = hasPermission('evaluation', 'upload_photo');
  const canReviewPhoto = hasPermission('evaluation', 'review_photo');
  const canManageEvaluations = canCreate || canUpdate || canDelete || canReviewPhoto;
  const isVendorView = canUploadPhoto && !canManageEvaluations;

  const { data: response, isLoading } = useQuery({
    queryKey: ['evaluations', { page: currentPage, search: debouncedSearch, type: isVendorView ? 'my' : 'all' }],
    queryFn: () => {
      if (isVendorView) {
        return evaluationsApi.getMyEvaluations({
          page: currentPage,
          limit: 6,
          search: debouncedSearch,
        });
      }
      return evaluationsApi.getAll({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
      });
    },
    enabled: isVendorView || canListAll,
    placeholderData: (previousData) => previousData,
  });

  const evaluations = response?.data || [];
  const totalPages = response?.total_pages || 1;

  const handleReset = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-secondary-400 text-sm">Not rated</span>;

    return (
      <div className="flex items-center gap-1">
        <Star size={16} className="text-warning-400 fill-warning-400" />
        <span className="text-sm font-medium text-secondary-900">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const columns = [
    {
      header: 'Event',
      accessor: (evaluation: Evaluation) => (
        <span className="font-medium text-secondary-900">
          {evaluation.event?.title || evaluation.event_id?.slice(0, 8)}
        </span>
      )
    },
    {
      header: 'Vendor',
      accessor: (evaluation: Evaluation) => (
        <span className="text-sm text-secondary-600">
          {evaluation.vendor?.profile?.vendor_name || evaluation.vendor_id?.slice(0, 8)}
        </span>
      ),
      hidden: isVendorView
    },
    {
      header: 'Photos',
      accessor: (evaluation: Evaluation) => (
        <div className="flex items-center gap-1">
          <Image size={14} className="text-secondary-400" />
          <span className="text-sm">{evaluation.photos?.length || 0}/5</span>
        </div>
      )
    },
    {
      header: 'Rating',
      accessor: (evaluation: Evaluation) => renderStars(evaluation.overall_rating)
    },
    {
      header: 'Date',
      accessor: (evaluation: Evaluation) => (
        <span className="text-sm text-secondary-600">
          {new Date(evaluation.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (evaluation: Evaluation) => (
        <ActionMenu
          items={[
            {
              label: 'View',
              icon: <Eye size={14} />,
              onClick: () => navigate(`/evaluations/${evaluation.id}`),
            },
            {
              label: 'Upload Photos',
              icon: <Upload size={14} />,
              onClick: () => navigate(`/evaluations/${evaluation.id}/upload`),
              hidden: !canUploadPhoto || (evaluation.photos?.length || 0) >= 5,
            },
          ]}
        />
      )
    }
  ].filter(col => !col.hidden);

  // Helper function to get photo stats
  const getPhotoStats = (photos: EvaluationPhoto[] = []) => {
    const total = photos.length;
    const reviewed = photos.filter(p => p.rating != null).length;
    const pending = total - reviewed;
    return { total, reviewed, pending };
  };

  // Helper function to get evaluation status
  const getEvaluationStatus = (evaluation: Evaluation) => {
    const photos = evaluation.photos || [];
    const { total, reviewed } = getPhotoStats(photos);
    
    if (total === 0) return 'no_photos';
    if (total < 5) return 'uploading';
    if (reviewed === total) return 'completed';
    if (reviewed > 0) return 'reviewing';
    return 'pending_review';
  };

  // Vendor view - with backend pagination
  if (isVendorView) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">My Evaluations</h1>
            <p className="text-secondary-500">Upload photos for events you've completed</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border border-info-200 bg-info-50">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-info-600 mt-0.5" />
            <div className="text-sm text-info-800">
              <p className="font-medium mb-1">About Evaluations</p>
              <p className="text-info-700">
                After you win and complete an event, the client will create an evaluation. 
                You can then upload up to 5 photos showcasing your work. The client will review and rate each photo.
              </p>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : evaluations.length === 0 ? (
          <Card className="text-center py-12">
            <Award size={48} className="mx-auto text-secondary-400 mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No Evaluations Yet</h3>
            <p className="text-secondary-600">
              When a client creates an evaluation for an event you won, it will appear here.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evaluations.map((evaluation) => {
                const photoStats = getPhotoStats(evaluation.photos);
                const status = getEvaluationStatus(evaluation);
                const progressPercent = (photoStats.total / 5) * 100;
                const isCompleted = status === 'completed';

                return (
                  <Card 
                    key={evaluation.id} 
                    className={`hover:shadow-lg transition-all ${isCompleted ? 'border-success-200 bg-success-50/30' : ''}`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-secondary-900 truncate">
                          {evaluation.event?.title || 'Event'}
                        </h3>
                        <p className="text-xs text-secondary-500 mt-1">
                          {new Date(evaluation.created_at).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      {isCompleted ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle size={12} />
                          Completed
                        </Badge>
                      ) : evaluation.overall_rating ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-warning-100 rounded-lg">
                          <Star size={14} className="text-warning-500 fill-warning-500" />
                          <span className="text-sm font-semibold text-warning-700">
                            {evaluation.overall_rating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>

                    {/* Photo Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Image size={16} className="text-secondary-400" />
                          <span className="text-sm font-medium text-secondary-700">
                            Photos Uploaded
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-secondary-900">
                          {photoStats.total}/5
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            photoStats.total === 5 ? 'bg-success-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Review Status */}
                    {photoStats.total > 0 && (
                      <div className="flex items-center gap-4 mb-4 p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-success-500" />
                          <span className="text-xs text-secondary-600">
                            <span className="font-semibold text-success-600">{photoStats.reviewed}</span> reviewed
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-warning-500" />
                          <span className="text-xs text-secondary-600">
                            <span className="font-semibold text-warning-600">{photoStats.pending}</span> pending
                          </span>
                        </div>
                        {evaluation.overall_rating && (
                          <div className="flex items-center gap-1 ml-auto">
                            <Star size={14} className="text-warning-400 fill-warning-400" />
                            <span className="text-xs font-semibold text-secondary-700">
                              {evaluation.overall_rating.toFixed(1)} avg
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/evaluations/${evaluation.id}`)}
                        leftIcon={<Eye size={14} />}
                      >
                        View Details
                      </Button>
                      {photoStats.total < 5 && canUploadPhoto && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/evaluations/${evaluation.id}/upload`)}
                          leftIcon={<Upload size={14} />}
                        >
                          Upload ({5 - photoStats.total} left)
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="secondary"
                  size="sm"
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
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Management view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Evaluations</h1>
          <p className="text-secondary-500">Vendor performance evaluations and ratings</p>
        </div>
        {canCreate && (
          <Button leftIcon={<Plus size={20} />} onClick={() => navigate('/evaluations/new')}>
            New Evaluation
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search evaluations..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          {searchTerm && (
            <Button onClick={handleReset} variant="secondary" leftIcon={<X size={20} />}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      <Table
        data={evaluations}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(evaluation) => navigate(`/evaluations/${evaluation.id}`)}
        emptyState={
          <EmptyState
            icon={ClipboardList}
            title="No Evaluations Found"
            description={canCreate ? "You haven't created any evaluations yet. Start by evaluating vendor performance after event completion." : "There are no evaluation records available. Evaluations will appear here once created."}
            actionLabel={canCreate ? "New Evaluation" : undefined}
            onAction={canCreate ? () => navigate('/evaluations/new') : undefined}
            variant="compact"
          />
        }
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
    </div>
  );
};
