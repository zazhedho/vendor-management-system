package interfacepayments

import (
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
}
