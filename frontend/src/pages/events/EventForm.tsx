import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { toast } from 'react-toastify';
import { Save, X, Upload, FileText, Trash2, Image, File, Calendar } from 'lucide-react';
import { EventFile } from '../../types';
import { Button, Input, Card, Spinner } from '../../components/ui';

export const EventForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    start_date: '',
    end_date: '',
    terms_file_path: '',
    status: 'draft',
  });
  const [files, setFiles] = useState<EventFile[]>([]);
  const [newFiles, setNewFiles] = useState<{ file: File; type: string; caption: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      console.error('Failed to fetch event:', error);
      toast.error('Failed to load event data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

      setNewFiles([...newFiles, { file, type: fileType, caption: '' }]);
      e.target.value = '';
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleDeleteExistingFile = async (fileId: string) => {
    if (!id || !window.confirm('Delete this file?')) return;

    try {
      const response = await eventsApi.deleteFile(id, fileId);
      if (response.status) {
        setFiles(files.filter(f => f.id !== fileId));
        toast.success('File deleted');
      }
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updated = [...newFiles];
    updated[index].caption = caption;
    setNewFiles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          } catch (e) { console.error(e); }
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
            <Input
              label="Event Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Annual Tech Conference 2025"
              required
              minLength={3}
              maxLength={255}
            />

            <Input
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g., Catering, Decoration"
              maxLength={100}
            />

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-secondary-200 bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none min-h-32"
                placeholder="Describe the event requirements..."
                rows={4}
              />
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

          {/* Existing Files */}
          {files.length > 0 && (
            <div className="mb-6 space-y-3">
              <p className="text-sm font-medium text-secondary-500 uppercase tracking-wider">Uploaded Files</p>
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{file.file_type.toUpperCase()}</p>
                      <p className="text-xs text-secondary-500">{file.file_url.split('/').pop()}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExistingFile(file.id)}
                    className="text-danger-600 hover:bg-danger-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* New Files */}
          {newFiles.length > 0 && (
            <div className="mb-6 space-y-3">
              <p className="text-sm font-medium text-secondary-500 uppercase tracking-wider">Ready to Upload</p>
              {newFiles.map((file, idx) => (
                <div key={idx} className="p-3 bg-success-50 border border-success-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-success-600" />
                      <span className="text-sm font-medium text-success-900">{file.type.toUpperCase()} - {file.file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNewFile(idx)}
                      className="text-danger-600 hover:bg-danger-50"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                  <Input
                    placeholder="Add caption (optional)"
                    value={file.caption}
                    onChange={(e) => handleCaptionChange(idx, e.target.value)}
                    className="bg-white"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Upload Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['terms', 'image', 'document'].map((type) => (
              <label key={type} className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-secondary-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group">
                <Upload className="w-5 h-5 text-secondary-400 group-hover:text-primary-500 mb-1" />
                <span className="text-xs font-medium text-secondary-600 group-hover:text-primary-600 capitalize">{type}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileAdd(e, type)}
                />
              </label>
            ))}
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
    </div>
  );
};
