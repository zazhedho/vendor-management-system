import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { Evaluation } from '../../types';
import { ArrowLeft, Upload, Image as ImageIcon, Trash2, Star, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { Button, Card, Input, ConfirmModal } from '../../components/ui';
import { toast } from 'react-toastify';

export const VendorEvaluationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingPhotos, setUploadingPhotos] = useState<{ file: File; caption: string; preview: string }[]>([]);
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

    if (evaluation && (evaluation.photos?.length || 0) + uploadingPhotos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed per evaluation');
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
    }).filter(Boolean) as typeof uploadingPhotos;

    setUploadingPhotos([...uploadingPhotos, ...newPhotos]);
    e.target.value = '';
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...uploadingPhotos];
    updated[index].caption = caption;
    setUploadingPhotos(updated);
  };

  const removeUploadingPhoto = (index: number) => {
    const updated = [...uploadingPhotos];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    setUploadingPhotos(updated);
  };

  const handleUploadPhotos = async () => {
    if (!id || uploadingPhotos.length === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (const photo of uploadingPhotos) {
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

    setUploadingPhotos([]);
    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`${successCount} photo(s) uploaded successfully`);
      fetchEvaluation();
    }
  };

  const handleDeletePhotoClick = (photoId: string) => {
    setDeletePhotoId(photoId);
  };

  const handleDeletePhotoConfirm = async () => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-100 rounded-2xl mb-4">
          <AlertCircle className="w-10 h-10 text-secondary-400" />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">Evaluation Not Found</h3>
        <p className="text-secondary-600 mb-6">The evaluation you're looking for doesn't exist</p>
        <Button onClick={() => navigate('/evaluations')}>Back to Evaluations</Button>
      </Card>
    );
  }

  const photosCount = evaluation.photos?.length || 0;
  const canUploadMore = photosCount + uploadingPhotos.length < 5;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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

      {/* Evaluation Info */}
      <Card variant="elevated">
        <div className="border-b border-secondary-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">{evaluation.event?.title || 'Event'}</h2>
          <p className="text-sm text-secondary-600">Evaluation Details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Created Date */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Created At</label>
            <div className="flex items-center gap-2 text-secondary-900">
              <Calendar className="w-4 h-4 text-secondary-400" />
              <span>{formatDate(evaluation.created_at)}</span>
            </div>
          </div>

          {/* Comments */}
          {evaluation.comments && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments
              </label>
              <p className="text-secondary-900 bg-secondary-50 rounded-xl p-4 whitespace-pre-wrap">
                {evaluation.comments}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Photo Upload Section */}
      <Card variant="elevated">
        <div className="border-b border-secondary-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Event Photos ({photosCount}/5)
              </h3>
              <p className="text-sm text-secondary-600 mt-1">Upload photos with captions to showcase your work</p>
            </div>
            {canUploadMore && (
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                <Upload className="w-4 h-4" />
                Add Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Uploaded Photos */}
        {evaluation.photos && evaluation.photos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {evaluation.photos.map((photo) => (
              <Card key={photo.id} variant="bordered" className="overflow-hidden group">
                <div className="relative">
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || 'Event photo'}
                    className="w-full h-56 object-cover"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={() => handleDeletePhotoClick(photo.id)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Delete
                  </Button>
                </div>
                <div className="p-4 space-y-3">
                  {photo.caption && (
                    <div>
                      <p className="text-sm text-secondary-700">{photo.caption}</p>
                    </div>
                  )}
                  {photo.rating ? (
                    <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                        <span className="text-lg font-bold text-warning-900">{photo.rating.toFixed(1)}</span>
                        <span className="text-xs text-secondary-500">/5</span>
                      </div>
                      {photo.review && (
                        <span className="text-xs text-secondary-500">Reviewed</span>
                      )}
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-secondary-100">
                      <span className="text-xs text-secondary-400">Awaiting client review</span>
                    </div>
                  )}
                  {photo.review && (
                    <div className="bg-secondary-50 rounded-lg p-3">
                      <p className="text-xs text-secondary-500 mb-1">Client Review:</p>
                      <p className="text-sm text-secondary-700">{photo.review}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Photos to Upload */}
        {uploadingPhotos.length > 0 && (
          <div className="space-y-4">
            <div className="border-t border-secondary-200 pt-6">
              <h4 className="text-sm font-semibold text-secondary-900 mb-4">Photos to Upload</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadingPhotos.map((photo, index) => (
                <Card key={index} variant="bordered">
                  <div className="relative">
                    <img
                      src={photo.preview}
                      alt="Preview"
                      className="w-full h-56 object-cover rounded-t-lg"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="absolute top-2 right-2 shadow-lg"
                      onClick={() => removeUploadingPhoto(index)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="p-4">
                    <Input
                      label="Caption (optional)"
                      value={photo.caption}
                      onChange={(e) => updateCaption(index, e.target.value)}
                      placeholder="Describe this photo..."
                      maxLength={500}
                    />
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <Button
                variant="secondary"
                onClick={() => {
                  uploadingPhotos.forEach(p => URL.revokeObjectURL(p.preview));
                  setUploadingPhotos([]);
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadPhotos}
                isLoading={isUploading}
                leftIcon={!isUploading && <Upload className="w-4 h-4" />}
              >
                {isUploading ? 'Uploading...' : `Upload ${uploadingPhotos.length} Photo(s)`}
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {photosCount === 0 && uploadingPhotos.length === 0 && (
          <div className="text-center py-12 bg-secondary-50 rounded-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-sm">
              <ImageIcon className="w-8 h-8 text-secondary-400" />
            </div>
            <h4 className="text-sm font-semibold text-secondary-900 mb-1">No Photos Yet</h4>
            <p className="text-sm text-secondary-600 mb-4">Upload photos to showcase your event work</p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
              <Upload className="w-4 h-4" />
              Upload Photos
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}
      </Card>

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
