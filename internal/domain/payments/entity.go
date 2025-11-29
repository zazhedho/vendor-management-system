package domainpayments

import (
	"time"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

func (Payment) TableName() string {
	return "payments"
}

type Payment struct {
	Id            string          `json:"id" gorm:"column:id;primaryKey"`
	InvoiceNumber string          `json:"invoice_number" gorm:"column:invoice_number"`
	VendorID      string          `json:"vendor_id" gorm:"column:vendor_id"`
	Amount        decimal.Decimal `json:"amount" gorm:"column:amount;type:decimal(15,2)"`
	Status        string          `json:"status" gorm:"column:status"`
	PaymentDate   *time.Time      `json:"payment_date,omitempty" gorm:"column:payment_date"`
	Description   string          `json:"description,omitempty" gorm:"column:description"`
	File          []PaymentFile   `json:"files,omitempty" gorm:"foreignKey:PaymentId;constraint:OnDelete:CASCADE"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	DeletedBy string         `json:"-"`
}

func (PaymentFile) TableName() string {
	return "payment_files"
}

type PaymentFile struct {
	ID        string `json:"id" gorm:"column:id;primaryKey"`
	PaymentId string `json:"payment_id" gorm:"column:payment_id"`
	FileType  string `json:"file_type" gorm:"column:file_type"`
	FileUrl   string `json:"file_url" gorm:"column:file_url"` // image || document
	Caption   string `json:"caption" gorm:"column:caption"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
