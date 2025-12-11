import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation, EvaluationPhoto } from '../../types';
import {
  ArrowLeft, Star, MessageSquare, Image, Trash2, X, Send,
  Calendar, User, Building2, Award, CheckCircle, Clock, Camera
} from 'lucide-react';
import { Button, Card, Spinner, ConfirmModal, Badge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export const EvaluationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const { handleSilentError } = useErrorHandler();
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
      handleSilentError(error, `Fetching evaluation ID ${id}`);
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
      handleSilentError(error, `Deleting photo ${deletePhotoId}`);
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
      handleSilentError(error, `Submitting review for photo ${reviewingPhoto?.id}`);
      toast.error(error?.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPhotoStats = (photos: EvaluationPhoto[] = []) => {
    const total = photos.length;
    const reviewed = photos.filter(p => p.rating != null).length;
    const pending = total - reviewed;
    const avgRating = reviewed > 0 
      ? photos.filter(p => p.rating).reduce((sum, p) => sum + (p.rating || 0), 0) / reviewed 
      : 0;
    return { total, reviewed, pending, avgRating };
  };

  const getStatus = (evaluation: Evaluation) => {
    const photos = evaluation.photos || [];
    const { total, reviewed } = getPhotoStats(photos);
    
    if (total === 0) return { label: 'Awaiting Photos', variant: 'secondary' as const, icon: Camera };
    if (total < 5) return { label: 'Uploading', variant: 'info' as const, icon: Camera };
    if (reviewed === total) return { label: 'Completed', variant: 'success' as const, icon: CheckCircle };
    if (reviewed > 0) return { label: 'In Review', variant: 'warning' as const, icon: Clock };
    return { label: 'Pending Review', variant: 'warning' as const, icon: Clock };
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

  const photoStats = getPhotoStats(evaluation.photos);
  const status = getStatus(evaluation);
  const StatusIcon = status.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/evaluations')} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
      </div>

      {/* Hero Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-8 h-8" />
                <h1 className="text-2xl font-bold">Evaluation</h1>
              </div>
              <p className="text-primary-100 text-lg">
                {evaluation.event?.title || 'Event'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant={status.variant} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <StatusIcon size={14} />
                {status.label}
              </Badge>
              {evaluation.overall_rating && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                  <span className="text-2xl font-bold">{evaluation.overall_rating.toFixed(1)}</span>
                  <span className="text-primary-200">/5</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-secondary-200 bg-secondary-50">
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-bold text-secondary-900">{photoStats.total}</p>
            <p className="text-sm text-secondary-500">Photos</p>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-bold text-success-600">{photoStats.reviewed}</p>
            <p className="text-sm text-secondary-500">Reviewed</p>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="text-2xl font-bold text-warning-600">{photoStats.pending}</p>
            <p className="text-sm text-secondary-500">Pending</p>
          </div>
          <div className="px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <p className="text-2xl font-bold text-secondary-900">
                {photoStats.avgRating > 0 ? photoStats.avgRating.toFixed(1) : '-'}
              </p>
            </div>
            <p className="text-sm text-secondary-500">Avg Rating</p>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Vendor Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Vendor</p>
              <p className="text-sm font-semibold text-secondary-900 truncate mt-1">
                {evaluation.vendor?.profile?.vendor_name || 'N/A'}
              </p>
              {evaluation.vendor?.vendor_code && (
                <p className="text-xs text-secondary-500 font-mono mt-0.5">
                  {evaluation.vendor.vendor_code}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Evaluator Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-info-100 flex items-center justify-center">
              <User className="w-5 h-5 text-info-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Evaluator</p>
              <p className="text-sm font-semibold text-secondary-900 truncate mt-1">
                {evaluation.evaluator?.name || 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        {/* Date Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-success-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">Created</p>
              <p className="text-sm font-semibold text-secondary-900 mt-1">
                {formatDate(evaluation.created_at)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Comments Card */}
      {evaluation.comments && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-secondary-400" />
            <h3 className="font-semibold text-secondary-900">Comments</h3>
          </div>
          <p className="text-secondary-700 whitespace-pre-wrap bg-secondary-50 rounded-lg p-4">
            {evaluation.comments}
          </p>
        </Card>
      )}

      {/* Photos Section */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary-200 bg-secondary-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Image className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900">
                  Evaluation Photos
                </h3>
                <p className="text-sm text-secondary-500">
                  {photoStats.total}/5 photos uploaded
                </p>
              </div>
            </div>
            {canReviewPhoto && photoStats.pending > 0 && (
              <Badge variant="warning">
                {photoStats.pending} pending review
              </Badge>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-2 bg-secondary-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  photoStats.total === 5 ? 'bg-success-500' : 'bg-primary-500'
                }`}
                style={{ width: `${(photoStats.total / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {evaluation.photos && evaluation.photos.length > 0 ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluation.photos.map((photo, index) => (
              <div 
                key={photo.id} 
                className={`group relative rounded-xl overflow-hidden border-2 transition-all ${
                  photo.rating 
                    ? 'border-success-200 bg-success-50/30' 
                    : 'border-secondary-200 hover:border-primary-300'
                }`}
              >
                {/* Photo */}
                <div className="relative aspect-video">
                  <img
                    src={photo.photo_url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {photo.rating ? (
                      <div className="flex items-center gap-1 bg-success-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        <CheckCircle size={12} />
                        Reviewed
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-warning-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        <Clock size={12} />
                        Pending
                      </div>
                    )}
                  </div>

                  {/* Photo Number */}
                  <div className="absolute top-2 left-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* Rating Overlay */}
                  {photo.rating && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= photo.rating!
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-white/30'
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Caption */}
                  {photo.caption && (
                    <p className="text-sm text-secondary-600 italic line-clamp-2">
                      "{photo.caption}"
                    </p>
                  )}

                  {/* Rating Display */}
                  {photo.rating ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-secondary-900">
                          {photo.rating.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-secondary-400">
                      <Star size={16} />
                      <span className="text-sm">Awaiting review</span>
                    </div>
                  )}

                  {/* Review */}
                  {photo.review && (
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <p className="text-xs text-secondary-500 mb-1 font-medium">Review</p>
                      <p className="text-sm text-secondary-700 line-clamp-3">{photo.review}</p>
                    </div>
                  )}

                  {/* Upload Date */}
                  <p className="text-xs text-secondary-400">
                    Uploaded {formatDate(photo.created_at)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {canReviewPhoto && (
                      <Button
                        variant={photo.rating ? 'secondary' : 'primary'}
                        size="sm"
                        leftIcon={<Star size={14} />}
                        onClick={() => handleStartReview(photo)}
                        className="flex-1"
                      >
                        {photo.rating ? 'Edit' : 'Review'}
                      </Button>
                    )}
                    {canDeletePhoto && (
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => handleDeletePhotoClick(photo.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Camera className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-600 font-medium">No photos uploaded yet</p>
            <p className="text-sm text-secondary-400 mt-1">
              The vendor will upload photos showcasing their work
            </p>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      {reviewingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="relative">
              <img
                src={reviewingPhoto.photo_url}
                alt="Review"
                className="w-full h-56 object-cover"
              />
              <button
                onClick={() => setReviewingPhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X size={18} />
              </button>
              {reviewingPhoto.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm italic">"{reviewingPhoto.caption}"</p>
                </div>
              )}
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-1">Review Photo</h3>
                <p className="text-sm text-secondary-500">Rate this photo and leave your feedback</p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-3">
                  Rating
                </label>
                <div className="flex items-center justify-center gap-2 bg-secondary-50 rounded-xl p-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="focus:outline-none transform transition-transform hover:scale-110"
                    >
                      <Star
                        size={36}
                        className={`transition-colors ${
                          star <= reviewForm.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-secondary-300 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-4 text-2xl font-bold text-secondary-700">
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
                  placeholder="Share your thoughts about this photo..."
                  rows={3}
                  className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t bg-secondary-50">
              <Button
                variant="secondary"
                onClick={() => setReviewingPhoto(null)}
                disabled={isSubmittingReview}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitReview}
                isLoading={isSubmittingReview}
                leftIcon={<Send size={16} />}
                className="flex-1"
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
        message="Are you sure you want to delete this photo? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingPhoto}
        onConfirm={handleDeletePhotoConfirm}
        onCancel={() => setDeletePhotoId(null)}
      />
    </div>
  );
};
