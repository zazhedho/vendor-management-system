package domainvendors

import (
	"time"

	"gorm.io/gorm"
)

func (Vendor) TableName() string {
	return "vendors"
}

type Vendor struct {
	Id         string `json:"id" gorm:"column:id;primaryKey"`
	UserId     string `json:"user_id" gorm:"column:user_id"`
	VendorType string `json:"vendor_type" gorm:"column:vendor_type;default:perusahaan"`
	Status     string `json:"status" gorm:"column:status"` // pending, verified, rejected, active, suspended

	VerifiedAt   *time.Time `json:"verified_at" gorm:"column:verified_at"`
	VerifiedBy   *string    `json:"verified_by" gorm:"column:verified_by"`
	DeactivateAt *time.Time `json:"deactivate_at" gorm:"column:deactivate_at"`
	DeactivateBy *string    `json:"deactivate_by" gorm:"column:deactivate_by"`
	RejectReason *string    `json:"reject_reason,omitempty" gorm:"column:reject_reason"`
	ReverifyAt   *time.Time `json:"reverify_at,omitempty" gorm:"column:reverify_at"`
	ExpiredAt    *time.Time `json:"expired_at,omitempty" gorm:"column:expired_at"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	DeletedBy string         `json:"-"`
}

func (VendorProfile) TableName() string {
	return "vendor_profiles"
}

type VendorProfile struct {
	Id         string `json:"id" gorm:"column:id;primaryKey"`
	VendorId   string `json:"vendor_id" gorm:"column:vendor_id"`
	VendorName string `json:"vendor_name" gorm:"column:vendor_name"`
	Email      string `json:"email" gorm:"column:email"`
	Telephone  string `json:"telephone,omitempty" gorm:"column:telephone"`
	Fax        string `json:"fax,omitempty" gorm:"column:fax"`
	Phone      string `json:"phone,omitempty" gorm:"column:phone"`

	DistrictId    string `json:"district_id,omitempty" gorm:"column:district_id"`
	DistrictName  string `json:"district_name,omitempty" gorm:"column:district_name"`
	CityId        string `json:"city_id,omitempty" gorm:"column:city_id"`
	CityName      string `json:"city_name,omitempty" gorm:"column:city_name"`
	ProvinceId    string `json:"province_id,omitempty" gorm:"column:province_id"`
	ProvinceName  string `json:"province_name,omitempty" gorm:"column:province_name"`
	PostalCode    string `json:"postal_code,omitempty" gorm:"column:postal_code"`
	Address       string `json:"address,omitempty" gorm:"column:address"`
	BusinessField string `json:"business_field,omitempty" gorm:"column:business_field"`

	KTPName     string `json:"ktp_name" gorm:"column:ktp_name"`
	KTPNumber   string `json:"ktp_number,omitempty" gorm:"column:ktp_number"`
	NpwpName    string `json:"npwp_name,omitempty" gorm:"column:npwp_name"`
	NpwpNumber  string `json:"npwp_number,omitempty" gorm:"column:npwp_number"`
	NpwpAddress string `json:"npwp_address,omitempty" gorm:"column:npwp_address"`
	TaxStatus   string `json:"tax_status,omitempty" gorm:"column:tax_status"` //PKP, non-PKP

	BankName          string `json:"bank_name,omitempty" gorm:"column:bank_name"`
	BankBranch        string `json:"bank_branch,omitempty" gorm:"column:bank_branch"`
	AccountNumber     string `json:"account_number,omitempty" gorm:"column:account_number"`
	AccountHolderName string `json:"account_holder_name,omitempty" gorm:"column:account_holder_name"`

	File []VendorProfileFile `json:"files,omitempty" gorm:"foreignKey:PaymentId;constraint:OnDelete:CASCADE"`

	TransactionType string `json:"transaction_type,omitempty" gorm:"column:transaction_type"`
	PurchGroup      string `json:"purch_group,omitempty" gorm:"column:purch_group"`
	RegionOrSo      string `json:"region_or_so,omitempty" gorm:"column:region_or_so"`

	ContactPerson string `json:"contact_person,omitempty" gorm:"column:contact_person"`
	ContactEmail  string `json:"contact_email,omitempty" gorm:"column:contact_email"`
	ContactPhone  string `json:"contact_phone,omitempty" gorm:"column:contact_phone"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"column:updated_at"`
	UpdatedBy string         `json:"updated_by" gorm:"column:updated_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	DeletedBy string         `json:"-"`
}

func (VendorProfileFile) TableName() string {
	return "vendor_profile_files"
}

type VendorProfileFile struct {
	ID              string `json:"id" gorm:"column:id;primaryKey"`
	VendorProfileId string `json:"vendor_profile_id" gorm:"column:vendor_profile_id"`

	FileType string `json:"file_type" gorm:"column:file_type"` // ktp | npwp | bank_book | nib | siup | akta | dll
	FileURL  string `json:"file_url" gorm:"column:file_url"`

	IssuedAt  *time.Time `json:"issued_at,omitempty" gorm:"column:issued_at"`
	ExpiredAt *time.Time `json:"expired_at,omitempty" gorm:"column:expired_at"`

	Status     string     `json:"status" gorm:"column:status"` // pending | approved | rejected
	VerifiedAt *time.Time `json:"verified_at,omitempty" gorm:"column:verified_at"`
	VerifiedBy *string    `json:"verified_by,omitempty" gorm:"column:verified_by"`

	CreatedAt time.Time      `json:"created_at" gorm:"column:created_at"`
	CreatedBy string         `json:"created_by" gorm:"column:created_by"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}
