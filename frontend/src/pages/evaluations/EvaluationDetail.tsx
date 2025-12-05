import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation, EvaluationPhoto } from '../../types';
import { ArrowLeft, Star, MessageSquare, Image, Trash2, X, Send } from 'lucide-react';
import { Button, Card, Spinner, ConfirmModal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const EvaluationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [reviewingPhoto, setReviewingPhoto] = useState<EvaluationPhoto | null>(null);
  const [reviewForm, setReviewForm] = useState({ review: '', rating: 3 });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const canReviewPhoto = hasPermission('evaluation', 'review_photo');
  const canDeletePhoto = hasPermission('evaluation', 'delete');

  useEffect(() => {
    if (id) fetchEvaluation(id);
  }, [id]);

  const fetchEvaluation = async (evaluationId: string) => {
    setIsLoading(true);
    try {
      const response = await evaluationsApi.getById(evaluationId);
      if (response.status && response.data) {
        setEvaluation(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch evaluation:', error);
      toast.error('Failed to load evaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhotoClick = (photoId: string) => {
    if (!id) return;
    setDeletePhotoId(photoId);
  };

  const handleDeletePhotoConfirm = async () => {
    if (!id || !deletePhotoId) return;
    setIsDeletingPhoto(true);
    try {
      await evaluationsApi.deletePhoto(deletePhotoId);
      toast.success('Photo deleted successfully');
      fetchEvaluation(id);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      toast.error('Failed to delete photo');
    } finally {
      setIsDeletingPhoto(false);
      setDeletePhotoId(null);
    }
  };

  const handleStartReview = (photo: EvaluationPhoto) => {
    setReviewingPhoto(photo);
    setReviewForm({
      review: photo.review || '',
      rating: photo.rating || 3,
    });
  };

  const handleSubmitReview = async () => {
    if (!reviewingPhoto || !id) return;

    if (reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast.error('Rating must be between 1 and 5');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await evaluationsApi.reviewPhoto(
        reviewingPhoto.id,
        reviewForm.review,
        reviewForm.rating
      );

      if (response.status) {
        toast.success('Review submitted successfully');
        setReviewingPhoto(null);
        fetchEvaluation(id);
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      toast.error(error?.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
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
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <Card className="text-center py-12">
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Evaluation not found</h3>
        <Button onClick={() => navigate('/evaluations')}>Back to Evaluations</Button>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/evaluations')} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
      </div>

      {/* Main Card */}
      <Card>
        <div className="border-b border-secondary-200 pb-4 mb-4">
          <h2 className="text-2xl font-bold text-secondary-900">Evaluation Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Event</label>
            <p className="text-secondary-900">{evaluation.event?.title || evaluation.event_id}</p>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Vendor</label>
            <p className="text-secondary-900">{evaluation.vendor?.profile?.vendor_name || evaluation.vendor_id}</p>
          </div>

          {/* Evaluator */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Evaluator</label>
            <p className="text-secondary-900">{evaluation.evaluator?.name || evaluation.evaluator_user_id}</p>
          </div>

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Overall Rating</label>
            <div className="flex items-center gap-2">
              <Star className="text-yellow-500" fill="currentColor" size={20} />
              <span className="text-lg font-semibold text-secondary-900">
                {evaluation.overall_rating ? evaluation.overall_rating.toFixed(1) : 'Not rated yet'}
              </span>
            </div>
          </div>

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Created At</label>
            <p className="text-secondary-900">{formatDate(evaluation.created_at)}</p>
          </div>

          {/* Updated At */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Updated At</label>
            <p className="text-secondary-900">{formatDate(evaluation.updated_at)}</p>
          </div>

          {/* Comments */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-1 flex items-center gap-2">
              <MessageSquare size={16} />
              Comments
            </label>
            <p className="text-secondary-900 whitespace-pre-wrap">
              {evaluation.comments || 'No comments'}
            </p>
          </div>
        </div>
      </Card>

      {/* Photos Section */}
      {evaluation.photos && evaluation.photos.length > 0 && (
        <Card>
          <div className="border-b border-secondary-200 pb-4 mb-4">
            <h3 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
              <Image size={20} />
              Evaluation Photos ({evaluation.photos.length})
            </h3>
            {canReviewPhoto && (
              <p className="text-sm text-secondary-600 mt-1">
                Click "Review & Rate" to rate each photo
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluation.photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <img
                  src={photo.photo_url}
                  alt="Evaluation"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 space-y-3">
                  {photo.caption && (
                    <p className="text-sm text-secondary-600 italic">"{photo.caption}"</p>
                  )}
                  {photo.rating ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="text-yellow-500" fill="currentColor" size={16} />
                        <span className="font-medium">{photo.rating.toFixed(1)}/5</span>
                      </div>
                      <span className="text-xs text-success-600">Reviewed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-secondary-400">
                      <Star size={16} />
                      <span className="text-sm">Not rated yet</span>
                    </div>
                  )}
                  {photo.review && (
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <p className="text-xs text-secondary-500 mb-1">Review:</p>
                      <p className="text-sm text-secondary-700">{photo.review}</p>
                    </div>
                  )}
                  <div className="text-xs text-secondary-500">
                    Uploaded: {formatDate(photo.created_at)}
                  </div>
                  <div className="flex gap-2">
                    {canReviewPhoto && (
                      <Button
                        variant={photo.rating ? 'secondary' : 'primary'}
                        size="sm"
                        leftIcon={<Star size={14} />}
                        onClick={() => handleStartReview(photo)}
                        className="flex-1"
                      >
                        {photo.rating ? 'Edit Review' : 'Review & Rate'}
                      </Button>
                    )}
                    {canDeletePhoto && (
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => handleDeletePhotoClick(photo.id)}
                        className={canReviewPhoto ? '' : 'flex-1'}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Review Modal */}
      {reviewingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-secondary-900">Review Photo</h3>
              <button
                onClick={() => setReviewingPhoto(null)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Photo Preview */}
              <img
                src={reviewingPhoto.photo_url}
                alt="Review"
                className="w-full h-48 object-cover rounded-lg"
              />

              {/* Caption */}
              {reviewingPhoto.caption && (
                <p className="text-sm text-secondary-600 italic text-center">
                  "{reviewingPhoto.caption}"
                </p>
              )}

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        size={32}
                        className={
                          star <= reviewForm.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-secondary-300'
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-lg font-semibold text-secondary-700">
                    {reviewForm.rating}/5
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Review (Optional)
                </label>
                <textarea
                  value={reviewForm.review}
                  onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                  placeholder="Write your review here..."
                  rows={3}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-secondary-50">
              <Button
                variant="secondary"
                onClick={() => setReviewingPhoto(null)}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitReview}
                isLoading={isSubmittingReview}
                leftIcon={<Send size={16} />}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={!!deletePhotoId}
        title="Delete Photo"
        message="Are you sure you want to delete this photo?"
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingPhoto}
        onConfirm={handleDeletePhotoConfirm}
        onCancel={() => setDeletePhotoId(null)}
      />
    </div>
  );
};
