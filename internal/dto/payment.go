package dto

type CreatePaymentRequest struct {
	InvoiceNumber string  `json:"invoice_number" binding:"required,max=100"`
	VendorID      string  `json:"vendor_id" binding:"required,uuid"`
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	PaymentDate   string  `json:"payment_date" binding:"omitempty"`
	Description   string  `json:"description" binding:"omitempty"`

	File []AddPaymentFile `json:"files,omitempty"`
}

type UpdatePaymentRequest struct {
	InvoiceNumber string  `json:"invoice_number" binding:"omitempty,max=100"`
	Amount        float64 `json:"amount" binding:"omitempty,gt=0"`
	Status        string  `json:"status" binding:"omitempty,oneof=pending paid cancelled"`
	PaymentDate   string  `json:"payment_date" binding:"omitempty"`
	Description   string  `json:"description" binding:"omitempty"`
}

type UpdatePaymentStatusRequest struct {
	Status      string `json:"status" binding:"required,oneof=pending paid cancelled"`
	PaymentDate string `json:"payment_date" binding:"omitempty"` // Required when marking as paid
}

// For file uploads - separate from payment creation
type UploadPaymentFileRequest struct {
	FileType string `json:"file_type" binding:"required,oneof=proof invoice receipt"`
	Caption  string `json:"caption" binding:"omitempty,max=255"`
}

type MarkAsPaidRequest struct {
	PaymentDate string `json:"payment_date" binding:"omitempty"`
}

type AddPaymentFile struct {
	FileType string `json:"file_type" binding:"required"`
	FileUrl  string `json:"file_url" binding:"required"`
	Caption  string `json:"caption,omitempty"`
}
