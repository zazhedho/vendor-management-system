package interfaceevents

import (
	"context"
	"mime/multipart"

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

	// Event file operations
	UploadEventFile(ctx context.Context, eventId string, userId string, file *multipart.FileHeader, req dto.UploadEventFileRequest) (domainevents.EventFile, error)
	DeleteEventFile(ctx context.Context, fileId string) error

	// Submission operations
	SubmitPitch(eventId, vendorId string, req dto.SubmitPitchRequest) (domainevents.EventSubmission, error)
	SubmitPitchWithFile(ctx context.Context, eventId, vendorId string, req dto.SubmitPitchRequest, fileHeader *multipart.FileHeader, fileType, caption string) (domainevents.EventSubmission, error)
	GetSubmissionsByEventID(eventId string) ([]domainevents.EventSubmission, error)
	GetAllSubmissions(params filter.BaseParams) ([]map[string]interface{}, int64, error)
	GetMySubmissions(vendorId string) ([]domainevents.EventSubmission, error)
	ScoreSubmission(submissionId string, req dto.ScoreSubmissionRequest) (domainevents.EventSubmission, error)
	ShortlistSubmission(submissionId string, isShortlisted bool) (domainevents.EventSubmission, error)
	SelectWinner(eventId, submissionId string) (domainevents.Event, error)
	GetEventResult(eventId, vendorId string) (map[string]interface{}, error)
	GetEventResultForAdmin(eventId string) (map[string]interface{}, error)

	// Submission file operations
	UploadSubmissionFile(ctx context.Context, submissionId string, userId string, file *multipart.FileHeader, req dto.UploadSubmissionFileRequest) (domainevents.EventSubmissionFile, error)
	DeleteSubmissionFile(ctx context.Context, fileId string) error
}
