package servicepayments

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"time"
	"vendor-management-system/pkg/storage"

	domainpayments "vendor-management-system/internal/domain/payments"
	"vendor-management-system/internal/dto"
	interfacepayments "vendor-management-system/internal/interfaces/payments"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/utils"

	"github.com/shopspring/decimal"
)

type ServicePayment struct {
	PaymentRepo     interfacepayments.RepoPaymentInterface
	VendorRepo      interfacevendors.RepoVendorInterface
	StorageProvider storage.StorageProvider
}

func NewPaymentService(paymentRepo interfacepayments.RepoPaymentInterface, vendorRepo interfacevendors.RepoVendorInterface, storageProvider storage.StorageProvider) *ServicePayment {
	return &ServicePayment{
		PaymentRepo:     paymentRepo,
		VendorRepo:      vendorRepo,
		StorageProvider: storageProvider,
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

	now := time.Now()
	payment := domainpayments.Payment{
		Id:            utils.CreateUUID(),
		InvoiceNumber: req.InvoiceNumber,
		VendorID:      req.VendorID,
		Amount:        decimal.NewFromFloat(req.Amount),
		Status:        "pending",
		PaymentDate:   paymentDate,
		Description:   req.Description,
		CreatedAt:     now,
		CreatedBy:     req.VendorID,
		UpdatedAt:     now,
		UpdatedBy:     req.VendorID,
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
	if req.Description != "" {
		payment.Description = req.Description
	}

	payment.UpdatedAt = time.Now()

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

	if req.Status == "paid" && payment.PaymentDate == nil {
		now := time.Now()
		payment.PaymentDate = &now
	}

	if req.PaymentDate != "" {
		t, err := time.Parse("2006-01-02", req.PaymentDate)
		if err != nil {
			return domainpayments.Payment{}, errors.New("invalid payment_date format, use YYYY-MM-DD")
		}
		payment.PaymentDate = &t
	}

	payment.UpdatedAt = time.Now()

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

func (s *ServicePayment) UploadPaymentFile(ctx context.Context, paymentId string, userId string, fileHeader *multipart.FileHeader, req dto.UploadPaymentFileRequest) (domainpayments.PaymentFile, error) {
	// Verify payment exists
	_, err := s.PaymentRepo.GetPaymentByID(paymentId)
	if err != nil {
		return domainpayments.PaymentFile{}, errors.New("payment not found")
	}

	// Validate file size
	maxPhotoSize := utils.GetEnv("MAX_PHOTO_SIZE_PAYMENT", 2).(int)
	if err := utils.ValidateFileSize(fileHeader, maxPhotoSize); err != nil {
		return domainpayments.PaymentFile{}, err
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		return domainpayments.PaymentFile{}, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
	}
	defer file.Close()

	// Upload to storage provider (MinIO or R2)
	fileUrl, err := s.StorageProvider.UploadFile(ctx, file, fileHeader, "payment-files")
	if err != nil {
		return domainpayments.PaymentFile{}, fmt.Errorf("failed to upload file %s to storage: %w", fileHeader.Filename, err)
	}

	now := time.Now()
	paymentFile := domainpayments.PaymentFile{
		ID:        utils.CreateUUID(),
		PaymentId: paymentId,
		FileType:  req.FileType,
		FileUrl:   fileUrl,
		Caption:   req.Caption,
		CreatedAt: now,
		CreatedBy: userId,
	}

	if err := s.PaymentRepo.CreatePaymentFile(paymentFile); err != nil {
		// Cleanup uploaded file if database save fails
		_ = s.StorageProvider.DeleteFile(ctx, fileUrl)
		return domainpayments.PaymentFile{}, err
	}

	return paymentFile, nil
}

func (s *ServicePayment) DeletePaymentFile(ctx context.Context, fileId string) error {
	// Get file record to get the URL for storage deletion
	paymentFile, err := s.PaymentRepo.GetPaymentFileByID(fileId)
	if err != nil {
		return err
	}

	// Delete from database first
	if err = s.PaymentRepo.DeletePaymentFile(fileId); err == nil {
		// Delete from storage if database deletion succeeds
		_ = s.StorageProvider.DeleteFile(ctx, paymentFile.FileUrl)
	}

	return err
}

var _ interfacepayments.ServicePaymentInterface = (*ServicePayment)(nil)
