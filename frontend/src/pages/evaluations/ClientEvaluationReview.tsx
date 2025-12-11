import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation, EvaluationPhoto } from '../../types';
import { ArrowLeft, Star, Send, CheckCircle, XCircle, Calendar, MessageSquare, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { toast } from 'react-toastify';

export const ClientEvaluationReview = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingPhoto, setReviewingPhoto] = useState<EvaluationPhoto | null>(null);
  const [reviewForm, setReviewForm] = useState({ review: '', rating: 3 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchEvaluation();
  }, [id]);

  const fetchEvaluation = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await evaluationsApi.getById(id);
      if (response.status && response.data) {
        setEvaluation(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch evaluation:', error);
      toast.error(error?.response?.data?.error || 'Failed to load evaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = (photo: EvaluationPhoto) => {
    setReviewingPhoto(photo);
    setReviewForm({
      review: photo.review || '',
      rating: photo.rating || 3,
    });
  };

  const handleCancelReview = () => {
    setReviewingPhoto(null);
    setReviewForm({ review: '', rating: 3 });
  };

  const handleSubmitReview = async () => {
    if (!reviewingPhoto) return;

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast.error('Rating must be between 1 and 5 stars');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await evaluationsApi.reviewPhoto(
        reviewingPhoto.id,
        reviewForm.review,
        reviewForm.rating
      );

      if (response.status) {
        toast.success('Review submitted successfully');
        setReviewingPhoto(null);
        setReviewForm({ review: '', rating: 3 });
        fetchEvaluation();
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      toast.error(error?.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (!evaluation) {
    return (
      <Card className="text-center py-16">
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">Evaluation Not Found</h3>
        <Button onClick={() => navigate('/evaluations')}>Back to Evaluations</Button>
      </Card>
    );
  }

  const photos = evaluation.photos || [];
  const reviewedPhotos = photos.filter(p => p.rating !== null && p.rating !== undefined);
  const pendingPhotos = photos.filter(p => !p.rating);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/evaluations')}
          leftIcon={<ArrowLeft className="w-5 h-5" />}
        >
          Back
        </Button>
      </div>

      {/* Evaluation Overview */}
      <Card variant="elevated">
        <div className="border-b border-secondary-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">{evaluation.event?.title || 'Event'}</h2>
          <p className="text-sm text-secondary-600">Vendor: {evaluation.vendor?.vendor_name || 'N/A'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Overall Rating</label>
            {evaluation.overall_rating ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-warning-100 to-orange-100 rounded-xl">
                  <Star className="w-5 h-5 text-warning-600 fill-warning-600" />
                  <span className="text-2xl font-bold text-warning-900">
                    {evaluation.overall_rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-warning-700">/5</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-secondary-400">
                <Star className="w-5 h-5" />
                <span>Not rated yet</span>
              </div>
            )}
          </div>

          {/* Review Progress */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Review Progress</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-secondary-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-success-500 to-success-600 h-full transition-all duration-500"
                  style={{ width: photos.length > 0 ? `${(reviewedPhotos.length / photos.length) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm font-semibold text-secondary-900">
                {reviewedPhotos.length}/{photos.length}
              </span>
            </div>
          </div>

          {/* Created Date */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Created</label>
            <div className="flex items-center gap-2 text-secondary-900">
              <Calendar className="w-4 h-4 text-secondary-400" />
              <span className="text-sm">{formatDate(evaluation.created_at)}</span>
            </div>
          </div>

          {/* Vendor Comments */}
          {evaluation.comments && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Vendor Comments
              </label>
              <p className="text-secondary-900 bg-secondary-50 rounded-xl p-4 whitespace-pre-wrap">
                {evaluation.comments}
              </p>
            </div>
          )}

          {/* Google Drive Link */}
          {evaluation.google_drive_url && (
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Additional Photos (Google Drive)
              </label>
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-200">
                <p className="text-sm text-secondary-600 mb-3">
                  The vendor has shared additional photos via Google Drive link
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.open(evaluation.google_drive_url, '_blank')}
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  View Additional Photos
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Photos to Review */}
      {pendingPhotos.length > 0 && (
        <Card variant="elevated">
          <div className="border-b border-secondary-200 pb-4 mb-6">
            <h3 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-warning-600" />
              Pending Reviews ({pendingPhotos.length})
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Photos awaiting your review and rating</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingPhotos.map((photo) => (
              <Card key={photo.id} variant="bordered" className="overflow-hidden group">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'Event photo'}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 space-y-3">
                  {photo.caption && (
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Caption:</p>
                      <p className="text-sm text-secondary-700">{photo.caption}</p>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleStartReview(photo)}
                    leftIcon={<Star className="w-4 h-4" />}
                  >
                    Review & Rate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Reviewed Photos */}
      {reviewedPhotos.length > 0 && (
        <Card variant="elevated">
          <div className="border-b border-secondary-200 pb-4 mb-6">
            <h3 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success-600" />
              Reviewed ({reviewedPhotos.length})
            </h3>
            <p className="text-sm text-secondary-600 mt-1">Photos you've already reviewed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviewedPhotos.map((photo) => (
              <Card key={photo.id} variant="bordered" className="overflow-hidden group">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'Event photo'}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 space-y-3">
                  {photo.caption && (
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Caption:</p>
                      <p className="text-sm text-secondary-700">{photo.caption}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-secondary-100">
                    <Star className="w-5 h-5 text-warning-500 fill-warning-500" />
                    <span className="text-xl font-bold text-warning-900">{photo.rating?.toFixed(1)}</span>
                    <span className="text-xs text-secondary-500">/5</span>
                  </div>
                  {photo.review && (
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <p className="text-xs text-secondary-500 mb-1">Your Review:</p>
                      <p className="text-sm text-secondary-700">{photo.review}</p>
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleStartReview(photo)}
                  >
                    Edit Review
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Review Modal */}
      {reviewingPhoto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card variant="elevated" className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-secondary-200 pb-4 mb-6">
              <h3 className="text-xl font-bold text-secondary-900">Review & Rate Photo</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo Preview */}
              <div>
                <img
                  src={reviewingPhoto.photo_url}
                  alt={reviewingPhoto.caption || 'Event photo'}
                  className="w-full rounded-xl shadow-lg"
                />
                {reviewingPhoto.caption && (
                  <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-500 mb-1">Vendor Caption:</p>
                    <p className="text-sm text-secondary-700">{reviewingPhoto.caption}</p>
                  </div>
                )}
              </div>

              {/* Review Form */}
              <div className="space-y-6">
                {/* Rating Slider */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-900 mb-3">
                    Rating: {reviewForm.rating}/5 stars
                  </label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                      className="w-full h-3 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-warning-500"
                    />
                    <div className="flex justify-between text-xs text-secondary-500">
                      <span>Poor (1★)</span>
                      <span>Average (3★)</span>
                      <span>Excellent (5★)</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-warning-100 to-orange-100 rounded-xl">
                      {[...Array(reviewForm.rating)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-warning-600 fill-warning-600" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-semibold text-secondary-900 mb-2">
                    Review
                  </label>
                  <textarea
                    value={reviewForm.review}
                    onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                    placeholder="Write your review... (optional)"
                    rows={6}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    {reviewForm.review.length}/1000 characters
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-secondary-200">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={handleCancelReview}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleSubmitReview}
                    isLoading={isSubmitting}
                    leftIcon={!isSubmitting && <Send className="w-4 h-4" />}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <Card className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-100 rounded-2xl mb-4">
            <Star className="w-10 h-10 text-secondary-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Photos to Review</h3>
          <p className="text-secondary-600">The vendor hasn't uploaded any photos yet</p>
        </Card>
      )}
    </div>
  );
};
