package domainevents

import (
	"time"

	domainvendors "vendor-management-system/internal/domain/vendors"

	"gorm.io/gorm"
)

func (Event) TableName() string {
	return "events"
}

type Event struct {
	Id          string     `json:"id" gorm:"column:id;primaryKey"`
	Title       string     `json:"title" gorm:"column:title"`
	Description string     `json:"description,omitempty" gorm:"column:description"`
	Category    string     `json:"category,omitempty" gorm:"column:category"`
	StartDate   *time.Time `json:"start_date,omitempty" gorm:"column:start_date"`
	EndDate     *time.Time `json:"end_date,omitempty" gorm:"column:end_date"`

	File           []EventFile           `json:"files,omitempty" gorm:"foreignKey:EventId;constraint:OnDelete:CASCADE"`
	Status         string                `json:"status" gorm:"column:status"`
	WinnerVendorID *string               `json:"winner_vendor_id,omitempty" gorm:"column:winner_vendor_id"`
	WinnerVendor   *domainvendors.Vendor `json:"winner_vendor,omitempty" gorm:"foreignKey:WinnerVendorID;references:Id"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	DeletedBy string         `json:"-"`
}

func (EventFile) TableName() string {
	return "event_files"
}

type EventFile struct {
	ID       string `json:"id" gorm:"column:id;primaryKey"`
	EventId  string `json:"event_id" gorm:"column:event_id"`
	FileType string `json:"file_type" gorm:"column:file_type"`
	FileUrl  string `json:"file_url" gorm:"column:file_url"` // image || document
	Caption  string `json:"caption" gorm:"column:caption"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

func (EventSubmission) TableName() string {
	return "event_submissions"
}

type EventSubmission struct {
	Id       string `json:"id" gorm:"column:id;primaryKey"`
	EventID  string `json:"event_id" gorm:"column:event_id"`
	VendorID string `json:"vendor_id" gorm:"column:vendor_id"`

	Event  Event                 `json:"event,omitempty" gorm:"foreignKey:EventID;references:Id"`
	Vendor domainvendors.Vendor  `json:"vendor,omitempty" gorm:"foreignKey:VendorID;references:Id"`
	File   []EventSubmissionFile `json:"files,omitempty" gorm:"foreignKey:EventSubmissionId;constraint:OnDelete:CASCADE"`

	ProposalDetails     string   `json:"proposal_details,omitempty" gorm:"column:proposal_details"`
	AdditionalMaterials string   `json:"additional_materials,omitempty" gorm:"column:additional_materials"`
	Score               *float64 `json:"score,omitempty" gorm:"column:score"`
	Comments            string   `json:"comments,omitempty" gorm:"column:comments"`
	IsShortlisted       bool     `json:"is_shortlisted" gorm:"column:is_shortlisted"`
	IsWinner            bool     `json:"is_winner" gorm:"column:is_winner"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	DeletedBy string         `json:"-"`
}

func (EventSubmissionFile) TableName() string {
	return "event_submission_files"
}

type EventSubmissionFile struct {
	ID                string `json:"id" gorm:"column:id;primaryKey"`
	EventSubmissionId string `json:"event_submission_id" gorm:"column:event_submission_id"`
	FileType          string `json:"file_type" gorm:"column:file_type"`
	FileUrl           string `json:"file_url" gorm:"column:file_url"`
	Caption           string `json:"caption" gorm:"column:caption"`
	FileOrder         int    `json:"file_order" gorm:"column:file_order"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
