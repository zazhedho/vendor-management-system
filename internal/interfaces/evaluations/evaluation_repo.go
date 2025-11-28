package interfaceevaluations

import (
	domainevaluations "vendor-management-system/internal/domain/evaluations"
	"vendor-management-system/pkg/filter"
)

type RepoEvaluationInterface interface {
	// Evaluation operations
	CreateEvaluation(m domainevaluations.Evaluation) error
	GetEvaluationByID(id string) (domainevaluations.Evaluation, error)
	GetEvaluationWithPhotos(id string) (domainevaluations.Evaluation, error)
	GetEvaluationsByEventID(eventId string) ([]domainevaluations.Evaluation, error)
	GetEvaluationsByVendorID(vendorId string) ([]domainevaluations.Evaluation, error)
	GetAllEvaluations(params filter.BaseParams) ([]domainevaluations.Evaluation, int64, error)
	UpdateEvaluation(m domainevaluations.Evaluation) error
	DeleteEvaluation(id string) error

	// Photo operations
	CreatePhoto(m domainevaluations.EvaluationPhoto) error
	GetPhotoByID(id string) (domainevaluations.EvaluationPhoto, error)
	GetPhotosByEvaluationID(evaluationId string) ([]domainevaluations.EvaluationPhoto, error)
	CountPhotosByEvaluationID(evaluationId string) (int64, error)
	UpdatePhoto(m domainevaluations.EvaluationPhoto) error
	DeletePhoto(id string) error
}
