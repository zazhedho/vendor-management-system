import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation } from '../../types';
import { ArrowLeft, Upload, Image as ImageIcon, Trash2, Star, X } from 'lucide-react';
import { Button, Card, Input, Spinner, ConfirmModal } from '../../components/ui';
import { toast } from 'react-toastify';

export const VendorPhotoUpload: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhotos, setPendingPhotos] = useState<{ file: File; caption: string; preview: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

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
    } catch (error) {
      console.error('Failed to fetch evaluation:', error);
      toast.error('Failed to load evaluation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentCount = (evaluation?.photos?.length || 0) + pendingPhotos.length;

    if (currentCount + files.length > 5) {
      toast.error(`You can only upload ${5 - currentCount} more photo(s)`);
      return;
    }

    const newPhotos = files.map(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return null;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 2MB size limit`);
        return null;
      }

      return {
        file,
        caption: '',
        preview: URL.createObjectURL(file),
      };
    }).filter(Boolean) as typeof pendingPhotos;

    setPendingPhotos([...pendingPhotos, ...newPhotos]);
    e.target.value = '';
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...pendingPhotos];
    updated[index].caption = caption;
    setPendingPhotos(updated);
  };

  const removePendingPhoto = (index: number) => {
    const updated = [...pendingPhotos];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    setPendingPhotos(updated);
  };

  const handleUploadPhotos = async () => {
    if (!id || pendingPhotos.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (const photo of pendingPhotos) {
      try {
        const response = await evaluationsApi.uploadPhoto(id, photo.file, photo.caption);
        if (response.status) {
          successCount++;
          URL.revokeObjectURL(photo.preview);
        }
      } catch (error: any) {
        console.error('Failed to upload photo:', error);
        toast.error(error?.response?.data?.error || `Failed to upload ${photo.file.name}`);
      }
    }

    setPendingPhotos([]);
    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} photo(s) uploaded successfully`);
      fetchEvaluation();
    }
  };

  const handleDeletePhoto = async () => {
    if (!deletePhotoId) return;
    setIsDeletingPhoto(true);
    try {
      const response = await evaluationsApi.deletePhoto(deletePhotoId);
      if (response.status) {
        toast.success('Photo deleted successfully');
        fetchEvaluation();
      }
    } catch (error: any) {
      console.error('Failed to delete photo:', error);
      toast.error(error?.response?.data?.error || 'Failed to delete photo');
    } finally {
      setIsDeletingPhoto(false);
      setDeletePhotoId(null);
    }
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

  const uploadedCount = evaluation.photos?.length || 0;
  const canUploadMore = uploadedCount + pendingPhotos.length < 5;
  const remainingSlots = 5 - uploadedCount - pendingPhotos.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/evaluations')} leftIcon={<ArrowLeft size={16} />}>
          Back to Evaluations
        </Button>
      </div>

      {/* Event Info */}
      <Card>
        <h2 className="text-xl font-bold text-secondary-900 mb-2">
          {evaluation.event?.title || 'Event Evaluation'}
        </h2>
        <p className="text-secondary-600">
          Upload photos showcasing your work for this event. The client will review and rate each photo.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ImageIcon size={18} className="text-secondary-400" />
            <span className="text-sm font-medium">{uploadedCount}/5 photos uploaded</span>
          </div>
          {evaluation.overall_rating && (
            <div className="flex items-center gap-1">
              <Star size={18} className="text-warning-500 fill-warning-500" />
              <span className="text-sm font-medium">{evaluation.overall_rating.toFixed(1)} overall rating</span>
            </div>
          )}
        </div>
      </Card>

      {/* Uploaded Photos */}
      {uploadedCount > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Uploaded Photos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluation.photos?.map((photo) => (
              <div key={photo.id} className="relative group border rounded-lg overflow-hidden">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'Event photo'}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => setDeletePhotoId(photo.id)}
                  className="absolute top-2 right-2 p-1.5 bg-danger-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
                <div className="p-3 bg-white">
                  {photo.caption && (
                    <p className="text-sm text-secondary-700 mb-2">{photo.caption}</p>
                  )}
                  {photo.rating ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-warning-500 fill-warning-500" />
                        <span className="text-sm font-medium">{photo.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-success-600">Reviewed</span>
                    </div>
                  ) : (
                    <span className="text-xs text-secondary-500">Awaiting review</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upload Section */}
      <Card>
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          {uploadedCount === 0 ? 'Upload Photos' : 'Add More Photos'}
        </h3>

        {canUploadMore ? (
          <>
            <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center mb-4">
              <ImageIcon size={48} className="mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-600 mb-2">
                Drag and drop photos here, or click to select
              </p>
              <p className="text-sm text-secondary-500 mb-4">
                You can upload {remainingSlots} more photo(s). Max 2MB per image.
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors">
                <Upload size={16} />
                Select Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Pending Photos */}
            {pendingPhotos.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-secondary-900">Photos to Upload ({pendingPhotos.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingPhotos.map((photo, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="relative">
                        <img
                          src={photo.preview}
                          alt="Preview"
                          className="w-full h-40 object-cover"
                        />
                        <button
                          onClick={() => removePendingPhoto(index)}
                          className="absolute top-2 right-2 p-1.5 bg-secondary-900/70 text-white rounded-full hover:bg-danger-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="p-3">
                        <Input
                          placeholder="Add a caption (optional)"
                          value={photo.caption}
                          onChange={(e) => updateCaption(index, e.target.value)}
                          maxLength={500}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      pendingPhotos.forEach(p => URL.revokeObjectURL(p.preview));
                      setPendingPhotos([]);
                    }}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleUploadPhotos}
                    isLoading={isUploading}
                    leftIcon={!isUploading && <Upload size={16} />}
                  >
                    Upload {pendingPhotos.length} Photo(s)
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 bg-secondary-50 rounded-lg">
            <ImageIcon size={48} className="mx-auto text-secondary-400 mb-4" />
            <p className="text-secondary-600">
              You've uploaded the maximum of 5 photos for this evaluation.
            </p>
          </div>
        )}
      </Card>

      <ConfirmModal
        show={!!deletePhotoId}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingPhoto}
        onConfirm={handleDeletePhoto}
        onCancel={() => setDeletePhotoId(null)}
      />
    </div>
  );
};
