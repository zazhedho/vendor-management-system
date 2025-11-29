package interfaceevaluations

import (
	"context"
	"mime/multipart"

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
	UploadPhoto(ctx context.Context, evaluationId string, file *multipart.FileHeader, req dto.UploadEvaluationPhotoRequest) (domainevaluations.EvaluationPhoto, error)
	UpdatePhoto(photoId string, req dto.UpdateEvaluationPhotoRequest) (domainevaluations.EvaluationPhoto, error)
	DeletePhoto(ctx context.Context, photoId string) error
}
