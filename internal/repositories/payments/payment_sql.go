package repositorypayments

import (
	"fmt"

	domainpayments "vendor-management-system/internal/domain/payments"
	interfacepayments "vendor-management-system/internal/interfaces/payments"
	"vendor-management-system/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewPaymentRepo(db *gorm.DB) interfacepayments.RepoPaymentInterface {
	return &repo{DB: db}
}

func (r *repo) CreatePayment(m domainpayments.Payment) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetPaymentByID(id string) (ret domainpayments.Payment, err error) {
	if err = r.DB.
		Preload("File").
		Preload("Vendor").
		Preload("Vendor.Profile").
		Where("id = ?", id).First(&ret).Error; err != nil {
		return domainpayments.Payment{}, err
	}
	return ret, nil
}

func (r *repo) GetPaymentsByVendorID(vendorId string) (ret []domainpayments.Payment, err error) {
	if err = r.DB.
		Preload("File").
		Preload("Vendor").
		Preload("Vendor.Profile").
		Where("vendor_id = ?", vendorId).Order("created_at DESC").Find(&ret).Error; err != nil {
		return nil, err
	}
	return ret, nil
}

func (r *repo) GetAllPayments(params filter.BaseParams) (ret []domainpayments.Payment, totalData int64, err error) {
	query := r.DB.Model(&domainpayments.Payment{})

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("LOWER(invoice_number) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?)", searchPattern, searchPattern)
	}

	for key, value := range params.Filters {
		if value == nil {
			continue
		}

		switch v := value.(type) {
		case string:
			if v == "" {
				continue
			}
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		}
	}

	if err := query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"invoice_number": true,
			"amount":         true,
			"status":         true,
			"payment_date":   true,
			"created_at":     true,
			"updated_at":     true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	}

	if err := query.Offset(params.Offset).Limit(params.Limit).
		Preload("Vendor").
		Preload("Vendor.Profile").
		Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}

func (r *repo) UpdatePayment(m domainpayments.Payment) error {
	return r.DB.Save(&m).Error
}

func (r *repo) DeletePayment(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainpayments.Payment{}).Error
}

// Payment file operations
func (r *repo) CreatePaymentFile(m domainpayments.PaymentFile) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetPaymentFileByID(id string) (ret domainpayments.PaymentFile, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domainpayments.PaymentFile{}, err
	}
	return ret, nil
}

func (r *repo) DeletePaymentFile(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainpayments.PaymentFile{}).Error
}
