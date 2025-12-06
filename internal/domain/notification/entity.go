package domainnotification

import "time"

type Notification struct {
	ID            string    `json:"id" gorm:"column:id;primaryKey"`
	UserID        *string   `json:"user_id" gorm:"column:user_id"`
	Title         string    `json:"title" gorm:"column:title"`
	Message       string    `json:"message" gorm:"column:message"`
	Type          string    `json:"type" gorm:"column:type"`
	ReferenceType string    `json:"reference_type" gorm:"column:reference_type"`
	ReferenceID   string    `json:"reference_id" gorm:"column:reference_id"`
	IsRead        bool      `json:"is_read" gorm:"column:is_read"`
	CreatedAt     time.Time `json:"created_at" gorm:"column:created_at"`
}

func (Notification) TableName() string {
	return "notifications"
}
