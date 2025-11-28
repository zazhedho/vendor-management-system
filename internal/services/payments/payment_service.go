package servicepayments

import (
	"errors"
	"time"

	domainpayments "vendor-management-system/internal/domain/payments"
	"vendor-management-system/internal/dto"
	interfacepayments "vendor-management-system/internal/interfaces/payments"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/utils"

	"github.com/shopspring/decimal"
)

type ServicePayment struct {
	PaymentRepo interfacepayments.RepoPaymentInterface
	VendorRepo  interfacevendors.RepoVendorInterface
}

func NewPaymentService(paymentRepo interfacepayments.RepoPaymentInterface, vendorRepo interfacevendors.RepoVendorInterface) *ServicePayment {
	return &ServicePayment{
		PaymentRepo: paymentRepo,
		VendorRepo:  vendorRepo,
	}
}

func (s *ServicePayment) CreatePayment(req dto.CreatePaymentRequest) (domainpayments.Payment, error) {
	_, err := s.VendorRepo.GetVendorByID(req.VendorID)
	if err != nil {
		return domainpayments.Payment{}, errors.New("vendor not found")
	}

	var paymentDate *time.Time
	if req.PaymentDate != "" {
		t, err := time.Parse("2006-01-02", req.PaymentDate)
		if err != nil {
			return domainpayments.Payment{}, errors.New("invalid payment_date format, use YYYY-MM-DD")
		}
		paymentDate = &t
	}

	payment := domainpayments.Payment{
		Id:                utils.CreateUUID(),
		InvoiceNumber:     req.InvoiceNumber,
		VendorID:          req.VendorID,
		Amount:            decimal.NewFromFloat(req.Amount),
		Status:            "on_progress",
		PaymentDate:       paymentDate,
		TransferProofPath: req.TransferProofPath,
		Description:       req.Description,
		CreatedAt:         time.Now(),
	}

	if err := s.PaymentRepo.CreatePayment(payment); err != nil {
		return domainpayments.Payment{}, err
	}

	return payment, nil
}

func (s *ServicePayment) GetPaymentByID(id string) (domainpayments.Payment, error) {
	return s.PaymentRepo.GetPaymentByID(id)
}

func (s *ServicePayment) GetPaymentsByVendorID(vendorId string) ([]domainpayments.Payment, error) {
	return s.PaymentRepo.GetPaymentsByVendorID(vendorId)
}

func (s *ServicePayment) GetAllPayments(params filter.BaseParams) ([]domainpayments.Payment, int64, error) {
	return s.PaymentRepo.GetAllPayments(params)
}

func (s *ServicePayment) UpdatePayment(id string, req dto.UpdatePaymentRequest) (domainpayments.Payment, error) {
	payment, err := s.PaymentRepo.GetPaymentByID(id)
	if err != nil {
		return domainpayments.Payment{}, err
	}

	if req.InvoiceNumber != "" {
		payment.InvoiceNumber = req.InvoiceNumber
	}
	if req.Amount > 0 {
		payment.Amount = decimal.NewFromFloat(req.Amount)
	}
	if req.Status != "" {
		payment.Status = req.Status
	}
	if req.PaymentDate != "" {
		t, err := time.Parse("2006-01-02", req.PaymentDate)
		if err != nil {
			return domainpayments.Payment{}, errors.New("invalid payment_date format, use YYYY-MM-DD")
		}
		payment.PaymentDate = &t
	}
	if req.TransferProofPath != "" {
		payment.TransferProofPath = req.TransferProofPath
	}
	if req.Description != "" {
		payment.Description = req.Description
	}

	now := time.Now()
	payment.UpdatedAt = &now

	if err := s.PaymentRepo.UpdatePayment(payment); err != nil {
		return domainpayments.Payment{}, err
	}

	return payment, nil
}

func (s *ServicePayment) UpdatePaymentStatus(id string, req dto.UpdatePaymentStatusRequest) (domainpayments.Payment, error) {
	payment, err := s.PaymentRepo.GetPaymentByID(id)
	if err != nil {
		return domainpayments.Payment{}, err
	}

	payment.Status = req.Status
	if req.TransferProofPath != "" {
		payment.TransferProofPath = req.TransferProofPath
	}

	if req.Status == "done" && payment.PaymentDate == nil {
		now := time.Now()
		payment.PaymentDate = &now
	}

	now := time.Now()
	payment.UpdatedAt = &now

	if err := s.PaymentRepo.UpdatePayment(payment); err != nil {
		return domainpayments.Payment{}, err
	}

	return payment, nil
}

func (s *ServicePayment) DeletePayment(id string) error {
	_, err := s.PaymentRepo.GetPaymentByID(id)
	if err != nil {
		return err
	}

	return s.PaymentRepo.DeletePayment(id)
}

var _ interfacepayments.ServicePaymentInterface = (*ServicePayment)(nil)
