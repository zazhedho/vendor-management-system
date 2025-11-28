package domainvendors

import (
	"time"

	"gorm.io/gorm"
)

func (Vendor) TableName() string {
	return "vendors"
}

type Vendor struct {
	Id         string         `json:"id" gorm:"column:id;primaryKey"`
	UserId     string         `json:"user_id" gorm:"column:user_id"`
	VendorType string         `json:"vendor_type" gorm:"column:vendor_type;default:perusahaan"`
	Status     string         `json:"status" gorm:"column:status"`
	CreatedAt  time.Time      `json:"created_at,omitempty" gorm:"column:created_at"`
	UpdatedAt  *time.Time     `json:"updated_at,omitempty" gorm:"column:updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

func (VendorProfile) TableName() string {
	return "vendor_profiles"
}

type VendorProfile struct {
	Id                string         `json:"id" gorm:"column:id;primaryKey"`
	VendorId          string         `json:"vendor_id" gorm:"column:vendor_id"`
	VendorName        string         `json:"vendor_name" gorm:"column:vendor_name"`
	Email             string         `json:"email" gorm:"column:email"`
	Phone             string         `json:"phone,omitempty" gorm:"column:phone"`
	Fax               string         `json:"fax,omitempty" gorm:"column:fax"`
	Mobile            string         `json:"mobile,omitempty" gorm:"column:mobile"`
	Province          string         `json:"province,omitempty" gorm:"column:province"`
	City              string         `json:"city,omitempty" gorm:"column:city"`
	District          string         `json:"district,omitempty" gorm:"column:district"`
	Address           string         `json:"address,omitempty" gorm:"column:address"`
	BusinessField     string         `json:"business_field,omitempty" gorm:"column:business_field"`
	NpwpNumber        string         `json:"npwp_number,omitempty" gorm:"column:npwp_number"`
	NpwpName          string         `json:"npwp_name,omitempty" gorm:"column:npwp_name"`
	NpwpAddress       string         `json:"npwp_address,omitempty" gorm:"column:npwp_address"`
	NpwpFilePath      string         `json:"npwp_file_path,omitempty" gorm:"column:npwp_file_path"`
	BankName          string         `json:"bank_name,omitempty" gorm:"column:bank_name"`
	BankBranch        string         `json:"bank_branch,omitempty" gorm:"column:bank_branch"`
	AccountNumber     string         `json:"account_number,omitempty" gorm:"column:account_number"`
	AccountHolderName string         `json:"account_holder_name,omitempty" gorm:"column:account_holder_name"`
	BankBookFilePath  string         `json:"bank_book_file_path,omitempty" gorm:"column:bank_book_file_path"`
	TransactionType   string         `json:"transaction_type,omitempty" gorm:"column:transaction_type"`
	PurchGroup        string         `json:"purch_group,omitempty" gorm:"column:purch_group"`
	RegionOrSo        string         `json:"region_or_so,omitempty" gorm:"column:region_or_so"`
	Nik               string         `json:"nik,omitempty" gorm:"column:nik"`
	KtpFilePath       string         `json:"ktp_file_path,omitempty" gorm:"column:ktp_file_path"`
	CreatedAt         time.Time      `json:"created_at,omitempty" gorm:"column:created_at"`
	UpdatedAt         *time.Time     `json:"updated_at,omitempty" gorm:"column:updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
}
