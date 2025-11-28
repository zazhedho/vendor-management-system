package serviceevaluations

import (
	"errors"
	"time"

	domainevaluations "vendor-management-system/internal/domain/evaluations"
	"vendor-management-system/internal/dto"
	interfaceevaluations "vendor-management-system/internal/interfaces/evaluations"
	interfaceevents "vendor-management-system/internal/interfaces/events"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/utils"
)

const MaxPhotosPerEvaluation = 5

type ServiceEvaluation struct {
	EvaluationRepo interfaceevaluations.RepoEvaluationInterface
	EventRepo      interfaceevents.RepoEventInterface
	VendorRepo     interfacevendors.RepoVendorInterface
}

func NewEvaluationService(
	evaluationRepo interfaceevaluations.RepoEvaluationInterface,
	eventRepo interfaceevents.RepoEventInterface,
	vendorRepo interfacevendors.RepoVendorInterface,
) *ServiceEvaluation {
	return &ServiceEvaluation{
		EvaluationRepo: evaluationRepo,
		EventRepo:      eventRepo,
		VendorRepo:     vendorRepo,
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

	if len(req.PhotoPaths) > MaxPhotosPerEvaluation {
		return domainevaluations.Evaluation{}, errors.New("maximum 5 photos allowed per evaluation")
	}

	var overallRating *float64
	if req.OverallRating > 0 {
		overallRating = &req.OverallRating
	}

	evaluation := domainevaluations.Evaluation{
		Id:              utils.CreateUUID(),
		EventID:         req.EventID,
		VendorID:        req.VendorID,
		EvaluatorUserID: evaluatorId,
		OverallRating:   overallRating,
		Comments:        req.Comments,
		CreatedAt:       time.Now(),
	}

	if err := s.EvaluationRepo.CreateEvaluation(evaluation); err != nil {
		return domainevaluations.Evaluation{}, err
	}

	for _, photoPath := range req.PhotoPaths {
		photo := domainevaluations.EvaluationPhoto{
			Id:           utils.CreateUUID(),
			EvaluationID: evaluation.Id,
			PhotoPath:    photoPath,
			CreatedAt:    time.Now(),
		}
		if err := s.EvaluationRepo.CreatePhoto(photo); err != nil {
			return domainevaluations.Evaluation{}, err
		}
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

	now := time.Now()
	evaluation.UpdatedAt = &now

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

func (s *ServiceEvaluation) UploadPhoto(evaluationId string, req dto.UploadPhotoRequest) (domainevaluations.EvaluationPhoto, error) {
	_, err := s.EvaluationRepo.GetEvaluationByID(evaluationId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, errors.New("evaluation not found")
	}

	count, err := s.EvaluationRepo.CountPhotosByEvaluationID(evaluationId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	if count >= MaxPhotosPerEvaluation {
		return domainevaluations.EvaluationPhoto{}, errors.New("maximum 5 photos allowed per evaluation")
	}

	photo := domainevaluations.EvaluationPhoto{
		Id:           utils.CreateUUID(),
		EvaluationID: evaluationId,
		PhotoPath:    req.PhotoPath,
		CreatedAt:    time.Now(),
	}

	if err := s.EvaluationRepo.CreatePhoto(photo); err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	return photo, nil
}

func (s *ServiceEvaluation) ReviewPhoto(photoId string, req dto.ReviewPhotoRequest) (domainevaluations.EvaluationPhoto, error) {
	photo, err := s.EvaluationRepo.GetPhotoByID(photoId)
	if err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	photo.Review = req.Review
	photo.Rating = &req.Rating

	now := time.Now()
	photo.UpdatedAt = &now

	if err := s.EvaluationRepo.UpdatePhoto(photo); err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}

	return photo, nil
}

func (s *ServiceEvaluation) DeletePhoto(photoId string) error {
	_, err := s.EvaluationRepo.GetPhotoByID(photoId)
	if err != nil {
		return err
	}

	return s.EvaluationRepo.DeletePhoto(photoId)
}

var _ interfaceevaluations.ServiceEvaluationInterface = (*ServiceEvaluation)(nil)
