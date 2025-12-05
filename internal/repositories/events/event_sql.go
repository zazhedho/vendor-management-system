package repositoryevents

import (
	"fmt"
	"strings"

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
	if err = r.DB.Preload("File").Preload("WinnerVendor").Preload("WinnerVendor.Profile").Where("id = ?", id).First(&ret).Error; err != nil {
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
	if err = r.DB.Preload("Event").Preload("Vendor").Preload("Vendor.Profile").Preload("File").Where("event_id = ?", eventId).Find(&ret).Error; err != nil {
		return nil, err
	}
	return ret, nil
}

func (r *repo) GetAllSubmissions(params filter.BaseParams) (ret []domainevents.EventSubmission, totalData int64, err error) {
	query := r.DB.Model(&domainevents.EventSubmission{}).
		Joins("LEFT JOIN events ON event_submissions.event_id = events.id AND events.deleted_at IS NULL")

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("LOWER(events.title) LIKE LOWER(?)", searchPattern)
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
			query = query.Where(fmt.Sprintf("event_submissions.%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("event_submissions.%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("event_submissions.%s = ?", key), v)
		}
	}

	if err := query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		query = query.Order(fmt.Sprintf("event_submissions.%s %s", params.OrderBy, params.OrderDirection))
	}

	if err := query.Preload("Event").Preload("Vendor").Preload("Vendor.Profile").Preload("File").
		Offset(params.Offset).Limit(params.Limit).Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}

func (r *repo) GetSubmissionsByVendorID(vendorId string, params filter.BaseParams) (ret []domainevents.EventSubmission, totalData int64, err error) {
	query := r.DB.Model(&domainevents.EventSubmission{}).
		Joins("LEFT JOIN events ON events.id = event_submissions.event_id").
		Where("event_submissions.vendor_id = ?", vendorId).
		Where("events.deleted_at IS NULL")

	if params.Search != "" {
		searchPattern := "%" + strings.ToLower(params.Search) + "%"
		query = query.Where("LOWER(events.title) LIKE ?", searchPattern)
	}

	for key, value := range params.Filters {
		switch key {
		case "event_id":
			query = query.Where("event_submissions.event_id = ?", value)
		case "is_shortlisted", "is_winner":
			query = query.Where(fmt.Sprintf("event_submissions.%s = ?", key), value)
		}
	}

	if err = query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	orderBy := "event_submissions.updated_at"
	if params.OrderBy != "" {
		switch params.OrderBy {
		case "created_at", "updated_at", "score":
			orderBy = fmt.Sprintf("event_submissions.%s", params.OrderBy)
		case "event_title":
			orderBy = "events.title"
		}
	}

	orderDirection := params.OrderDirection
	if orderDirection == "" {
		orderDirection = "desc"
	}

	if err = query.Preload("Event").Preload("File").
		Order(fmt.Sprintf("%s %s", orderBy, orderDirection)).
		Offset(params.Offset).Limit(params.Limit).
		Find(&ret).Error; err != nil {
		return nil, 0, err
	}
	return ret, totalData, nil
}

func (r *repo) GetGroupedSubmissions(params filter.BaseParams, submissionPage int, submissionLimit int) (*domainevents.GroupedSubmissionsResponse, error) {
	// Build base query
	baseQuery := r.DB.Table("events").
		Joins("INNER JOIN event_submissions ON event_submissions.event_id = events.id").
		Where("events.deleted_at IS NULL")

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		baseQuery = baseQuery.Where("LOWER(events.title) LIKE LOWER(?)", searchPattern)
	}

	// Count total events
	var totalEvents int64
	if err := baseQuery.Distinct("events.id").Count(&totalEvents).Error; err != nil {
		return nil, err
	}

	// Get paginated event IDs using raw query
	var eventIDs []string
	query := `
		SELECT DISTINCT events.id 
		FROM events 
		INNER JOIN event_submissions ON event_submissions.event_id = events.id 
		WHERE events.deleted_at IS NULL
	`
	var args []interface{}

	if params.Search != "" {
		query += " AND LOWER(events.title) LIKE LOWER(?)"
		args = append(args, "%"+params.Search+"%")
	}

	query += " ORDER BY events.id DESC LIMIT ? OFFSET ?"
	args = append(args, params.Limit, params.Offset)

	if err := r.DB.Raw(query, args...).Pluck("id", &eventIDs).Error; err != nil {
		return nil, err
	}

	// Build response
	response := &domainevents.GroupedSubmissionsResponse{
		EventGroups:   make([]domainevents.EventSubmissionGroup, 0),
		TotalEvents:   totalEvents,
		CurrentPage:   params.Page,
		EventsPerPage: params.Limit,
		TotalPages:    int((totalEvents + int64(params.Limit) - 1) / int64(params.Limit)),
	}

	// For each event, get submissions with pagination
	for _, eventID := range eventIDs {
		var event domainevents.Event
		if err := r.DB.Preload("WinnerVendor").Preload("WinnerVendor.Profile").First(&event, "id = ?", eventID).Error; err != nil {
			continue
		}

		// Count submissions for this event
		var totalSubmissions int64
		r.DB.Model(&domainevents.EventSubmission{}).Where("event_id = ?", eventID).Count(&totalSubmissions)

		// Get paginated submissions
		var submissions []domainevents.EventSubmission
		submissionOffset := (submissionPage - 1) * submissionLimit
		r.DB.Preload("Vendor").Preload("Vendor.Profile").Preload("File").
			Where("event_id = ?", eventID).
			Order("created_at DESC").
			Offset(submissionOffset).Limit(submissionLimit).
			Find(&submissions)

		totalSubmissionPages := int((totalSubmissions + int64(submissionLimit) - 1) / int64(submissionLimit))

		response.EventGroups = append(response.EventGroups, domainevents.EventSubmissionGroup{
			Event:                event,
			Submissions:          submissions,
			TotalSubmissions:     totalSubmissions,
			SubmissionPage:       submissionPage,
			SubmissionPerPage:    submissionLimit,
			TotalSubmissionPages: totalSubmissionPages,
		})
	}

	return response, nil
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
