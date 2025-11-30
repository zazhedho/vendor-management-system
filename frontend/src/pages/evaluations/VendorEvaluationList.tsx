import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation } from '../../types';
import { Star, Image as ImageIcon, Calendar, MessageSquare, Award, AlertCircle } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { toast } from 'react-toastify';

export const VendorEvaluationList = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyEvaluations();
  }, []);

  const fetchMyEvaluations = async () => {
    setIsLoading(true);
    try {
      const response = await evaluationsApi.getMyEvaluations();
      if (response.status) {
        setEvaluations(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch evaluations:', error);
      toast.error(error?.response?.data?.error || 'Failed to load evaluations');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-secondary-200"></div>
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            My Evaluations
          </h1>
          <p className="text-secondary-600 mt-1">Evaluations for completed events you won</p>
        </div>
      </div>

      {/* Info Card */}
      <Card variant="glass" className="border border-info-200 bg-gradient-to-r from-info-50/50 to-primary-50/50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-info-500 to-info-600 rounded-xl flex items-center justify-center shadow-lg">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-secondary-900 mb-1">About Evaluations</h3>
            <p className="text-sm text-secondary-700 leading-relaxed">
              You can create evaluations for events you won and have completed. Upload up to 5 photos with captions to showcase your work. The client will review and rate each photo.
            </p>
          </div>
        </div>
      </Card>

      {/* Evaluations Grid */}
      {evaluations.length === 0 ? (
        <Card className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-100 rounded-2xl mb-4">
            <AlertCircle className="w-10 h-10 text-secondary-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Evaluations Yet</h3>
          <p className="text-secondary-600 mb-6 max-w-md mx-auto">
            Win and complete events to create evaluations and showcase your work
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map((evaluation) => (
            <Card
              key={evaluation.id}
              variant="elevated"
              className="group hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02]"
              onClick={() => navigate(`/evaluations/${evaluation.id}`)}
            >
              {/* Event Info */}
              <div className="mb-4 pb-4 border-b border-secondary-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-secondary-500">
                    #{evaluation.event?.id?.slice(0, 8) || 'N/A'}
                  </span>
                  <Badge variant="success" size="sm" dot>
                    Completed
                  </Badge>
                </div>
                <h3 className="font-semibold text-secondary-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {evaluation.event?.title || 'Event'}
                </h3>
              </div>

              {/* Overall Rating */}
              <div className="mb-4">
                {evaluation.overall_rating ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-warning-100 to-orange-100 rounded-lg">
                      <Star className="w-4 h-4 text-warning-600 fill-warning-600" />
                      <span className="text-lg font-bold text-warning-900">
                        {evaluation.overall_rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-warning-700">/5</span>
                    </div>
                    <span className="text-xs text-secondary-500">Overall Rating</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-secondary-400">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">Not rated yet</span>
                  </div>
                )}
              </div>

              {/* Photos Count */}
              <div className="flex items-center gap-2 text-sm text-secondary-600 mb-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary-100 rounded-lg">
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-medium">{evaluation.photos?.length || 0}</span>
                </div>
                <span className="text-xs">photos uploaded</span>
              </div>

              {/* Comments Preview */}
              {evaluation.comments && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-secondary-400" />
                    <span className="text-xs text-secondary-500">Comments</span>
                  </div>
                  <p className="text-sm text-secondary-700 line-clamp-2">
                    {evaluation.comments}
                  </p>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-secondary-500 pt-4 border-t border-secondary-100">
                <Calendar className="w-3.5 h-3.5" />
                <span>Created {formatDate(evaluation.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
