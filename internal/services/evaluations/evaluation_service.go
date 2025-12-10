package serviceevaluations

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"time"
	"vendor-management-system/pkg/storage"

	domainevaluations "vendor-management-system/internal/domain/evaluations"
	"vendor-management-system/internal/dto"
	interfaceevaluations "vendor-management-system/internal/interfaces/evaluations"
	interfaceevents "vendor-management-system/internal/interfaces/events"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/utils"
)

type ServiceEvaluation struct {
	EvaluationRepo  interfaceevaluations.RepoEvaluationInterface
	EventRepo       interfaceevents.RepoEventInterface
	VendorRepo      interfacevendors.RepoVendorInterface
	StorageProvider storage.StorageProvider
}

func NewEvaluationService(
	evaluationRepo interfaceevaluations.RepoEvaluationInterface,
	eventRepo interfaceevents.RepoEventInterface,
	vendorRepo interfacevendors.RepoVendorInterface,
	storageProvider storage.StorageProvider,
) *ServiceEvaluation {
	return &ServiceEvaluation{
		EvaluationRepo:  evaluationRepo,
		EventRepo:       eventRepo,
		VendorRepo:      vendorRepo,
		StorageProvider: storageProvider,
	}
}

// CreateEvaluation - Client creates evaluation for winner vendor after event is completed
func (s *ServiceEvaluation) CreateEvaluation(clientUserId string, req dto.CreateEvaluationRequest) (domainevaluations.Evaluation, error) {
	// Get event
	event, err := s.EventRepo.GetEventByID(req.EventID)
	if err != nil {
		return domainevaluations.Evaluation{}, errors.New("event not found")
	}

	// Validate event is completed
	if event.Status != utils.EventCompleted {
		return domainevaluations.Evaluation{}, errors.New("can only create evaluation for completed events")
	}

	// Event must have a winner
	if event.WinnerVendorID == nil || *event.WinnerVendorID == "" {
		return domainevaluations.Evaluation{}, errors.New("event must have a winner to create evaluation")
	}

	// Check if evaluation already exists
	existing, _ := s.EvaluationRepo.GetEvaluationByEventAndVendor(req.EventID, *event.WinnerVendorID)
	if existing.Id != "" {
		return domainevaluations.Evaluation{}, errors.New("evaluation already exists for this event")
	}

	now := time.Now()
	evaluation := domainevaluations.Evaluation{
		Id:              utils.CreateUUID(),
		EventID:         req.EventID,
		VendorID:        *event.WinnerVendorID,
		EvaluatorUserID: clientUserId,
		Comments:        req.Comments,
		CreatedAt:       now,
		CreatedBy:       clientUserId,
		UpdatedAt:       now,
		UpdatedBy:       clientUserId,
	}

	if err := s.EvaluationRepo.CreateEvaluation(evaluation); err != nil {
		return domainevaluations.Evaluation{}, err
	}

	return s.EvaluationRepo.GetEvaluationWithPhotos(evaluation.Id)
}

func (s *ServiceEvaluation) GetEvaluationByID(id string) (domainevaluations.Evaluation, error) {
	return s.EvaluationRepo.GetEvaluationWithPhotos(id)
}

func (s *ServiceEvaluation) GetEvaluationsByEventID(eventId string) ([]domainevaluations.Evaluation, error) {
	return s.EvaluationRepo.GetEvaluationsByEventID(eventId)
}

func (s *ServiceEvaluation) GetEvaluationsByVendorID(vendorId string) ([]domainevaluations.Evaluation, error) {
	return s.EvaluationRepo.GetEvaluationsByVendorID(vendorId)
}

// GetMyEvaluations - For vendor to get their own evaluations with pagination
func (s *ServiceEvaluation) GetMyEvaluations(vendorUserId string, params filter.BaseParams) ([]domainevaluations.Evaluation, int64, error) {
	vendor, err := s.VendorRepo.GetVendorByUserID(vendorUserId)
	if err != nil {
		return nil, 0, errors.New("vendor profile not found")
	}
	return s.EvaluationRepo.GetEvaluationsByVendorIDPaginated(vendor.Id, params)
}

func (s *ServiceEvaluation) GetAllEvaluations(params filter.BaseParams) ([]domainevaluations.Evaluation, int64, error) {
	return s.EvaluationRepo.GetAllEvaluations(params)
}

func (s *ServiceEvaluation) UpdateEvaluation(id string, req dto.UpdateEvaluationRequest) (domainevaluations.Evaluation, error) {
	evaluation, err := s.EvaluationRepo.GetEvaluationByID(id)
	if err != nil {
		return domainevaluations.Evaluation{}, err
	}

	if req.Comments != "" {
		evaluation.Comments = req.Comments
	}

	evaluation.UpdatedAt = time.Now()

	if err := s.EvaluationRepo.UpdateEvaluation(evaluation); err != nil {
		return domainevaluations.Evaluation{}, err
	}

	return s.EvaluationRepo.GetEvaluationWithPhotos(id)
}

func (s *ServiceEvaluation) DeleteEvaluation(id string) error {
	_, err := s.EvaluationRepo.GetEvaluationByID(id)
	if err != nil {
		return err
	}

	return s.EvaluationRepo.DeleteEvaluation(id)
}

// UploadPhoto - Vendor uploads photo with caption (NO review/rating)
func (s *ServiceEvaluation) UploadPhoto(ctx context.Context, vendorUserId string, evaluationId string, fileHeader *multipart.FileHeader, caption string) (domainevaluations.EvaluationPhoto, error) {
	// Verify evaluation exists and belongs to vendor
	evaluation, err := s.EvaluationRepo.GetEvaluationByID(evaluationId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, errors.New("evaluation not found")
	}

	// Get vendor
	vendor, err := s.VendorRepo.GetVendorByUserID(vendorUserId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, errors.New("vendor profile not found")
	}

	// Verify evaluation belongs to this vendor
	if evaluation.VendorID != vendor.Id {
		return domainevaluations.EvaluationPhoto{}, errors.New("evaluation does not belong to this vendor")
	}

	// Check photo limit (max 5)
	count, err := s.EvaluationRepo.CountPhotosByEvaluationID(evaluationId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	if count >= 5 {
		return domainevaluations.EvaluationPhoto{}, errors.New("maximum 5 photos allowed per evaluation")
	}

	// Validate file size
	maxPhotoSize := utils.GetEnv("MAX_PHOTO_SIZE", 2).(int)
	if err := utils.ValidateFileSize(fileHeader, maxPhotoSize); err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
	}
	defer file.Close()

	// Upload to storage provider (MinIO or R2)
	photoUrl, err := s.StorageProvider.UploadFile(ctx, file, fileHeader, "evaluation-photos")
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, fmt.Errorf("failed to upload file %s to storage: %w", fileHeader.Filename, err)
	}

	// Create photo WITHOUT review/rating (vendor uploads, client reviews later)
	photo := domainevaluations.EvaluationPhoto{
		Id:           utils.CreateUUID(),
		EvaluationID: evaluationId,
		PhotoUrl:     photoUrl,
		Caption:      caption,
		// Review, Rating, ReviewedBy, ReviewedAt are NULL - will be set by client
		CreatedAt: time.Now(),
	}

	if err := s.EvaluationRepo.CreatePhoto(photo); err != nil {
		// Cleanup uploaded file if database save fails
		_ = s.StorageProvider.DeleteFile(ctx, photoUrl)
		return domainevaluations.EvaluationPhoto{}, err
	}

	return photo, nil
}

// ReviewPhoto - Client reviews and rates a photo (CLIENT ONLY)
func (s *ServiceEvaluation) ReviewPhoto(clientUserId string, photoId string, req dto.ReviewEvaluationPhotoRequest) (domainevaluations.EvaluationPhoto, error) {
	// Get photo
	photo, err := s.EvaluationRepo.GetPhotoByID(photoId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, errors.New("photo not found")
	}

	// Get evaluation
	evaluation, err := s.EvaluationRepo.GetEvaluationByID(photo.EvaluationID)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, errors.New("evaluation not found")
	}

	// Verify client is the evaluator (event creator)
	if evaluation.EvaluatorUserID != clientUserId {
		return domainevaluations.EvaluationPhoto{}, errors.New("only the event creator can review this evaluation")
	}

	// Validate rating (1-5 stars)
	if req.Rating < 1 || req.Rating > 5 {
		return domainevaluations.EvaluationPhoto{}, errors.New("rating must be between 1 and 5")
	}

	// Update photo with review and rating
	photo.Review = req.Review
	rating := float64(req.Rating)
	photo.Rating = &rating
	photo.ReviewedBy = &clientUserId
	now := time.Now()
	photo.ReviewedAt = &now
	photo.UpdatedAt = &now

	if err := s.EvaluationRepo.UpdatePhoto(photo); err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	// Calculate overall rating from all photos
	photos, err := s.EvaluationRepo.GetPhotosByEvaluationID(evaluation.Id)
	if err == nil {
		totalRating := 0.0
		ratedCount := 0
		for _, p := range photos {
			if p.Rating != nil {
				totalRating += *p.Rating
				ratedCount++
			}
		}
		if ratedCount > 0 {
			overallRating := totalRating / float64(ratedCount)
			evaluation.OverallRating = &overallRating
			evaluation.UpdatedAt = time.Now()
			_ = s.EvaluationRepo.UpdateEvaluation(evaluation)
		}
	}

	return photo, nil
}

func (s *ServiceEvaluation) DeletePhoto(ctx context.Context, photoId string) error {
	photo, err := s.EvaluationRepo.GetPhotoByID(photoId)
	if err != nil {
		return err
	}

	// Delete from storage
	if err := s.StorageProvider.DeleteFile(ctx, photo.PhotoUrl); err != nil {
		return err
	}

	return s.EvaluationRepo.DeletePhoto(photoId)
}
