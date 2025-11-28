package domainevents

import (
	"time"

	"gorm.io/gorm"
)

func (Event) TableName() string {
	return "events"
}

type Event struct {
	Id              string         `json:"id" gorm:"column:id;primaryKey"`
	Title           string         `json:"title" gorm:"column:title"`
	Description     string         `json:"description,omitempty" gorm:"column:description"`
	Category        string         `json:"category,omitempty" gorm:"column:category"`
	StartDate       *time.Time     `json:"start_date,omitempty" gorm:"column:start_date"`
	EndDate         *time.Time     `json:"end_date,omitempty" gorm:"column:end_date"`
	TermsFilePath   string         `json:"terms_file_path,omitempty" gorm:"column:terms_file_path"`
	Status          string         `json:"status" gorm:"column:status"`
	CreatedByUserID string         `json:"created_by_user_id" gorm:"column:created_by_user_id"`
	WinnerVendorID  *string        `json:"winner_vendor_id,omitempty" gorm:"column:winner_vendor_id"`
	CreatedAt       time.Time      `json:"created_at,omitempty" gorm:"column:created_at"`
	UpdatedAt       *time.Time     `json:"updated_at,omitempty" gorm:"column:updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

func (EventSubmission) TableName() string {
	return "event_submissions"
}

type EventSubmission struct {
	Id                  string         `json:"id" gorm:"column:id;primaryKey"`
	EventID             string         `json:"event_id" gorm:"column:event_id"`
	VendorID            string         `json:"vendor_id" gorm:"column:vendor_id"`
	PitchFilePath       string         `json:"pitch_file_path,omitempty" gorm:"column:pitch_file_path"`
	ProposalDetails     string         `json:"proposal_details,omitempty" gorm:"column:proposal_details"`
	AdditionalMaterials string         `json:"additional_materials,omitempty" gorm:"column:additional_materials"`
	Score               *float64       `json:"score,omitempty" gorm:"column:score"`
	Comments            string         `json:"comments,omitempty" gorm:"column:comments"`
	IsShortlisted       bool           `json:"is_shortlisted" gorm:"column:is_shortlisted"`
	IsWinner            bool           `json:"is_winner" gorm:"column:is_winner"`
	CreatedAt           time.Time      `json:"created_at,omitempty" gorm:"column:created_at"`
	UpdatedAt           *time.Time     `json:"updated_at,omitempty" gorm:"column:updated_at"`
	DeletedAt           gorm.DeletedAt `json:"-" gorm:"index"`
}
