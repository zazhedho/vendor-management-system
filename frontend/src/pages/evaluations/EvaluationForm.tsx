import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { eventsApi } from '../../api/events';
import { vendorsApi } from '../../api/vendors';
import { toast } from 'react-toastify';
import { Save, X, Star, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button, Input, Card, Spinner } from '../../components/ui';
import { Event } from '../../types';

export const EvaluationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    event_id: '',
    vendor_id: '',
    evaluator_user_id: '',
    overall_rating: '',
    comments: '',
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [photoFiles, setPhotoFiles] = useState<{ file: File; review: string; rating: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchDropdownData();
    if (isEditMode && id) {
      fetchEvaluation(id);
    }
  }, [id, isEditMode]);

  const fetchDropdownData = async () => {
    setIsLoadingData(true);
    try {
      const [eventsRes, vendorsRes] = await Promise.all([
        eventsApi.getAll({ limit: 100 }),
        vendorsApi.getAll({ limit: 100 }),
      ]);

      if (eventsRes.status && eventsRes.data) {
        setEvents(eventsRes.data);
      }
      if (vendorsRes.status && vendorsRes.data) {
        setVendors(vendorsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchEvaluation = async (evaluationId: string) => {
    try {
      const response = await evaluationsApi.getById(evaluationId);
      if (response.status && response.data) {
        const evaluation = response.data;
        setFormData({
          event_id: evaluation.event_id || '',
          vendor_id: evaluation.vendor_id || '',
          evaluator_user_id: evaluation.evaluator_user_id || '',
          overall_rating: evaluation.overall_rating?.toString() || '',
          comments: evaluation.comments || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch evaluation:', error);
      toast.error('Failed to load evaluation data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      setPhotoFiles([...photoFiles, { file, review: '', rating: '' }]);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
  };

  const handlePhotoDataChange = (index: number, field: 'review' | 'rating', value: string) => {
    const updated = [...photoFiles];
    updated[index][field] = value;
    setPhotoFiles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event_id || !formData.vendor_id) {
      toast.error('Event and Vendor are required');
      return;
    }

    setIsLoading(true);

    try {
      const submitData: any = {
        event_id: formData.event_id,
        vendor_id: formData.vendor_id,
        evaluator_user_id: formData.evaluator_user_id || undefined,
        overall_rating: formData.overall_rating ? parseFloat(formData.overall_rating) : undefined,
        comments: formData.comments || undefined,
      };

      let evaluationId = id;

      if (isEditMode && id) {
        const response = await evaluationsApi.update(id, submitData);
        if (!response.status) throw new Error(response.message || 'Failed to update evaluation');
      } else {
        const response = await evaluationsApi.create(submitData);
        if (!response.status) throw new Error(response.message || 'Failed to create evaluation');
        evaluationId = response.data?.id;
      }

      // Upload photos if any
      if (photoFiles.length > 0 && evaluationId) {
        let uploadedCount = 0;
        for (const photoData of photoFiles) {
          try {
            const rating = photoData.rating ? parseFloat(photoData.rating) : undefined;
            const response = await evaluationsApi.uploadPhoto(
              evaluationId,
              photoData.file,
              photoData.review || undefined,
              rating
            );
            if (response.status) uploadedCount++;
          } catch (e) {
            console.error('Failed to upload photo:', e);
          }
        }
        if (uploadedCount > 0) toast.success(`${uploadedCount} photos uploaded`);
      }

      toast.success(isEditMode ? 'Evaluation updated successfully' : 'Evaluation created successfully');
      navigate('/evaluations');
    } catch (error: any) {
      console.error('Failed to save evaluation:', error);
      toast.error(error.message || 'Failed to save evaluation');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary-900">
          {isEditMode ? 'Edit Evaluation' : 'Create New Evaluation'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
            {/* Event Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Event <span className="text-danger-500">*</span>
              </label>
              <select
                name="event_id"
                value={formData.event_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor Selection */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Vendor <span className="text-danger-500">*</span>
              </label>
              <select
                name="vendor_id"
                value={formData.vendor_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor: any) => (
                  <option key={vendor.vendor?.id} value={vendor.vendor?.id}>
                    {vendor.profile?.vendor_name || vendor.vendor?.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                <Star size={16} className="text-yellow-500" />
                Overall Rating (0-5)
              </label>
              <Input
                type="number"
                name="overall_rating"
                value={formData.overall_rating}
                onChange={handleChange}
                min="0"
                max="5"
                step="0.1"
                placeholder="e.g., 4.5"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter evaluation comments..."
              />
            </div>

            {/* Photo Upload Section */}
            {!isEditMode && (
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                  <ImageIcon size={16} />
                  Add Photos
                </label>
                <div className="mb-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors">
                    <Upload size={16} />
                    <span>Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoAdd}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-secondary-500 mt-1">Max 2MB per image</p>
                </div>

                {photoFiles.length > 0 && (
                  <div className="space-y-3">
                    {photoFiles.map((photoData, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={URL.createObjectURL(photoData.file)}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1 space-y-2">
                            <Input
                              type="text"
                              value={photoData.review}
                              onChange={(e) => handlePhotoDataChange(index, 'review', e.target.value)}
                              placeholder="Review/Caption (optional)"
                            />
                            <Input
                              type="number"
                              value={photoData.rating}
                              onChange={(e) => handlePhotoDataChange(index, 'rating', e.target.value)}
                              placeholder="Rating (optional, 0-5)"
                              min="0"
                              max="5"
                              step="0.1"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemovePhoto(index)}
                            leftIcon={<Trash2 size={14} />}
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/evaluations')}
              leftIcon={<X size={16} />}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save size={16} />}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Update Evaluation' : 'Create Evaluation'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
