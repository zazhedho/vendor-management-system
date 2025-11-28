package dto

type VendorProfileRequest struct {
	VendorType        string `json:"vendor_type" binding:"omitempty,oneof=perusahaan perorangan"`
	VendorName        string `json:"vendor_name" binding:"required,min=3,max=255"`
	Email             string `json:"email" binding:"required,email"`
	Telephone         string `json:"telephone" binding:"omitempty,min=9,max=20"`
	Fax               string `json:"fax" binding:"omitempty,max=20"`
	Mobile            string `json:"mobile" binding:"omitempty,min=9,max=20"`
	Province          string `json:"province" binding:"required,max=100"`
	City              string `json:"city" binding:"required,max=100"`
	District          string `json:"district" binding:"required,max=100"`
	Address           string `json:"address" binding:"required"`
	BusinessField     string `json:"business_field" binding:"required,max=255"`
	NpwpNumber        string `json:"npwp_number" binding:"required,max=50"`
	NpwpName          string `json:"npwp_name" binding:"required,max=255"`
	NpwpAddress       string `json:"npwp_address" binding:"required"`
	NpwpFilePath      string `json:"npwp_file_path" binding:"omitempty,max=500"`
	BankName          string `json:"bank_name" binding:"required,max=100"`
	BankBranch        string `json:"bank_branch" binding:"required,max=100"`
	AccountNumber     string `json:"account_number" binding:"required,max=50"`
	AccountHolderName string `json:"account_holder_name" binding:"required,max=255"`
	BankBookFilePath  string `json:"bank_book_file_path" binding:"omitempty,max=500"`
	TransactionType   string `json:"transaction_type" binding:"required"`
	PurchGroup        string `json:"purch_group" binding:"required,max=100"`
	RegionOrSo        string `json:"region_or_so" binding:"required,max=255"`
	NIK               string `json:"nik" binding:"required,max=20"`
	KtpFilePath       string `json:"ktp_file_path" binding:"omitempty,max=500"`
}

type UpdateVendorStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending approved rejected"`
}
