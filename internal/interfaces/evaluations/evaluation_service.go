package interfaceevaluations

import (
	domainevaluations "vendor-management-system/internal/domain/evaluations"
	"vendor-management-system/internal/dto"
	"vendor-management-system/pkg/filter"
)

type ServiceEvaluationInterface interface {
	// Evaluation operations
	CreateEvaluation(evaluatorId string, req dto.CreateEvaluationRequest) (domainevaluations.Evaluation, error)
	GetEvaluationByID(id string) (domainevaluations.Evaluation, error)
	GetEvaluationsByEventID(eventId string) ([]domainevaluations.Evaluation, error)
	GetEvaluationsByVendorID(vendorId string) ([]domainevaluations.Evaluation, error)
	GetAllEvaluations(params filter.BaseParams) ([]domainevaluations.Evaluation, int64, error)
	UpdateEvaluation(id string, req dto.UpdateEvaluationRequest) (domainevaluations.Evaluation, error)
	DeleteEvaluation(id string) error

	// Photo operations
	UploadPhoto(evaluationId string, req dto.UploadPhotoRequest) (domainevaluations.EvaluationPhoto, error)
	ReviewPhoto(photoId string, req dto.ReviewPhotoRequest) (domainevaluations.EvaluationPhoto, error)
	DeletePhoto(photoId string) error
}
