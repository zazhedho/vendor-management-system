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

func (s *ServiceEvaluation) CreateEvaluation(evaluatorId string, req dto.CreateEvaluationRequest) (domainevaluations.Evaluation, error) {
	_, err := s.EventRepo.GetEventByID(req.EventID)
	if err != nil {
		return domainevaluations.Evaluation{}, errors.New("event not found")
	}

	_, err = s.VendorRepo.GetVendorByID(req.VendorID)
	if err != nil {
		return domainevaluations.Evaluation{}, errors.New("vendor not found")
	}

	var overallRating *float64
	if req.OverallRating > 0 {
		overallRating = &req.OverallRating
	}

	now := time.Now()
	evaluation := domainevaluations.Evaluation{
		Id:              utils.CreateUUID(),
		EventID:         req.EventID,
		VendorID:        req.VendorID,
		EvaluatorUserID: evaluatorId,
		OverallRating:   overallRating,
		Comments:        req.Comments,
		CreatedAt:       now,
		CreatedBy:       evaluatorId,
		UpdatedAt:       now,
		UpdatedBy:       evaluatorId,
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

func (s *ServiceEvaluation) GetAllEvaluations(params filter.BaseParams) ([]domainevaluations.Evaluation, int64, error) {
	return s.EvaluationRepo.GetAllEvaluations(params)
}

func (s *ServiceEvaluation) UpdateEvaluation(id string, req dto.UpdateEvaluationRequest) (domainevaluations.Evaluation, error) {
	evaluation, err := s.EvaluationRepo.GetEvaluationByID(id)
	if err != nil {
		return domainevaluations.Evaluation{}, err
	}

	if req.OverallRating > 0 {
		evaluation.OverallRating = &req.OverallRating
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

func (s *ServiceEvaluation) UploadPhoto(ctx context.Context, evaluationId string, fileHeader *multipart.FileHeader, req dto.UploadEvaluationPhotoRequest) (domainevaluations.EvaluationPhoto, error) {
	// Verify evaluation exists
	_, err := s.EvaluationRepo.GetEvaluationByID(evaluationId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, errors.New("evaluation not found")
	}

	// Check photo limit
	count, err := s.EvaluationRepo.CountPhotosByEvaluationID(evaluationId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	if count >= int64(utils.MaxPhotoLimit) {
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

	var rating *float64
	if req.Rating > 0 {
		rating = &req.Rating
	}

	photo := domainevaluations.EvaluationPhoto{
		Id:           utils.CreateUUID(),
		EvaluationID: evaluationId,
		PhotoUrl:     photoUrl,
		Review:       req.Review,
		Rating:       rating,
		CreatedAt:    time.Now(),
	}

	if err := s.EvaluationRepo.CreatePhoto(photo); err != nil {
		// Cleanup uploaded file if database save fails
		_ = s.StorageProvider.DeleteFile(ctx, photoUrl)
		return domainevaluations.EvaluationPhoto{}, err
	}

	return photo, nil
}

func (s *ServiceEvaluation) UpdatePhoto(photoId string, req dto.UpdateEvaluationPhotoRequest) (domainevaluations.EvaluationPhoto, error) {
	photo, err := s.EvaluationRepo.GetPhotoByID(photoId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	if req.Review != "" {
		photo.Review = req.Review
	}
	if req.Rating > 0 {
		photo.Rating = &req.Rating
	}

	now := time.Now()
	photo.UpdatedAt = &now

	if err := s.EvaluationRepo.UpdatePhoto(photo); err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	return photo, nil
}

func (s *ServiceEvaluation) DeletePhoto(ctx context.Context, photoId string) error {
	// Get photo record to get the URL for storage deletion
	photo, err := s.EvaluationRepo.GetPhotoByID(photoId)
	if err != nil {
		return err
	}

	// Delete from database first
	if err = s.EvaluationRepo.DeletePhoto(photoId); err == nil {
		// Delete from storage if database deletion succeeds
		_ = s.StorageProvider.DeleteFile(ctx, photo.PhotoUrl)
	}

	return err
}

var _ interfaceevaluations.ServiceEvaluationInterface = (*ServiceEvaluation)(nil)
