package repositoryevents

import (
	"fmt"

	domainevents "vendor-management-system/internal/domain/events"
	interfaceevents "vendor-management-system/internal/interfaces/events"
	"vendor-management-system/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewEventRepo(db *gorm.DB) interfaceevents.RepoEventInterface {
	return &repo{DB: db}
}

// Event operations
func (r *repo) CreateEvent(m domainevents.Event) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetEventByID(id string) (ret domainevents.Event, err error) {
	if err = r.DB.Preload("File").Where("id = ?", id).First(&ret).Error; err != nil {
		return domainevents.Event{}, err
	}
	return ret, nil
}

func (r *repo) GetAllEvents(params filter.BaseParams) (ret []domainevents.Event, totalData int64, err error) {
	query := r.DB.Model(&domainevents.Event{})

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("LOWER(title) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?)", searchPattern, searchPattern)
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
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		}
	}

	if err := query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"title":      true,
			"status":     true,
			"start_date": true,
			"end_date":   true,
			"created_at": true,
			"updated_at": true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	}

	if err := query.Offset(params.Offset).Limit(params.Limit).Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}

func (r *repo) UpdateEvent(m domainevents.Event) error {
	return r.DB.Save(&m).Error
}

func (r *repo) DeleteEvent(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainevents.Event{}).Error
}

// Event file operations
func (r *repo) CreateEventFile(m domainevents.EventFile) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetEventFileByID(id string) (ret domainevents.EventFile, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domainevents.EventFile{}, err
	}
	return ret, nil
}

func (r *repo) DeleteEventFile(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainevents.EventFile{}).Error
}

// Submission operations
func (r *repo) CreateSubmission(m domainevents.EventSubmission) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetSubmissionByID(id string) (ret domainevents.EventSubmission, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domainevents.EventSubmission{}, err
	}
	return ret, nil
}

func (r *repo) GetSubmissionByEventAndVendor(eventId, vendorId string) (ret domainevents.EventSubmission, err error) {
	if err = r.DB.Where("event_id = ? AND vendor_id = ?", eventId, vendorId).First(&ret).Error; err != nil {
		return domainevents.EventSubmission{}, err
	}
	return ret, nil
}

func (r *repo) GetSubmissionsByEventID(eventId string) (ret []domainevents.EventSubmission, err error) {
	if err = r.DB.Where("event_id = ?", eventId).Find(&ret).Error; err != nil {
		return nil, err
	}
	return ret, nil
}

func (r *repo) GetSubmissionsByVendorID(vendorId string) (ret []domainevents.EventSubmission, err error) {
	if err = r.DB.Where("vendor_id = ?", vendorId).Find(&ret).Error; err != nil {
		return nil, err
	}
	return ret, nil
}

func (r *repo) UpdateSubmission(m domainevents.EventSubmission) error {
	return r.DB.Save(&m).Error
}

func (r *repo) DeleteSubmission(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainevents.EventSubmission{}).Error
}

// Submission file operations
func (r *repo) CreateSubmissionFile(m domainevents.EventSubmissionFile) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetSubmissionFileByID(id string) (ret domainevents.EventSubmissionFile, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domainevents.EventSubmissionFile{}, err
	}
	return ret, nil
}

func (r *repo) CountSubmissionFilesBySubmissionID(submissionId string) (int64, error) {
	var count int64
	err := r.DB.Model(&domainevents.EventSubmissionFile{}).Where("event_submission_id = ?", submissionId).Count(&count).Error
	return count, err
}

func (r *repo) DeleteSubmissionFile(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainevents.EventSubmissionFile{}).Error
}
