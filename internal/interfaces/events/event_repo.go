package interfaceevents

import (
	domainevents "vendor-management-system/internal/domain/events"
	"vendor-management-system/pkg/filter"
)

type RepoEventInterface interface {
	// Event operations
	CreateEvent(m domainevents.Event) error
	GetEventByID(id string) (domainevents.Event, error)
	GetAllEvents(params filter.BaseParams) ([]domainevents.Event, int64, error)
	UpdateEvent(m domainevents.Event) error
	DeleteEvent(id string) error

	// Event file operations
	CreateEventFile(m domainevents.EventFile) error
	GetEventFileByID(id string) (domainevents.EventFile, error)
	DeleteEventFile(id string) error

	// Submission operations
	CreateSubmission(m domainevents.EventSubmission) error
	GetSubmissionByID(id string) (domainevents.EventSubmission, error)
	GetSubmissionByEventAndVendor(eventId, vendorId string) (domainevents.EventSubmission, error)
	GetSubmissionsByEventID(eventId string) ([]domainevents.EventSubmission, error)
	GetAllSubmissions(params filter.BaseParams) ([]domainevents.EventSubmission, int64, error)
	GetSubmissionsByVendorID(vendorId string) ([]domainevents.EventSubmission, error)
	UpdateSubmission(m domainevents.EventSubmission) error
	DeleteSubmission(id string) error

	// Submission file operations
	CreateSubmissionFile(m domainevents.EventSubmissionFile) error
	GetSubmissionFileByID(id string) (domainevents.EventSubmissionFile, error)
	CountSubmissionFilesBySubmissionID(submissionId string) (int64, error)
	DeleteSubmissionFile(id string) error
}
