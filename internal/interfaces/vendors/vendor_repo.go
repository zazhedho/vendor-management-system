package interfacevendors

import (
	domainvendors "vendor-management-system/internal/domain/vendors"
	"vendor-management-system/pkg/filter"
)

type RepoVendorInterface interface {
	// Vendor operations
	CreateVendor(m domainvendors.Vendor) error
	GetVendorByID(id string) (domainvendors.Vendor, error)
	GetVendorByUserID(userId string) (domainvendors.Vendor, error)
	UpdateVendor(m domainvendors.Vendor) error
	GetAllVendors(params filter.BaseParams) ([]domainvendors.Vendor, int64, error)
	DeleteVendor(id string) error

	// VendorProfile operations
	CreateVendorProfile(m domainvendors.VendorProfile) error
	GetVendorProfileByID(id string) (domainvendors.VendorProfile, error)
	GetVendorProfileByVendorID(vendorId string) (domainvendors.VendorProfile, error)
	UpdateVendorProfile(m domainvendors.VendorProfile) error
	DeleteVendorProfile(id string) error
}
