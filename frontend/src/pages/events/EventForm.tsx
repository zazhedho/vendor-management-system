import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { toast } from 'react-toastify';
import { Save, X, Upload, FileText, Trash2, Calendar } from 'lucide-react';
import { EventFile } from '../../types';
import { Button, Input, Card, ConfirmModal } from '../../components/ui';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export const EventForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { handleSilentError } = useErrorHandler();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    start_date: '',
    end_date: '',
    terms_file_path: '',
    status: 'draft',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<EventFile[]>([]);
  const [newFiles, setNewFiles] = useState<{ file: File; type: string; caption: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      fetchEvent(id);
    }
  }, [id, isEditMode]);

  const fetchEvent = async (eventId: string) => {
    try {
      const response = await eventsApi.getById(eventId);
      if (response.status && response.data) {
        const event = response.data;
        setFormData({
          title: event.title || '',
          description: event.description || '',
          category: event.category || '',
          start_date: event.start_date ? event.start_date.split('T')[0] : '',
          end_date: event.end_date ? event.end_date.split('T')[0] : '',
          terms_file_path: event.terms_file_path || '',
          status: event.status || 'draft',
        });
        if (event.files) {
          setFiles(event.files);
        }
      }
    } catch (error) {
      handleSilentError(error, `Fetching event ID ${id}`);
      toast.error('Failed to load event data');
    }
  };

  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {};
    
    switch (name) {
      case 'title':
        if (value.length < 3) errors.title = 'Title must be at least 3 characters';
        if (value.length > 100) errors.title = 'Title must not exceed 100 characters';
        break;
      case 'description':
        if (value.length > 255) errors.description = 'Description must not exceed 255 characters';
        break;
      case 'category':
        if (value.length > 100) errors.category = 'Category must not exceed 100 characters';
        break;
    }
    
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear existing error for this field
    const newErrors = { ...validationErrors };
    delete newErrors[name];
    
    // Validate and set new error if any
    const fieldErrors = validateField(name, value);
    if (fieldErrors[name]) {
      newErrors[name] = fieldErrors[name];
    }
    
    setValidationErrors(newErrors);
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes: Record<string, string[]> = {
        terms: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        image: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      };

      if (!allowedTypes[fileType]?.includes(file.type)) {
        toast.error(`Invalid file type for ${fileType}`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Prevent duplicate type: check both existing files and new uploads
      const hasExistingType = files.some((f) => f.file_type === fileType);
      const hasPendingType = newFiles.some((f) => f.type === fileType);
      if (hasExistingType || hasPendingType) {
        toast.error(`File type ${fileType.toUpperCase()} already uploaded. Delete it first to replace.`);
        e.target.value = '';
        return;
      }

      setNewFiles([...newFiles, { file, type: fileType, caption: '' }]);
      e.target.value = '';
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleDeleteExistingFile = (fileId: string) => {
    if (!id) return;
    setDeleteFileId(fileId);
  };

  const handleDeleteFileConfirm = async () => {
    if (!id || !deleteFileId) return;
    setIsDeletingFile(true);
    try {
      const response = await eventsApi.deleteFile(id, deleteFileId);
      if (response.status) {
        setFiles(files.filter(f => f.id !== deleteFileId));
        toast.success('File deleted');
      }
    } catch (error) {
      toast.error('Failed to delete file');
    } finally {
      setIsDeletingFile(false);
      setDeleteFileId(null);
    }
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updated = [...newFiles];
    updated[index].caption = caption;
    setNewFiles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const allErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key as keyof typeof formData]);
      Object.assign(allErrors, fieldErrors);
    });
    
    // Check required fields
    if (!formData.title.trim()) {
      allErrors.title = 'Title is required';
    }
    
    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      toast.error('Please fix the validation errors before submitting');
      return;
    }
    
    setIsLoading(true);

    try {
      const submitData: any = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };

      if (isEditMode) {
        submitData.status = formData.status;
      }

      let eventId = id;

      if (isEditMode && id) {
        if (formData.terms_file_path) submitData.terms_file_path = formData.terms_file_path;
        const response = await eventsApi.update(id, submitData);
        if (!response.status) throw new Error(response.message || 'Failed to update event');
      } else {
        const response = await eventsApi.create(submitData);
        if (!response.status) throw new Error(response.message || 'Failed to create event');
        eventId = response.data?.id;
      }

      if (newFiles.length > 0 && eventId) {
        let uploadedCount = 0;
        for (const fileData of newFiles) {
          try {
            const response = await eventsApi.uploadFile(eventId, fileData.file, fileData.type, fileData.caption);
            if (response.status) uploadedCount++;
          } catch (e) { handleSilentError(e, `Uploading file: ${fileData.type}`); }
        }
        if (uploadedCount > 0) toast.success(`${uploadedCount} files uploaded`);
      }

      toast.success(isEditMode ? 'Event updated' : 'Event created');
      navigate('/events');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p className="text-secondary-500 mt-2">
          {isEditMode ? 'Update event details and manage files' : 'Fill in the details to publish a new event'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="space-y-6">
            <div>
              <Input
                label="Event Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Annual Tech Conference 2025"
                required
                error={validationErrors.title}
              />
              <div className="flex justify-between text-xs text-secondary-500 mt-1">
                <span>Min 3 characters required</span>
                <span className={formData.title.length > 100 ? 'text-danger-500' : ''}>
                  {formData.title.length}/100
                </span>
              </div>
            </div>

            <div>
              <Input
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Catering, Decoration"
                error={validationErrors.category}
              />
              <div className="flex justify-end text-xs text-secondary-500 mt-1">
                <span className={formData.category.length > 100 ? 'text-danger-500' : ''}>
                  {formData.category.length}/100
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none min-h-32 ${
                  validationErrors.description 
                    ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/30' 
                    : 'border-secondary-200'
                }`}
                placeholder="Describe the event requirements..."
                rows={4}
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-danger-600">{validationErrors.description}</p>
              )}
              <div className="flex justify-end text-xs text-secondary-500 mt-1">
                <span className={formData.description.length > 255 ? 'text-danger-500' : ''}>
                  {formData.description.length}/255
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Start Date"
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                leftIcon={<Calendar size={16} />}
              />
              <Input
                label="End Date"
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date}
                leftIcon={<Calendar size={16} />}
              />
            </div>

            {isEditMode && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Event Files</h2>

          {/* File Slots (prevent duplicate type) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['terms', 'image', 'document'].map((type) => {
              const existing = files.find((f) => f.file_type === type);
              const pending = newFiles.find((f) => f.type === type);

              if (existing) {
                return (
                  <div key={type} className="flex flex-col p-3 border border-secondary-200 rounded-lg bg-secondary-50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText size={18} className="text-primary-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-secondary-900 capitalize truncate">{type}</p>
                          <p className="text-xs text-secondary-500 truncate">{existing.file_url.split('/').pop()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExistingFile(existing.id)}
                          className="text-danger-600 hover:bg-danger-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    {existing.caption && (
                      <p className="text-xs text-secondary-600 mt-2 break-words">Caption: {existing.caption}</p>
                    )}
                  </div>
                );
              }

              if (pending) {
                return (
                  <div key={type} className="flex flex-col p-3 border border-success-200 rounded-lg bg-success-50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText size={18} className="text-success-700 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-success-900 capitalize truncate">{type}</p>
                          <p className="text-xs text-success-700 truncate">{pending.file.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveNewFile(newFiles.findIndex((f) => f.type === type))}
                          className="text-danger-600 hover:bg-danger-50"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                    <Input
                      placeholder="Add caption (optional)"
                      value={pending.caption}
                      onChange={(e) => handleCaptionChange(newFiles.findIndex((f) => f.type === type), e.target.value)}
                      className="bg-white mt-2"
                    />
                  </div>
                );
              }

              return (
                <label key={type} className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-secondary-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group">
                  <Upload className="w-5 h-5 text-secondary-400 group-hover:text-primary-500 mb-1" />
                  <span className="text-xs font-medium text-secondary-600 group-hover:text-primary-600 capitalize">{type}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileAdd(e, type)}
                  />
                </label>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={() => navigate('/events')} type="button">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} leftIcon={<Save size={16} />}>
            {isEditMode ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>

      <ConfirmModal
        show={!!deleteFileId}
        title="Delete File"
        message="Are you sure you want to delete this file?"
        confirmText="Delete"
        variant="danger"
        isLoading={isDeletingFile}
        onConfirm={handleDeleteFileConfirm}
        onCancel={() => setDeleteFileId(null)}
      />
    </div>
  );
};
