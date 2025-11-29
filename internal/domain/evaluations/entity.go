package domainevaluations

import (
	"time"

	"gorm.io/gorm"
)

func (Evaluation) TableName() string {
	return "evaluations"
}

type Evaluation struct {
	Id              string   `json:"id" gorm:"column:id;primaryKey"`
	EventID         string   `json:"event_id" gorm:"column:event_id"`
	VendorID        string   `json:"vendor_id" gorm:"column:vendor_id"`
	EvaluatorUserID string   `json:"evaluator_user_id" gorm:"column:evaluator_user_id"`
	OverallRating   *float64 `json:"overall_rating,omitempty" gorm:"column:overall_rating"`
	Comments        string   `json:"comments,omitempty" gorm:"column:comments"`

	Photos []EvaluationPhoto `json:"photos,omitempty" gorm:"foreignKey:EvaluationID;constraint:OnDelete:CASCADE"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	DeletedBy string         `json:"-"`
}

func (EvaluationPhoto) TableName() string {
	return "evaluation_photos"
}

type EvaluationPhoto struct {
	Id           string   `json:"id" gorm:"column:id;primaryKey"`
	EvaluationID string   `json:"evaluation_id" gorm:"column:evaluation_id"`
	PhotoUrl     string   `json:"photo_url" gorm:"column:photo_url"`
	Review       string   `json:"review,omitempty" gorm:"column:review"`
	Rating       *float64 `json:"rating,omitempty" gorm:"column:rating"`

	CreatedAt time.Time      `json:"created_at,omitempty" gorm:"column:created_at"`
	UpdatedAt *time.Time     `json:"updated_at,omitempty" gorm:"column:updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
