package repositoryvendors

import (
	"fmt"
	domainvendors "vendor-management-system/internal/domain/vendors"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewVendorRepo(db *gorm.DB) interfacevendors.RepoVendorInterface {
	return &repo{DB: db}
}

// Vendor operations
func (r *repo) CreateVendor(m domainvendors.Vendor) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetVendorByID(id string) (ret domainvendors.Vendor, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domainvendors.Vendor{}, err
	}
	return ret, nil
}

func (r *repo) GetVendorByUserID(userId string) (ret domainvendors.Vendor, err error) {
	if err = r.DB.Where("user_id = ?", userId).First(&ret).Error; err != nil {
		return domainvendors.Vendor{}, err
	}
	return ret, nil
}

func (r *repo) UpdateVendor(m domainvendors.Vendor) error {
	return r.DB.Save(&m).Error
}

func (r *repo) GetAllVendors(params filter.BaseParams) (ret []domainvendors.Vendor, totalData int64, err error) {
	query := r.DB.Model(&domainvendors.Vendor{}).Debug()

	if params.Search != "" {
		searchPattern := "%" + params.Search + "%"
		query = query.Where("LOWER(id) LIKE LOWER(?)", searchPattern)
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
			"status":     true,
			"created_at": true,
			"updated_at": true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	}

	if err := query.Offset(params.Offset).Limit(params.Limit).Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}

func (r *repo) DeleteVendor(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainvendors.Vendor{}).Error
}

// VendorProfile operations
func (r *repo) CreateVendorProfile(m domainvendors.VendorProfile) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetVendorProfileByID(id string) (ret domainvendors.VendorProfile, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domainvendors.VendorProfile{}, err
	}
	return ret, nil
}

func (r *repo) GetVendorProfileByVendorID(vendorId string) (ret domainvendors.VendorProfile, err error) {
	if err = r.DB.Where("vendor_id = ?", vendorId).First(&ret).Error; err != nil {
		return domainvendors.VendorProfile{}, err
	}
	return ret, nil
}

func (r *repo) UpdateVendorProfile(m domainvendors.VendorProfile) error {
	return r.DB.Save(&m).Error
}

func (r *repo) DeleteVendorProfile(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainvendors.VendorProfile{}).Error
}

// VendorProfile file operations
func (r *repo) CreateVendorProfileFile(m domainvendors.VendorProfileFile) error {
	return r.DB.Create(&m).Error
}

func (r *repo) GetVendorProfileFileByID(id string) (ret domainvendors.VendorProfileFile, err error) {
	if err = r.DB.Where("id = ?", id).First(&ret).Error; err != nil {
		return domainvendors.VendorProfileFile{}, err
	}
	return ret, nil
}

func (r *repo) DeleteVendorProfileFile(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainvendors.VendorProfileFile{}).Error
}
