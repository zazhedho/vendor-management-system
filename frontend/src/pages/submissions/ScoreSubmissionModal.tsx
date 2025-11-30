import React, { useState } from 'react';
import { eventsApi } from '../../api/events';
import { toast } from 'react-toastify';
import { X, Star, Save } from 'lucide-react';
import { Button, Input, Card } from '../../components/ui';

interface ScoreSubmissionModalProps {
  submissionId: string;
  currentScore?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScoreSubmissionModal: React.FC<ScoreSubmissionModalProps> = ({
  submissionId,
  currentScore,
  onClose,
  onSuccess,
}) => {
  const [score, setScore] = useState(currentScore?.toString() || '');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const scoreValue = parseFloat(score);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      toast.error('Score must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await eventsApi.scoreSubmission(
        submissionId,
        scoreValue,
        comments || undefined
      );

      if (response.status) {
        toast.success('Score submitted successfully');
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message || 'Failed to submit score');
      }
    } catch (error: any) {
      console.error('Failed to submit score:', error);
      toast.error(error.message || 'Failed to submit score');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Star className="text-yellow-500" />
            Score Submission
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Score Input */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Score (0-100) <span className="text-danger-500">*</span>
            </label>
            <Input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              min="0"
              max="100"
              step="0.1"
              placeholder="Enter score"
              required
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add evaluation comments..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
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
              leftIcon={<Save size={16} />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Score'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
