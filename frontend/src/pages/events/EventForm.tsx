import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsApi } from '../../api/events';
import { toast } from 'react-toastify';
import { Save, X, Upload, FileText, Trash2, Image, File } from 'lucide-react';
import { EventFile } from '../../types';

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

      // Validate file type based on fileType
      const allowedTypes: Record<string, string[]> = {
        terms: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        image: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      };

      if (!allowedTypes[fileType]?.includes(file.type)) {
        toast.error(`Invalid file type for ${fileType}`);
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
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
    if (!id || !window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await eventsApi.deleteFile(id, fileId);
      if (response.status) {
        setFiles(files.filter(f => f.id !== fileId));
        toast.success('File deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
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
      // Prepare data according to backend DTO
      const submitData: any = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      };

      // Only include status in update
      if (isEditMode) {
        submitData.status = formData.status;
      }

      let eventId = id;

      // Create or Update event
      if (isEditMode && id) {
        if (formData.terms_file_path) {
          submitData.terms_file_path = formData.terms_file_path;
        }
        const response = await eventsApi.update(id, submitData);
        if (!response.status) {
          toast.error(response.message || 'Failed to update event');
          setIsLoading(false);
          return;
        }
      } else {
        const response = await eventsApi.create(submitData);
        if (!response.status) {
          toast.error(response.message || 'Failed to create event');
          setIsLoading(false);
          return;
        }
        eventId = response.data?.id;
      }

      // Upload new files if provided
      if (newFiles.length > 0 && eventId) {
        let uploadedCount = 0;
        let failedCount = 0;

        for (const fileData of newFiles) {
          try {
            const response = await eventsApi.uploadFile(
              eventId,
              fileData.file,
              fileData.type,
              fileData.caption
            );
            if (response.status) {
              uploadedCount++;
            } else {
              failedCount++;
            }
          } catch (uploadError) {
            console.error('Failed to upload file:', uploadError);
            failedCount++;
          }
        }

        if (uploadedCount > 0) {
          toast.success(`${uploadedCount} file(s) uploaded successfully`);
        }
        if (failedCount > 0) {
          toast.warning(`${failedCount} file(s) failed to upload`);
        }
      }

      toast.success(isEditMode ? 'Event updated successfully' : 'Event created successfully');
      navigate('/events');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save event';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditMode ? 'Update event information' : 'Fill in the details to create a new event'}
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="Enter event title (min 3 characters)"
              required
              minLength={3}
              maxLength={255}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 3 characters, maximum 255 characters</p>
          </div>

          <div>
            <label className="label">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Catering, Photography, Decoration"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">Maximum 100 characters</p>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input min-h-32"
              placeholder="Describe the event in detail..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="input"
                min={formData.start_date}
              />
            </div>
          </div>

          <div>
            <label className="label">Event Files</label>

            {/* Existing Files */}
            {files.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Current Files:</p>
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center flex-1">
                      {file.file_type === 'image' ? (
                        <Image size={20} className="text-blue-600 mr-2" />
                      ) : (
                        <FileText size={20} className="text-blue-600 mr-2" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-blue-700 font-medium">
                          {file.file_type.toUpperCase()} - {file.file_url.split('/').pop()}
                        </p>
                        {file.caption && (
                          <p className="text-xs text-blue-600">{file.caption}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingFile(file.id)}
                      className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Files to Upload */}
            {newFiles.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">New Files to Upload:</p>
                {newFiles.map((fileData, index) => (
                  <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center flex-1">
                        {fileData.type === 'image' ? (
                          <Image size={20} className="text-green-600 mr-2" />
                        ) : (
                          <FileText size={20} className="text-green-600 mr-2" />
                        )}
                        <span className="text-sm text-green-700 font-medium">
                          {fileData.type.toUpperCase()} - {fileData.file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(index)}
                        className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Add caption (optional)"
                      value={fileData.caption}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* File Upload Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex flex-col items-center justify-center h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <FileText className="w-6 h-6 mb-1 text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium">Terms Document</span>
                  <span className="text-xs text-gray-500">PDF, DOC, DOCX</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileAdd(e, 'terms')}
                  />
                </label>
              </div>

              <div>
                <label className="flex flex-col items-center justify-center h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <Image className="w-6 h-6 mb-1 text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium">Event Image</span>
                  <span className="text-xs text-gray-500">JPG, PNG, WEBP</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={(e) => handleFileAdd(e, 'image')}
                  />
                </label>
              </div>

              <div>
                <label className="flex flex-col items-center justify-center h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <File className="w-6 h-6 mb-1 text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium">Other Document</span>
                  <span className="text-xs text-gray-500">PDF, DOC, DOCX</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileAdd(e, 'document')}
                  />
                </label>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Upload terms and conditions, event images, and other supporting documents (MAX. 5MB per file)
            </p>
          </div>

          {isEditMode && (
            <div>
              <label className="label">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="mt-2 text-xs text-gray-600">
                <p className="font-medium mb-1">Status descriptions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Draft:</strong> Event is being prepared, not yet published</li>
                  <li><strong>Open:</strong> Event is published and accepting submissions</li>
                  <li><strong>Closed:</strong> Event is closed for submissions</li>
                  <li><strong>Completed:</strong> Event has finished and winner selected</li>
                  <li><strong>Cancelled:</strong> Event has been cancelled</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save size={20} />
              <span>{isLoading ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
