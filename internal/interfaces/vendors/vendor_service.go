package interfacevendors

import (
	"context"
	"mime/multipart"

	domainvendors "vendor-management-system/internal/domain/vendors"
	"vendor-management-system/internal/dto"
	"vendor-management-system/pkg/filter"
)

type ServiceVendorInterface interface {
	GetVendorByUserID(userId string) (map[string]interface{}, error)
	GetVendorProfileByVendorID(vendorId string) (domainvendors.VendorProfile, error)
	CreateOrUpdateVendorProfile(userId string, req dto.VendorProfileRequest) (map[string]interface{}, error)
	GetAllVendors(params filter.BaseParams) ([]map[string]interface{}, int64, error)
	UpdateVendorStatus(vendorId string, status string) (domainvendors.Vendor, error)
	DeleteVendor(vendorId string) error

	// Vendor profile file operations
	UploadVendorProfileFile(ctx context.Context, vendorId string, userId string, file *multipart.FileHeader, req dto.UploadVendorProfileFileRequest) (domainvendors.VendorProfileFile, error)
	DeleteVendorProfileFile(ctx context.Context, fileId string) error
}
