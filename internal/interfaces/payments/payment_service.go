package interfacepayments

import (
	"context"
	"mime/multipart"

	domainpayments "vendor-management-system/internal/domain/payments"
	"vendor-management-system/internal/dto"
	"vendor-management-system/pkg/filter"
)

type ServicePaymentInterface interface {
	CreatePayment(req dto.CreatePaymentRequest) (domainpayments.Payment, error)
	GetPaymentByID(id string) (domainpayments.Payment, error)
	GetPaymentsByVendorID(vendorId string) ([]domainpayments.Payment, error)
	GetAllPayments(params filter.BaseParams) ([]domainpayments.Payment, int64, error)
	UpdatePayment(id string, req dto.UpdatePaymentRequest) (domainpayments.Payment, error)
	UpdatePaymentStatus(id string, req dto.UpdatePaymentStatusRequest) (domainpayments.Payment, error)
	DeletePayment(id string) error

	// Payment file operations
	UploadPaymentFile(ctx context.Context, paymentId string, userId string, file *multipart.FileHeader, req dto.UploadPaymentFileRequest) (domainpayments.PaymentFile, error)
	DeletePaymentFile(ctx context.Context, fileId string) error
}
