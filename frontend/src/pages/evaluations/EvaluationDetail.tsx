import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation } from '../../types';
import { ArrowLeft, Edit, Star, MessageSquare, Image, Trash2 } from 'lucide-react';
import { Button, Card, Spinner, ConfirmModal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export const EvaluationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

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
      await evaluationsApi.deletePhoto(id, deletePhotoId);
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

  const canEdit = hasRole(['admin', 'client']);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/evaluations')} leftIcon={<ArrowLeft size={16} />}>
          Back
        </Button>
        {canEdit && (
          <Button onClick={() => navigate(`/evaluations/${id}/edit`)} leftIcon={<Edit size={16} />}>
            Edit Evaluation
          </Button>
        )}
      </div>

      {/* Main Card */}
      <Card>
        <div className="border-b border-secondary-200 pb-4 mb-4">
          <h2 className="text-2xl font-bold text-secondary-900">Evaluation Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event ID */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Event ID</label>
            <p className="text-secondary-900">{evaluation.event_id}</p>
          </div>

          {/* Vendor ID */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Vendor ID</label>
            <p className="text-secondary-900">{evaluation.vendor_id}</p>
          </div>

          {/* Evaluator */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Evaluator</label>
            <p className="text-secondary-900">{evaluation.evaluator_user_id}</p>
          </div>

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Overall Rating</label>
            <div className="flex items-center gap-2">
              <Star className="text-yellow-500" fill="currentColor" size={20} />
              <span className="text-lg font-semibold text-secondary-900">
                {evaluation.overall_rating ? evaluation.overall_rating.toFixed(1) : 'N/A'}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluation.photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <img
                  src={photo.photo_url}
                  alt="Evaluation"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 space-y-2">
                  {photo.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-500" fill="currentColor" size={16} />
                      <span className="font-medium">{photo.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {photo.review && (
                    <p className="text-sm text-secondary-700">{photo.review}</p>
                  )}
                  <div className="text-xs text-secondary-500">
                    {formatDate(photo.created_at)}
                  </div>
                  {canEdit && (
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={14} />}
                      onClick={() => handleDeletePhotoClick(photo.id)}
                      className="w-full"
                    >
                      Delete Photo
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>
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
