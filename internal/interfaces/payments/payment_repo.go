package interfacepayments

import (
	domainpayments "vendor-management-system/internal/domain/payments"
	"vendor-management-system/pkg/filter"
)

type RepoPaymentInterface interface {
	CreatePayment(m domainpayments.Payment) error
	GetPaymentByID(id string) (domainpayments.Payment, error)
	GetPaymentsByVendorID(vendorId string) ([]domainpayments.Payment, error)
	GetAllPayments(params filter.BaseParams) ([]domainpayments.Payment, int64, error)
	UpdatePayment(m domainpayments.Payment) error
	DeletePayment(id string) error
}
