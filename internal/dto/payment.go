package dto

type CreatePaymentRequest struct {
	InvoiceNumber     string  `json:"invoice_number" binding:"required,max=100"`
	VendorID          string  `json:"vendor_id" binding:"required,uuid"`
	Amount            float64 `json:"amount" binding:"required,gt=0"`
	PaymentDate       string  `json:"payment_date" binding:"omitempty"`
	TransferProofPath string  `json:"transfer_proof_path" binding:"omitempty,max=500"`
	Description       string  `json:"description" binding:"omitempty"`
}

type UpdatePaymentRequest struct {
	InvoiceNumber     string  `json:"invoice_number" binding:"omitempty,max=100"`
	Amount            float64 `json:"amount" binding:"omitempty,gt=0"`
	Status            string  `json:"status" binding:"omitempty,oneof=on_progress done"`
	PaymentDate       string  `json:"payment_date" binding:"omitempty"`
	TransferProofPath string  `json:"transfer_proof_path" binding:"omitempty,max=500"`
	Description       string  `json:"description" binding:"omitempty"`
}

type UpdatePaymentStatusRequest struct {
	Status            string `json:"status" binding:"required,oneof=on_progress done"`
	TransferProofPath string `json:"transfer_proof_path" binding:"omitempty,max=500"`
}
