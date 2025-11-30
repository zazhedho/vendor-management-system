import React, { useState } from 'react';
import { eventsApi } from '../../api/events';
import { toast } from 'react-toastify';
import { X, Upload, FileText, Trash2, Send } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';

interface SubmitPitchModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitPitchModal: React.FC<SubmitPitchModalProps> = ({
  eventId,
  eventTitle,
  onClose,
  onSuccess,
}) => {
  const [proposalDetails, setProposalDetails] = useState('');
  const [files, setFiles] = useState<{ file: File; file_type: string; caption: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if max 1 file
      const maxFiles = 1;
      if (files.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} file allowed`);
        return;
      }

      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, DOC, DOCX, PPT, or PPTX files');
        return;
      }

      // Max 20MB
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 20MB');
        return;
      }

      setFiles([...files, { file, file_type: fileType, caption: '' }]);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updated = [...files];
    updated[index].caption = caption;
    setFiles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proposalDetails.trim()) {
      toast.error('Proposal details are required');
      return;
    }

    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('proposal_details', proposalDetails);

      // Add files
      files.forEach((fileData, index) => {
        formData.append('file', fileData.file);
        formData.append('file_type', fileData.file_type);
        if (fileData.caption) {
          formData.append('caption', fileData.caption);
        }
      });

      const response = await eventsApi.submitPitch(eventId, formData);

      if (response.status) {
        toast.success('Pitch submitted successfully!');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to submit pitch');
      }
    } catch (error: any) {
      console.error('Failed to submit pitch:', error);
      toast.error(error.message || 'Failed to submit pitch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-secondary-200 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Submit Your Pitch</h2>
            <p className="text-sm text-secondary-600 mt-1">{eventTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Proposal Details */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Proposal Details <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={proposalDetails}
              onChange={(e) => setProposalDetails(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Describe your proposal, approach, and why you're the best fit for this event..."
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
              <FileText size={16} />
              Upload Proposal File <span className="text-danger-500">*</span>
            </label>
            <div className="mb-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 rounded-lg transition-colors">
                <Upload size={16} />
                <span>Choose File</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => handleFileAdd(e, 'proposal')}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-secondary-500 mt-2">
                Max 1 file, 20MB. Accepted: PDF, DOC, DOCX, PPT, PPTX
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((fileData, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-secondary-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-secondary-900">
                          {fileData.file.name}
                        </p>
                        <p className="text-xs text-secondary-500">
                          Size: {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Input
                          type="text"
                          value={fileData.caption}
                          onChange={(e) => handleCaptionChange(index, e.target.value)}
                          placeholder="Add caption (optional)"
                          className="text-sm mt-2"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
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

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Send size={16} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Pitch'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
