package serviceevents

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"time"
	"vendor-management-system/pkg/storage"

	domainevents "vendor-management-system/internal/domain/events"
	"vendor-management-system/internal/dto"
	interfaceevents "vendor-management-system/internal/interfaces/events"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/utils"

	"gorm.io/gorm"
)

type ServiceEvent struct {
	EventRepo       interfaceevents.RepoEventInterface
	VendorRepo      interfacevendors.RepoVendorInterface
	StorageProvider storage.StorageProvider
}

func NewEventService(eventRepo interfaceevents.RepoEventInterface, vendorRepo interfacevendors.RepoVendorInterface, storageProvider storage.StorageProvider) *ServiceEvent {
	return &ServiceEvent{
		EventRepo:       eventRepo,
		VendorRepo:      vendorRepo,
		StorageProvider: storageProvider,
	}
}

func (s *ServiceEvent) CreateEvent(userId string, req dto.CreateEventRequest) (domainevents.Event, error) {
	var startDate, endDate *time.Time

	if req.StartDate != "" {
		t, err := time.Parse("2006-01-02", req.StartDate)
		if err != nil {
			return domainevents.Event{}, errors.New("invalid start_date format, use YYYY-MM-DD")
		}
		startDate = &t
	}

	if req.EndDate != "" {
		t, err := time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			return domainevents.Event{}, errors.New("invalid end_date format, use YYYY-MM-DD")
		}
		endDate = &t
	}

	now := time.Now()
	event := domainevents.Event{
		Id:          utils.CreateUUID(),
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		StartDate:   startDate,
		EndDate:     endDate,
		Status:      utils.EventDraft,
		CreatedAt:   now,
		CreatedBy:   userId,
		UpdatedAt:   now,
		UpdatedBy:   userId,
	}

	if err := s.EventRepo.CreateEvent(event); err != nil {
		return domainevents.Event{}, err
	}

	return event, nil
}

func (s *ServiceEvent) GetAllEvents(params filter.BaseParams) ([]domainevents.Event, int64, error) {
	events, total, err := s.EventRepo.GetAllEvents(params)
	if err != nil {
		return nil, 0, err
	}

	// Auto-update status for expired events
	now := time.Now()
	for i := range events {
		// If end_date passed and status is still open/pending, change to closed
		if events[i].EndDate.Before(now) && (events[i].Status == utils.EventOpen || events[i].Status == utils.EventPending) {
			events[i].Status = utils.EventClosed
			events[i].UpdatedAt = now
			_ = s.EventRepo.UpdateEvent(events[i])
		}
		// If has winner, change to completed
		if events[i].WinnerVendorID != nil && *events[i].WinnerVendorID != "" && events[i].Status != utils.EventCompleted && events[i].Status != utils.EventCancelled {
			events[i].Status = utils.EventCompleted
			events[i].UpdatedAt = now
			_ = s.EventRepo.UpdateEvent(events[i])
		}
	}

	return events, total, nil
}

func (s *ServiceEvent) GetEventByID(id string) (domainevents.Event, error) {
	event, err := s.EventRepo.GetEventByID(id)
	if err != nil {
		return domainevents.Event{}, err
	}

	// Auto-update status
	now := time.Now()
	// If end_date passed and status is still open/pending, change to closed
	if event.EndDate.Before(now) && (event.Status == utils.EventOpen || event.Status == utils.EventPending) {
		event.Status = utils.EventClosed
		event.UpdatedAt = now
		_ = s.EventRepo.UpdateEvent(event)
	}
	// If has winner, change to completed
	if event.WinnerVendorID != nil && *event.WinnerVendorID != "" && event.Status != utils.EventCompleted && event.Status != utils.EventCancelled {
		event.Status = utils.EventCompleted
		event.UpdatedAt = now
		_ = s.EventRepo.UpdateEvent(event)
	}

	return event, nil
}

func (s *ServiceEvent) UpdateEvent(id string, req dto.UpdateEventRequest) (domainevents.Event, error) {
	event, err := s.EventRepo.GetEventByID(id)
	if err != nil {
		return domainevents.Event{}, err
	}

	if req.Title != "" {
		event.Title = req.Title
	}
	if req.Description != "" {
		event.Description = req.Description
	}
	if req.Category != "" {
		event.Category = req.Category
	}
	if req.StartDate != "" {
		t, err := time.Parse("2006-01-02", req.StartDate)
		if err != nil {
			return domainevents.Event{}, errors.New("invalid start_date format, use YYYY-MM-DD")
		}
		event.StartDate = &t
	}
	if req.EndDate != "" {
		t, err := time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			return domainevents.Event{}, errors.New("invalid end_date format, use YYYY-MM-DD")
		}
		event.EndDate = &t
	}
	if req.Status != "" {
		event.Status = req.Status
	}

	event.UpdatedAt = time.Now()

	if err := s.EventRepo.UpdateEvent(event); err != nil {
		return domainevents.Event{}, err
	}

	return event, nil
}

func (s *ServiceEvent) DeleteEvent(id string) error {
	_, err := s.EventRepo.GetEventByID(id)
	if err != nil {
		return err
	}

	return s.EventRepo.DeleteEvent(id)
}

func (s *ServiceEvent) SubmitPitch(eventId, vendorId string, req dto.SubmitPitchRequest) (domainevents.EventSubmission, error) {
	event, err := s.EventRepo.GetEventByID(eventId)
	if err != nil {
		return domainevents.EventSubmission{}, err
	}

	if event.Status != utils.EventOpen {
		return domainevents.EventSubmission{}, errors.New("event is not open for submissions")
	}

	existing, err := s.EventRepo.GetSubmissionByEventAndVendor(eventId, vendorId)
	if err == nil && existing.Id != "" {
		return domainevents.EventSubmission{}, errors.New("you have already submitted a pitch for this event")
	}

	now := time.Now()
	submission := domainevents.EventSubmission{
		Id:              utils.CreateUUID(),
		EventID:         eventId,
		VendorID:        vendorId,
		ProposalDetails: req.ProposalDetails,
		IsShortlisted:   false,
		IsWinner:        false,
		CreatedAt:       now,
		CreatedBy:       vendorId,
		UpdatedAt:       now,
		UpdatedBy:       vendorId,
	}

	if err := s.EventRepo.CreateSubmission(submission); err != nil {
		return domainevents.EventSubmission{}, err
	}

	return submission, nil
}

func (s *ServiceEvent) SubmitPitchWithFile(ctx context.Context, eventId, vendorId string, req dto.SubmitPitchRequest, fileHeader *multipart.FileHeader, fileType, caption string) (domainevents.EventSubmission, error) {
	// First, create or update the submission
	submission, err := s.SubmitPitch(eventId, vendorId, req)
	if err != nil {
		return domainevents.EventSubmission{}, err
	}

	// Validate file size
	maxFileSize := utils.GetEnv("MAX_FILE_SIZE", 20).(int)
	if err := utils.ValidateFileSize(fileHeader, maxFileSize); err != nil {
		return domainevents.EventSubmission{}, err
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		return domainevents.EventSubmission{}, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
	}
	defer file.Close()

	// Upload to storage provider (MinIO or R2)
	fileUrl, err := s.StorageProvider.UploadFile(ctx, file, fileHeader, "event-submission-files")
	if err != nil {
		return domainevents.EventSubmission{}, fmt.Errorf("failed to upload file %s to storage: %w", fileHeader.Filename, err)
	}

	// Create submission file record
	now := time.Now()
	submissionFile := domainevents.EventSubmissionFile{
		ID:                utils.CreateUUID(),
		EventSubmissionId: submission.Id,
		FileType:          fileType,
		FileUrl:           fileUrl,
		Caption:           caption,
		CreatedAt:         now,
		CreatedBy:         vendorId,
	}

	if err := s.EventRepo.CreateSubmissionFile(submissionFile); err != nil {
		// Cleanup uploaded file if database save fails
		_ = s.StorageProvider.DeleteFile(ctx, fileUrl)
		return domainevents.EventSubmission{}, err
	}

	return submission, nil
}

func (s *ServiceEvent) GetSubmissionsByEventID(eventId string) ([]domainevents.EventSubmission, error) {
	return s.EventRepo.GetSubmissionsByEventID(eventId)
}

func (s *ServiceEvent) GetAllSubmissions(params filter.BaseParams) ([]map[string]interface{}, int64, error) {
	submissions, total, err := s.EventRepo.GetAllSubmissions(params)
	if err != nil {
		return nil, 0, err
	}

	result := make([]map[string]interface{}, len(submissions))
	for i, sub := range submissions {
		result[i] = map[string]interface{}{
			"id":                   sub.Id,
			"event_id":             sub.EventID,
			"event":                sub.Event,
			"vendor_id":            sub.VendorID,
			"vendor":               sub.Vendor,
			"proposal_details":     sub.ProposalDetails,
			"additional_materials": sub.AdditionalMaterials,
			"score":                sub.Score,
			"comments":             sub.Comments,
			"is_shortlisted":       sub.IsShortlisted,
			"is_winner":            sub.IsWinner,
			"files":                sub.File,
			"created_at":           sub.CreatedAt,
			"updated_at":           sub.UpdatedAt,
		}
	}

	return result, total, nil
}

func (s *ServiceEvent) GetMySubmissions(vendorId string) ([]domainevents.EventSubmission, error) {
	return s.EventRepo.GetSubmissionsByVendorID(vendorId)
}

func (s *ServiceEvent) ScoreSubmission(submissionId string, req dto.ScoreSubmissionRequest) (domainevents.EventSubmission, error) {
	submission, err := s.EventRepo.GetSubmissionByID(submissionId)
	if err != nil {
		return domainevents.EventSubmission{}, err
	}

	submission.Score = &req.Score
	submission.Comments = req.Comments
	submission.UpdatedAt = time.Now()

	if err := s.EventRepo.UpdateSubmission(submission); err != nil {
		return domainevents.EventSubmission{}, err
	}

	return submission, nil
}

func (s *ServiceEvent) ShortlistSubmission(submissionId string, isShortlisted bool) (domainevents.EventSubmission, error) {
	submission, err := s.EventRepo.GetSubmissionByID(submissionId)
	if err != nil {
		return domainevents.EventSubmission{}, err
	}

	submission.IsShortlisted = isShortlisted
	submission.UpdatedAt = time.Now()

	if err := s.EventRepo.UpdateSubmission(submission); err != nil {
		return domainevents.EventSubmission{}, err
	}

	return submission, nil
}

func (s *ServiceEvent) SelectWinner(eventId, submissionId string) (domainevents.Event, error) {
	event, err := s.EventRepo.GetEventByID(eventId)
	if err != nil {
		return domainevents.Event{}, err
	}

	// Check if winner already selected
	if event.WinnerVendorID != nil && *event.WinnerVendorID != "" {
		// Check if current winner vendor is suspended
		currentWinnerVendor, err := s.VendorRepo.GetVendorByID(*event.WinnerVendorID)
		if err != nil {
			return domainevents.Event{}, errors.New("failed to check current winner status")
		}
		if currentWinnerVendor.Status != utils.VendorSuspend {
			return domainevents.Event{}, errors.New("winner has already been selected for this event")
		}
		// Current winner is suspended, allow changing winner
		// Reset previous winner's IsWinner flag
		submissions, err := s.EventRepo.GetSubmissionsByEventID(eventId)
		if err != nil {
			return domainevents.Event{}, err
		}
		for _, sub := range submissions {
			if sub.IsWinner {
				sub.IsWinner = false
				sub.UpdatedAt = time.Now()
				s.EventRepo.UpdateSubmission(sub)
			}
		}
	}

	submission, err := s.EventRepo.GetSubmissionByID(submissionId)
	if err != nil {
		return domainevents.Event{}, err
	}

	if submission.EventID != eventId {
		return domainevents.Event{}, errors.New("submission does not belong to this event")
	}

	submission.IsWinner = true
	submission.IsShortlisted = true
	submission.UpdatedAt = time.Now()
	if err := s.EventRepo.UpdateSubmission(submission); err != nil {
		return domainevents.Event{}, err
	}

	event.WinnerVendorID = &submission.VendorID
	event.Status = utils.EventCompleted
	event.UpdatedAt = time.Now()
	if err := s.EventRepo.UpdateEvent(event); err != nil {
		return domainevents.Event{}, err
	}

	return event, nil
}

func (s *ServiceEvent) GetEventResult(eventId, vendorId string) (map[string]interface{}, error) {
	event, err := s.EventRepo.GetEventByID(eventId)
	if err != nil {
		return nil, err
	}

	submission, err := s.EventRepo.GetSubmissionByEventAndVendor(eventId, vendorId)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Check if vendor has submitted
	hasSubmitted := submission.Id != ""

	// Event not yet completed
	if event.Status != utils.EventCompleted {
		result := map[string]interface{}{
			"event":         event,
			"has_submitted": hasSubmitted,
			"status":        "pending",
			"message":       "Event is still in progress. Results will be announced after the event is completed.",
		}
		return result, nil
	}

	// Event completed - check if winner
	isWinner := hasSubmitted && submission.IsWinner

	if isWinner {
		result := map[string]interface{}{
			"event":      event,
			"is_winner":  true,
			"status":     "won",
			"message":    "Congratulations! You have won this pitching event.",
			"submission": submission,
		}
		return result, nil
	}

	// Not winner
	result := map[string]interface{}{
		"event":         event,
		"is_winner":     false,
		"has_submitted": hasSubmitted,
		"status":        "not_selected",
		"message":       "Thank you for your participation. Unfortunately, you were not selected for this event. Keep trying and good luck on the next opportunity!",
	}
	return result, nil
}

func (s *ServiceEvent) GetEventResultForAdmin(eventId string) (map[string]interface{}, error) {
	event, err := s.EventRepo.GetEventByID(eventId)
	if err != nil {
		return nil, err
	}

	submissions, err := s.EventRepo.GetSubmissionsByEventID(eventId)
	if err != nil {
		return nil, err
	}

	var winnerSubmission *domainevents.EventSubmission
	for _, sub := range submissions {
		if sub.IsWinner {
			winnerSubmission = &sub
			break
		}
	}

	result := map[string]interface{}{
		"event":       event,
		"submissions": submissions,
		"winner":      winnerSubmission,
	}

	return result, nil
}

func (s *ServiceEvent) UploadEventFile(ctx context.Context, eventId string, userId string, fileHeader *multipart.FileHeader, req dto.UploadEventFileRequest) (domainevents.EventFile, error) {
	// Verify event exists
	_, err := s.EventRepo.GetEventByID(eventId)
	if err != nil {
		return domainevents.EventFile{}, errors.New("event not found")
	}

	// Validate file size
	maxPhotoSize := utils.GetEnv("MAX_PHOTO_SIZE_EVENT", 5).(int)
	if err := utils.ValidateFileSize(fileHeader, maxPhotoSize); err != nil {
		return domainevents.EventFile{}, err
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		return domainevents.EventFile{}, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
	}
	defer file.Close()

	// Upload to storage provider (MinIO or R2)
	fileUrl, err := s.StorageProvider.UploadFile(ctx, file, fileHeader, "event-files")
	if err != nil {
		return domainevents.EventFile{}, fmt.Errorf("failed to upload file %s to storage: %w", fileHeader.Filename, err)
	}

	now := time.Now()
	eventFile := domainevents.EventFile{
		ID:        utils.CreateUUID(),
		EventId:   eventId,
		FileType:  req.FileType,
		FileUrl:   fileUrl,
		Caption:   req.Caption,
		CreatedAt: now,
		CreatedBy: userId,
	}

	if err := s.EventRepo.CreateEventFile(eventFile); err != nil {
		// Cleanup uploaded file if database save fails
		_ = s.StorageProvider.DeleteFile(ctx, fileUrl)
		return domainevents.EventFile{}, err
	}

	return eventFile, nil
}

func (s *ServiceEvent) DeleteEventFile(ctx context.Context, fileId string) error {
	// Get file record to get the URL for storage deletion
	eventFile, err := s.EventRepo.GetEventFileByID(fileId)
	if err != nil {
		return err
	}

	// Delete from database first
	if err = s.EventRepo.DeleteEventFile(fileId); err == nil {
		// Delete from storage if database deletion succeeds
		_ = s.StorageProvider.DeleteFile(ctx, eventFile.FileUrl)
	}

	return err
}

func (s *ServiceEvent) UploadSubmissionFile(ctx context.Context, submissionId string, userId string, fileHeader *multipart.FileHeader, req dto.UploadSubmissionFileRequest) (domainevents.EventSubmissionFile, error) {
	// Verify submission exists
	_, err := s.EventRepo.GetSubmissionByID(submissionId)
	if err != nil {
		return domainevents.EventSubmissionFile{}, errors.New("submission not found")
	}

	// Check file limit (max 1 file per submission)
	count, err := s.EventRepo.CountSubmissionFilesBySubmissionID(submissionId)
	if err != nil {
		return domainevents.EventSubmissionFile{}, err
	}

	if count >= int64(utils.MaxFileLimit) {
		return domainevents.EventSubmissionFile{}, fmt.Errorf("maximum %d file allowed per submission", utils.MaxFileLimit)
	}

	// Validate file size
	maxFileSize := utils.GetEnv("MAX_FILE_SIZE", 20).(int)
	if err := utils.ValidateFileSize(fileHeader, maxFileSize); err != nil {
		return domainevents.EventSubmissionFile{}, err
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		return domainevents.EventSubmissionFile{}, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
	}
	defer file.Close()

	// Upload to storage provider (MinIO or R2)
	fileUrl, err := s.StorageProvider.UploadFile(ctx, file, fileHeader, "event-submission-files")
	if err != nil {
		return domainevents.EventSubmissionFile{}, fmt.Errorf("failed to upload file %s to storage: %w", fileHeader.Filename, err)
	}

	now := time.Now()
	submissionFile := domainevents.EventSubmissionFile{
		ID:                utils.CreateUUID(),
		EventSubmissionId: submissionId,
		FileType:          req.FileType,
		FileUrl:           fileUrl,
		Caption:           req.Caption,
		FileOrder:         0, // Will be calculated by repo if needed
		CreatedAt:         now,
		CreatedBy:         userId,
	}

	if err := s.EventRepo.CreateSubmissionFile(submissionFile); err != nil {
		// Cleanup uploaded file if database save fails
		_ = s.StorageProvider.DeleteFile(ctx, fileUrl)
		return domainevents.EventSubmissionFile{}, err
	}

	return submissionFile, nil
}

func (s *ServiceEvent) DeleteSubmissionFile(ctx context.Context, fileId string) error {
	// Get file record to get the URL for storage deletion
	submissionFile, err := s.EventRepo.GetSubmissionFileByID(fileId)
	if err != nil {
		return err
	}

	// Delete from database first
	if err = s.EventRepo.DeleteSubmissionFile(fileId); err == nil {
		// Delete from storage if database deletion succeeds
		_ = s.StorageProvider.DeleteFile(ctx, submissionFile.FileUrl)
	}

	return err
}

var _ interfaceevents.ServiceEventInterface = (*ServiceEvent)(nil)
