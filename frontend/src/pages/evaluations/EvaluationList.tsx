import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation } from '../../types';
import { Plus, Search, Star, Image, Upload, Award, Eye, X } from 'lucide-react';
import { Button, Card, Table, Badge, ActionMenu } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export const EvaluationList: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canViewAll = hasPermission('evaluation', 'view');
  const canCreate = hasPermission('evaluation', 'create');
  const canUpdate = hasPermission('evaluation', 'update');
  const canDelete = hasPermission('evaluation', 'delete');
  const canUploadPhoto = hasPermission('evaluation', 'upload_photo');
  const canReviewPhoto = hasPermission('evaluation', 'review_photo');
  const canManageEvaluations = canCreate || canUpdate || canDelete || canReviewPhoto;
  const isVendorView = canUploadPhoto && !canManageEvaluations;
  const canListAll = canViewAll || canManageEvaluations;

  useEffect(() => {
    fetchEvaluations();
  }, [currentPage, isVendorView, canListAll]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchEvaluations();
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
      if (isVendorView) {
        const response = await evaluationsApi.getMyEvaluations();
        if (response.status) {
          setEvaluations(response.data || []);
          setTotalPages(1);
        }
      } else if (canListAll) {
        const response = await evaluationsApi.getAll({
          page: 1,
          limit: 10,
          search: '',
        });
        if (response.status) {
          setEvaluations(response.data || []);
          setTotalPages(response.total_pages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    setIsLoading(true);
    try {
      if (isVendorView) {
        const response = await evaluationsApi.getMyEvaluations();
        if (response.status) {
          setEvaluations(response.data || []);
          setTotalPages(1);
        }
      } else if (canListAll) {
        const response = await evaluationsApi.getAll({
          page: currentPage,
          limit: 10,
          search: searchTerm,
        });
        if (response.status) {
          setEvaluations(response.data || []);
          setTotalPages(response.total_pages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch evaluations:', error);
    } finally {
      setIsLoading(false);
    }
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

  // Vendor view
  if (isVendorView) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">My Evaluations</h1>
          <p className="text-secondary-500">Upload photos for events you've completed</p>
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

        {evaluations.length === 0 ? (
          <Card className="text-center py-12">
            <Award size={48} className="mx-auto text-secondary-400 mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No Evaluations Yet</h3>
            <p className="text-secondary-600">
              When a client creates an evaluation for an event you won, it will appear here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-secondary-900">
                      {evaluation.event?.title || 'Event'}
                    </h3>
                    <p className="text-xs text-secondary-500 mt-1">
                      {new Date(evaluation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {evaluation.overall_rating ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-warning-100 rounded">
                      <Star size={14} className="text-warning-500 fill-warning-500" />
                      <span className="text-sm font-medium text-warning-700">
                        {evaluation.overall_rating.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary">Not rated</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Image size={16} className="text-secondary-400" />
                  <span className="text-sm text-secondary-600">
                    {evaluation.photos?.length || 0} of 5 photos uploaded
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/evaluations/${evaluation.id}`)}
                  >
                    View Details
                  </Button>
                  {(evaluation.photos?.length || 0) < 5 && canUploadPhoto && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/evaluations/${evaluation.id}/upload`)}
                      leftIcon={<Upload size={14} />}
                    >
                      Upload Photos
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
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
        data={evaluations}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        onRowClick={(evaluation) => navigate(`/evaluations/${evaluation.id}`)}
        emptyMessage="No evaluations found."
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
