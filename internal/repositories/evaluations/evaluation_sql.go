package repositoryevaluations

import (
	"fmt"

	domainevaluations "vendor-management-system/internal/domain/evaluations"
	interfaceevaluations "vendor-management-system/internal/interfaces/evaluations"
	"vendor-management-system/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewEvaluationRepo(db *gorm.DB) interfaceevaluations.RepoEvaluationInterface {
	return &repo{DB: db}
}

// Evaluation operations
func (r *repo) CreateEvaluation(m domainevaluations.Evaluation) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetEvaluationByID(id string) (ret domainevaluations.Evaluation, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domainevaluations.Evaluation{}, err
	}
	return ret, nil
}

func (r *repo) GetEvaluationWithPhotos(id string) (ret domainevaluations.Evaluation, err error) {
	if err = r.DB.
		Preload("Event").
		Preload("Vendor").
		Preload("Vendor.Profile").
		Preload("Evaluator").
		Preload("Photos").
		Where("id = ?", id).First(&ret).Error; err != nil {
		return domainevaluations.Evaluation{}, err
	}
	return ret, nil
}

func (r *repo) GetEvaluationByEventAndVendor(eventId string, vendorId string) (ret domainevaluations.Evaluation, err error) {
	if err = r.DB.Where("event_id = ? AND vendor_id = ?", eventId, vendorId).First(&ret).Error; err != nil {
		return domainevaluations.Evaluation{}, err
	}
	return ret, nil
}

func (r *repo) GetEvaluationsByEventID(eventId string) (ret []domainevaluations.Evaluation, err error) {
	if err = r.DB.Preload("Photos").Where("event_id = ?", eventId).Find(&ret).Error; err != nil {
		return nil, err
	}
	return ret, nil
}

func (r *repo) GetEvaluationsByVendorID(vendorId string) (ret []domainevaluations.Evaluation, err error) {
	if err = r.DB.
		Preload("Event").
		Preload("Photos").
		Where("vendor_id = ?", vendorId).Find(&ret).Error; err != nil {
		return nil, err
	}
	return ret, nil
}

func (r *repo) GetEvaluationsByVendorIDPaginated(vendorId string, params filter.BaseParams) (ret []domainevaluations.Evaluation, totalData int64, err error) {
	query := r.DB.Model(&domainevaluations.Evaluation{}).Where("vendor_id = ?", vendorId)

	if params.Search != "" {
		query = query.Joins("LEFT JOIN events ON evaluations.event_id = events.id AND events.deleted_at IS NULL").
			Where("LOWER(events.title) LIKE LOWER(?)", "%"+params.Search+"%")
	}

	if err := query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	orderBy := "created_at"
	orderDir := "desc"
	if params.OrderBy != "" {
		orderBy = params.OrderBy
	}
	if params.OrderDirection != "" {
		orderDir = params.OrderDirection
	}

	if err = r.DB.
		Preload("Event").
		Preload("Photos").
		Where("vendor_id = ?", vendorId).
		Order(fmt.Sprintf("%s %s", orderBy, orderDir)).
		Offset(params.Offset).
		Limit(params.Limit).
		Find(&ret).Error; err != nil {
		return nil, 0, err
	}
	return ret, totalData, nil
}

func (r *repo) GetAllEvaluations(params filter.BaseParams) (ret []domainevaluations.Evaluation, totalData int64, err error) {
	query := r.DB.Model(&domainevaluations.Evaluation{}).
		Joins("LEFT JOIN events ON evaluations.event_id = events.id AND events.deleted_at IS NULL").
		Joins("LEFT JOIN vendors ON evaluations.vendor_id = vendors.id AND vendors.deleted_at IS NULL").
		Joins("LEFT JOIN vendor_profiles ON vendors.id = vendor_profiles.vendor_id AND vendor_profiles.deleted_at IS NULL")

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("LOWER(events.title) LIKE LOWER(?) OR LOWER(vendor_profiles.vendor_name) LIKE LOWER(?)", searchPattern, searchPattern)
	}

	for key, value := range params.Filters {
		if value == nil {
			continue
		}

		switch v := value.(type) {
		case string:
			if v == "" {
				continue
			}
			query = query.Where(fmt.Sprintf("evaluations.%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("evaluations.%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("evaluations.%s = ?", key), v)
		}
	}

	if err := query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	// Add Select after Count to specify columns for final query
	query = query.Select("evaluations.*")

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"overall_rating": true,
			"created_at":     true,
			"updated_at":     true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("evaluations.%s %s", params.OrderBy, params.OrderDirection))
	}

	if err := query.
		Preload("Event").
		Preload("Vendor").
		Preload("Vendor.Profile").
		Preload("Photos").
		Offset(params.Offset).Limit(params.Limit).Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}

func (r *repo) UpdateEvaluation(m domainevaluations.Evaluation) error {
	return r.DB.Save(&m).Error
}

func (r *repo) DeleteEvaluation(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainevaluations.Evaluation{}).Error
}

// Photo operations
func (r *repo) CreatePhoto(m domainevaluations.EvaluationPhoto) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetPhotoByID(id string) (ret domainevaluations.EvaluationPhoto, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domainevaluations.EvaluationPhoto{}, err
	}
	return ret, nil
}

func (r *repo) GetPhotosByEvaluationID(evaluationId string) (ret []domainevaluations.EvaluationPhoto, err error) {
	if err = r.DB.Where("evaluation_id = ?", evaluationId).Find(&ret).Error; err != nil {
		return nil, err
	}
	return ret, nil
}

func (r *repo) CountPhotosByEvaluationID(evaluationId string) (count int64, err error) {
	if err = r.DB.Model(&domainevaluations.EvaluationPhoto{}).Where("evaluation_id = ?", evaluationId).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *repo) UpdatePhoto(m domainevaluations.EvaluationPhoto) error {
	return r.DB.Save(&m).Error
}

func (r *repo) DeletePhoto(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainevaluations.EvaluationPhoto{}).Error
}
