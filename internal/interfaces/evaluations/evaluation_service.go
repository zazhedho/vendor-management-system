package interfaceevaluations

import (
	"context"
	"mime/multipart"

	domainevaluations "vendor-management-system/internal/domain/evaluations"
	"vendor-management-system/internal/dto"
	"vendor-management-system/pkg/filter"
)

type ServiceEvaluationInterface interface {
	// Evaluation operations - Vendor creates after winning completed event
	CreateEvaluation(vendorUserId string, req dto.CreateEvaluationRequest) (domainevaluations.Evaluation, error)
	GetEvaluationByID(id string) (domainevaluations.Evaluation, error)
	GetEvaluationsByEventID(eventId string) ([]domainevaluations.Evaluation, error)
	GetEvaluationsByVendorID(vendorId string) ([]domainevaluations.Evaluation, error)
	GetMyEvaluations(vendorUserId string, params filter.BaseParams) ([]domainevaluations.Evaluation, int64, error)
	GetAllEvaluations(params filter.BaseParams) ([]domainevaluations.Evaluation, int64, error)
	UpdateEvaluation(id string, req dto.UpdateEvaluationRequest) (domainevaluations.Evaluation, error)
	DeleteEvaluation(id string) error

	// Photo operations - Vendor uploads, Client reviews
	UploadPhoto(ctx context.Context, vendorUserId string, evaluationId string, file *multipart.FileHeader, caption string) (domainevaluations.EvaluationPhoto, error)
	ReviewPhoto(clientUserId string, photoId string, req dto.ReviewEvaluationPhotoRequest) (domainevaluations.EvaluationPhoto, error)
	DeletePhoto(ctx context.Context, photoId string) error
}
