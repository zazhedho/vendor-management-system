import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { evaluationsApi } from '../../api/evaluations';
import { eventsApi } from '../../api/events';
import { toast } from 'react-toastify';
import { Save, X, Award, Calendar, Trophy } from 'lucide-react';
import { Button, Card, Spinner, Badge } from '../../components/ui';
import { Event } from '../../types';

export const EvaluationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    event_id: '',
    comments: '',
  });
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchCompletedEvents();
    if (isEditMode && id) {
      fetchEvaluation(id);
    }
  }, [id, isEditMode]);

  const fetchCompletedEvents = async () => {
    setIsLoadingData(true);
    try {
      const response = await eventsApi.getAll({ limit: 100 });
      if (response.status && response.data) {
        // Filter only completed events with winners
        const completed = response.data.filter(
          (event) => event.status === 'completed' && event.winner_vendor_id
        );
        setCompletedEvents(completed);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
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
          comments: evaluation.comments || '',
        });
        if (evaluation.event) {
          setSelectedEvent(evaluation.event);
        }
      }
    } catch (error) {
      console.error('Failed to fetch evaluation:', error);
      toast.error('Failed to load evaluation data');
    }
  };

  const handleEventSelect = (eventId: string) => {
    setFormData({ ...formData, event_id: eventId });
    const event = completedEvents.find((e) => e.id === eventId);
    setSelectedEvent(event || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event_id) {
      toast.error('Please select an event');
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        event_id: formData.event_id,
        comments: formData.comments || undefined,
      };

      if (isEditMode && id) {
        const response = await evaluationsApi.update(id, { comments: formData.comments });
        if (!response.status) throw new Error(response.message || 'Failed to update evaluation');
        toast.success('Evaluation updated successfully');
      } else {
        const response = await evaluationsApi.create(submitData);
        if (!response.status) throw new Error(response.message || 'Failed to create evaluation');
        toast.success('Evaluation created successfully. Vendor can now upload photos.');
      }

      navigate('/evaluations');
    } catch (error: any) {
      console.error('Failed to save evaluation:', error);
      toast.error(error?.response?.data?.error || error.message || 'Failed to save evaluation');
    } finally {
      setIsLoading(false);
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

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditMode ? 'Edit Evaluation' : 'Create Evaluation'}
          </h1>
          <p className="text-secondary-600 mt-1">
            {isEditMode
              ? 'Update evaluation comments'
              : 'Create evaluation for a completed event with a winner vendor'}
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border border-info-200 bg-info-50">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-info-600 mt-0.5" />
          <div className="text-sm text-info-800">
            <p className="font-medium mb-1">How Evaluation Works:</p>
            <ol className="list-decimal list-inside space-y-1 text-info-700">
              <li>You (client) create an evaluation for a completed event</li>
              <li>The winner vendor uploads up to 5 photos of their work</li>
              <li>You review and rate each photo (1-5 stars)</li>
              <li>Overall rating is calculated from all photo ratings</li>
            </ol>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
            {/* Event Selection */}
            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Select Completed Event <span className="text-danger-500">*</span>
                </label>
                {completedEvents.length === 0 ? (
                  <div className="text-center py-8 bg-secondary-50 rounded-lg">
                    <Trophy className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                    <p className="text-secondary-600">No completed events with winners found</p>
                    <p className="text-sm text-secondary-500 mt-1">
                      Complete an event and select a winner first
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => handleEventSelect(event.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.event_id === event.id
                            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
                            : 'border-secondary-200 hover:border-primary-300 hover:bg-secondary-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-secondary-900">{event.title}</h3>
                            <div className="flex items-center gap-3 mt-2 text-sm text-secondary-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(event.end_date)}
                              </span>
                              <Badge variant="success" size="sm">Completed</Badge>
                            </div>
                            {event.winner_vendor && (
                              <div className="mt-2 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-warning-500" />
                                <span className="text-sm text-secondary-700">
                                  Winner: {event.winner_vendor.profile?.vendor_name || 'Vendor'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              formData.event_id === event.id
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-secondary-300'
                            }`}
                          >
                            {formData.event_id === event.id && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selected Event Info (Edit Mode) */}
            {isEditMode && selectedEvent && (
              <div className="p-4 bg-secondary-50 rounded-lg">
                <h3 className="font-semibold text-secondary-900">{selectedEvent.title}</h3>
                <p className="text-sm text-secondary-600 mt-1">
                  Event ID: {selectedEvent.id}
                </p>
              </div>
            )}

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add any comments or notes about this evaluation..."
              />
            </div>
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
              disabled={isLoading || (!isEditMode && completedEvents.length === 0)}
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Update' : 'Create Evaluation'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};
