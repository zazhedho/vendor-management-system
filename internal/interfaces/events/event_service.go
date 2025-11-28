package interfaceevents

import (
	domainevents "vendor-management-system/internal/domain/events"
	"vendor-management-system/internal/dto"
	"vendor-management-system/pkg/filter"
)

type ServiceEventInterface interface {
	// Event operations
	CreateEvent(userId string, req dto.CreateEventRequest) (domainevents.Event, error)
	GetEventByID(id string) (domainevents.Event, error)
	GetAllEvents(params filter.BaseParams) ([]domainevents.Event, int64, error)
	UpdateEvent(id string, req dto.UpdateEventRequest) (domainevents.Event, error)
	DeleteEvent(id string) error

	// Submission operations
	SubmitPitch(eventId, vendorId string, req dto.SubmitPitchRequest) (domainevents.EventSubmission, error)
	GetSubmissionsByEventID(eventId string) ([]domainevents.EventSubmission, error)
	GetMySubmissions(vendorId string) ([]domainevents.EventSubmission, error)
	ScoreSubmission(submissionId string, req dto.ScoreSubmissionRequest) (domainevents.EventSubmission, error)
	ShortlistSubmission(submissionId string, isShortlisted bool) (domainevents.EventSubmission, error)
	SelectWinner(eventId, submissionId string) (domainevents.Event, error)
	GetEventResult(eventId, vendorId string) (map[string]interface{}, error)
	GetEventResultForAdmin(eventId string) (map[string]interface{}, error)
}
