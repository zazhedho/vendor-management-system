package dto

import "time"

type CreateVendorRequest struct {
	UserID     string `json:"user_id" binding:"required,uuid"`
	VendorType string `json:"vendor_type" binding:"required,oneof=company individual"`
}

type UpdateVendorRequest struct {
	VendorType string `json:"vendor_type" binding:"omitempty,oneof=company individual"`
	Status     string `json:"status" binding:"omitempty,oneof=pending verified rejected active suspended"`
}

type VendorProfileRequest struct {
	VendorType    string `json:"vendor_type" binding:"omitempty,oneof=company individual"`
	VendorName    string `json:"vendor_name" binding:"required,min=3,max=255"`
	Email         string `json:"email" binding:"required,email"`
	Telephone     string `json:"telephone" binding:"omitempty,max=20"`
	Fax           string `json:"fax" binding:"omitempty,max=20"`
	Phone         string `json:"phone" binding:"omitempty,max=20"`
	Address       string `json:"address" binding:"omitempty"`
	DistrictId    string `json:"district_id" binding:"required"`
	DistrictName  string `json:"district_name" binding:"required"`
	CityId        string `json:"city_id" binding:"required"`
	CityName      string `json:"city_name" binding:"required"`
	ProvinceId    string `json:"province_id" binding:"required"`
	ProvinceName  string `json:"province_name" binding:"required"`
	PostalCode    string `json:"postal_code" binding:"omitempty,max=10"`
	BusinessField string `json:"business_field" binding:"omitempty,max=255"`

	// KTP fields
	KtpNumber string `json:"ktp_number" binding:"omitempty,max=20"`
	KtpName   string `json:"ktp_name" binding:"omitempty,max=255"`

	// NPWP fields
	NpwpNumber  string `json:"npwp_number" binding:"omitempty,max=50"`
	NpwpName    string `json:"npwp_name" binding:"omitempty,max=255"`
	NpwpAddress string `json:"npwp_address" binding:"omitempty"`
	TaxStatus   string `json:"tax_status" binding:"omitempty,max=20"` // PKP, non-PKP

	// Bank fields
	BankName          string `json:"bank_name" binding:"omitempty,max=100"`
	BankBranch        string `json:"bank_branch" binding:"omitempty,max=100"`
	AccountNumber     string `json:"account_number" binding:"omitempty,max=50"`
	AccountHolderName string `json:"account_holder_name" binding:"omitempty,max=255"`

	// NIB fields
	NibNumber string `json:"nib_number" binding:"omitempty,max=50"`

	// Business fields
	TransactionType string `json:"transaction_type" binding:"omitempty,max=100"`
	PurchGroup      string `json:"purch_group" binding:"omitempty,max=100"`
	RegionOrSo      string `json:"region_or_so" binding:"omitempty,max=100"`

	// Contact Person fields
	ContactPerson string `json:"contact_person" binding:"omitempty,max=255"`
	ContactEmail  string `json:"contact_email" binding:"omitempty,email"`
	ContactPhone  string `json:"contact_phone" binding:"omitempty,max=20"`

	File []AddVendorProfileFile `json:"files,omitempty"`
}

// For file uploads - separate from profile creation
type UploadVendorProfileFileRequest struct {
	FileType  string `json:"file_type" binding:"required,oneof=ktp npwp bank_book nib siup akta"`
	Caption   string `json:"caption" binding:"omitempty,max=255"`
	IssuedAt  string `json:"issued_at" binding:"omitempty"`
	ExpiredAt string `json:"expired_at" binding:"omitempty"`
}

type UpdateVendorStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending verified rejected active suspended"`
}

type UpdateVendorProfileFileStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending approved rejected"`
	Reason string `json:"reason" binding:"omitempty"`
}

type RejectVendorRequest struct {
	Reason string `json:"reason" binding:"required,min=10"`
}

type VerifyProfileFileRequest struct {
	Status string `json:"status" binding:"required,oneof=approved rejected"`
	Reason string `json:"reason" binding:"omitempty"` // Required if status is rejected
}

type AddVendorProfileFile struct {
	FileType   string    `json:"file_type" binding:"required"`
	FileUrl    string    `json:"file_url" binding:"required"`
	IssuedAt   time.Time `json:"issued_at"`
	ExpiredAt  time.Time `json:"expired_at"`
	Status     string    `json:"status"`
	VerifiedAt time.Time `json:"verified_at"`
	VerifiedBy string    `json:"verified_by"`
}
