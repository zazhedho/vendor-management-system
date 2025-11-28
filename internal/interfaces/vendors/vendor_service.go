package interfacevendors

import (
	domainvendors "vendor-management-system/internal/domain/vendors"
	"vendor-management-system/internal/dto"
	"vendor-management-system/pkg/filter"
)

type ServiceVendorInterface interface {
	// Get vendor by user ID
	GetVendorByUserID(userId string) (map[string]interface{}, error)

	// Get vendor profile by vendor ID
	GetVendorProfileByVendorID(vendorId string) (domainvendors.VendorProfile, error)

	// Create or update vendor profile
	CreateOrUpdateVendorProfile(userId string, req dto.VendorProfileRequest) (map[string]interface{}, error)

	// Get all vendors (admin)
	GetAllVendors(params filter.BaseParams) ([]map[string]interface{}, int64, error)

	// Update vendor status (admin)
	UpdateVendorStatus(vendorId string, status string) (domainvendors.Vendor, error)

	// Delete vendor (admin)
	DeleteVendor(vendorId string) error
}
