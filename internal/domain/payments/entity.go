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
	Id                string          `json:"id" gorm:"column:id;primaryKey"`
	InvoiceNumber     string          `json:"invoice_number" gorm:"column:invoice_number"`
	VendorID          string          `json:"vendor_id" gorm:"column:vendor_id"`
	Amount            decimal.Decimal `json:"amount" gorm:"column:amount;type:decimal(15,2)"`
	Status            string          `json:"status" gorm:"column:status"`
	PaymentDate       *time.Time      `json:"payment_date,omitempty" gorm:"column:payment_date"`
	TransferProofPath string          `json:"transfer_proof_path,omitempty" gorm:"column:transfer_proof_path"`
	Description       string          `json:"description,omitempty" gorm:"column:description"`
	CreatedAt         time.Time       `json:"created_at,omitempty" gorm:"column:created_at"`
	UpdatedAt         *time.Time      `json:"updated_at,omitempty" gorm:"column:updated_at"`
	DeletedAt         gorm.DeletedAt  `json:"-" gorm:"index"`
}
