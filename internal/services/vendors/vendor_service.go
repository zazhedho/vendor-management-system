package servicevendors

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"time"
	domainvendors "vendor-management-system/internal/domain/vendors"
	"vendor-management-system/internal/dto"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/pkg/storage"
	"vendor-management-system/utils"

	"gorm.io/gorm"
)

type ServiceVendor struct {
	VendorRepo      interfacevendors.RepoVendorInterface
	StorageProvider storage.StorageProvider
}

func NewVendorService(vendorRepo interfacevendors.RepoVendorInterface, storageProvider storage.StorageProvider) *ServiceVendor {
	return &ServiceVendor{
		VendorRepo:      vendorRepo,
		StorageProvider: storageProvider,
	}
}

func (s *ServiceVendor) GetVendorByUserID(userId string) (map[string]interface{}, error) {
	vendor, err := s.VendorRepo.GetVendorByUserID(userId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("vendor not found")
		}
		return nil, err
	}

	profile, err := s.VendorRepo.GetVendorProfileByVendorID(vendor.Id)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	result := map[string]interface{}{
		"vendor":  vendor,
		"profile": nil,
	}

	if profile.Id != "" {
		result["profile"] = profile
	}

	return result, nil
}

func (s *ServiceVendor) GetVendorProfileByVendorID(vendorId string) (domainvendors.VendorProfile, error) {
	return s.VendorRepo.GetVendorProfileByVendorID(vendorId)
}

func (s *ServiceVendor) GetVendorDetailByVendorID(vendorId string) (map[string]interface{}, error) {
	vendor, err := s.VendorRepo.GetVendorByID(vendorId)
	if err != nil {
		return nil, err
	}

	profile, err := s.VendorRepo.GetVendorProfileByVendorID(vendorId)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	result := map[string]interface{}{
		"vendor":  vendor,
		"profile": nil,
	}

	if profile.Id != "" {
		result["profile"] = profile
	}

	return result, nil
}

func (s *ServiceVendor) CreateOrUpdateVendorProfile(userId string, req dto.VendorProfileRequest) (map[string]interface{}, error) {
	vendor, err := s.VendorRepo.GetVendorByUserID(userId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create vendor if not exists - vendor_type will be set later or default to empty
			now := time.Now()
			vendor = domainvendors.Vendor{
				Id:        utils.CreateUUID(),
				UserId:    userId,
				Status:    utils.VendorPending,
				CreatedAt: now,
				CreatedBy: userId,
				UpdatedAt: now,
				UpdatedBy: userId,
			}
			if err := s.VendorRepo.CreateVendor(vendor); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	profile, err := s.VendorRepo.GetVendorProfileByVendorID(vendor.Id)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	now := time.Now()
	if profile.Id == "" {
		profile = domainvendors.VendorProfile{
			Id:                utils.CreateUUID(),
			VendorId:          vendor.Id,
			VendorName:        req.VendorName,
			Email:             req.Email,
			Telephone:         req.Telephone,
			Fax:               req.Fax,
			Phone:             req.Phone,
			DistrictId:        req.DistrictId,
			DistrictName:      req.DistrictName,
			CityId:            req.CityId,
			CityName:          req.CityName,
			ProvinceId:        req.ProvinceId,
			ProvinceName:      req.ProvinceName,
			PostalCode:        req.PostalCode,
			Address:           req.Address,
			BusinessField:     req.BusinessField,
			KTPNumber:         req.KtpNumber,
			KTPName:           req.KtpName,
			NpwpNumber:        req.NpwpNumber,
			NpwpName:          req.NpwpName,
			NpwpAddress:       req.NpwpAddress,
			BankName:          req.BankName,
			AccountNumber:     req.BankAccountNumber,
			AccountHolderName: req.BankAccountName,
			CreatedAt:         now,
			CreatedBy:         userId,
			UpdatedAt:         now,
			UpdatedBy:         userId,
		}
		if err := s.VendorRepo.CreateVendorProfile(profile); err != nil {
			return nil, err
		}
	} else {
		profile.VendorName = req.VendorName
		profile.Email = req.Email
		profile.Telephone = req.Telephone
		profile.Fax = req.Fax
		profile.Phone = req.Phone
		profile.DistrictId = req.DistrictId
		profile.DistrictName = req.DistrictName
		profile.CityId = req.CityId
		profile.CityName = req.CityName
		profile.ProvinceId = req.ProvinceId
		profile.ProvinceName = req.ProvinceName
		profile.PostalCode = req.PostalCode
		profile.Address = req.Address
		profile.BusinessField = req.BusinessField
		profile.KTPNumber = req.KtpNumber
		profile.KTPName = req.KtpName
		profile.NpwpNumber = req.NpwpNumber
		profile.NpwpName = req.NpwpName
		profile.NpwpAddress = req.NpwpAddress
		profile.BankName = req.BankName
		profile.AccountNumber = req.BankAccountNumber
		profile.AccountHolderName = req.BankAccountName
		profile.UpdatedAt = now
		profile.UpdatedBy = userId

		if err := s.VendorRepo.UpdateVendorProfile(profile); err != nil {
			return nil, err
		}
	}

	return map[string]interface{}{
		"vendor":  vendor,
		"profile": profile,
	}, nil
}

func (s *ServiceVendor) GetAllVendors(params filter.BaseParams) ([]map[string]interface{}, int64, error) {
	vendors, total, err := s.VendorRepo.GetAllVendors(params)
	if err != nil {
		return nil, 0, err
	}

	result := make([]map[string]interface{}, 0)
	for _, vendor := range vendors {
		profile, _ := s.VendorRepo.GetVendorProfileByVendorID(vendor.Id)

		vendorData := map[string]interface{}{
			"vendor":  vendor,
			"profile": nil,
		}

		if profile.Id != "" {
			vendorData["profile"] = profile
		}

		result = append(result, vendorData)
	}

	return result, total, nil
}

func (s *ServiceVendor) UpdateVendorStatus(vendorId string, status string) (domainvendors.Vendor, error) {
	vendor, err := s.VendorRepo.GetVendorByID(vendorId)
	if err != nil {
		return domainvendors.Vendor{}, err
	}

	vendor.Status = status
	now := time.Now()
	vendor.UpdatedAt = now

	if err := s.VendorRepo.UpdateVendor(vendor); err != nil {
		return domainvendors.Vendor{}, err
	}

	return vendor, nil
}

func (s *ServiceVendor) DeleteVendor(vendorId string) error {
	vendor, err := s.VendorRepo.GetVendorByID(vendorId)
	if err != nil {
		return err
	}

	profile, err := s.VendorRepo.GetVendorProfileByVendorID(vendor.Id)
	if err == nil && profile.Id != "" {
		if err := s.VendorRepo.DeleteVendorProfile(profile.Id); err != nil {
			return err
		}
	}

	return s.VendorRepo.DeleteVendor(vendorId)
}

func (s *ServiceVendor) UploadVendorProfileFile(ctx context.Context, profileId string, userId string, fileHeader *multipart.FileHeader, req dto.UploadVendorProfileFileRequest) (domainvendors.VendorProfileFile, error) {
	// Verify vendor profile exists
	profile, err := s.VendorRepo.GetVendorProfileByID(profileId)
	if err != nil {
		return domainvendors.VendorProfileFile{}, errors.New("vendor profile not found")
	}

	// Validate file size
	maxPhotoSize := utils.GetEnv("MAX_PHOTO_SIZE_VENDOR", 5).(int)
	if err := utils.ValidateFileSize(fileHeader, maxPhotoSize); err != nil {
		return domainvendors.VendorProfileFile{}, err
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		return domainvendors.VendorProfileFile{}, fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
	}
	defer file.Close()

	// Upload to storage provider (MinIO or R2)
	fileUrl, err := s.StorageProvider.UploadFile(ctx, file, fileHeader, "vendor-profile-files")
	if err != nil {
		return domainvendors.VendorProfileFile{}, fmt.Errorf("failed to upload file %s to storage: %w", fileHeader.Filename, err)
	}

	// Parse dates if provided
	var issuedAt, expiredAt *time.Time
	if req.IssuedAt != "" {
		t, err := time.Parse("2006-01-02", req.IssuedAt)
		if err != nil {
			_ = s.StorageProvider.DeleteFile(ctx, fileUrl)
			return domainvendors.VendorProfileFile{}, errors.New("invalid issued_at format, use YYYY-MM-DD")
		}
		issuedAt = &t
	}

	if req.ExpiredAt != "" {
		t, err := time.Parse("2006-01-02", req.ExpiredAt)
		if err != nil {
			_ = s.StorageProvider.DeleteFile(ctx, fileUrl)
			return domainvendors.VendorProfileFile{}, errors.New("invalid expired_at format, use YYYY-MM-DD")
		}
		expiredAt = &t
	}

	now := time.Now()
	vendorFile := domainvendors.VendorProfileFile{
		ID:              utils.CreateUUID(),
		VendorProfileId: profile.Id,
		FileType:        req.FileType,
		FileURL:         fileUrl,
		IssuedAt:        issuedAt,
		ExpiredAt:       expiredAt,
		Status:          utils.VendorDocPending,
		CreatedAt:       now,
		CreatedBy:       userId,
	}

	if err := s.VendorRepo.CreateVendorProfileFile(vendorFile); err != nil {
		// Cleanup uploaded file if database save fails
		_ = s.StorageProvider.DeleteFile(ctx, fileUrl)
		return domainvendors.VendorProfileFile{}, err
	}

	return vendorFile, nil
}

func (s *ServiceVendor) DeleteVendorProfileFile(ctx context.Context, fileId string) error {
	// Get file record to get the URL for storage deletion
	vendorFile, err := s.VendorRepo.GetVendorProfileFileByID(fileId)
	if err != nil {
		return err
	}

	// Delete from database first
	if err = s.VendorRepo.DeleteVendorProfileFile(fileId); err == nil {
		// Delete from storage if database deletion succeeds
		_ = s.StorageProvider.DeleteFile(ctx, vendorFile.FileURL)
	}

	return err
}

func (s *ServiceVendor) UpdateVendorProfileFileStatus(fileId string, req dto.UpdateVendorProfileFileStatusRequest, userId string) (domainvendors.VendorProfileFile, error) {
	// Validate status
	validStatuses := map[string]bool{
		utils.VendorDocPending:  true,
		utils.VendorDocApproved: true,
		utils.VendorDocReject:   true,
	}
	if !validStatuses[req.Status] {
		return domainvendors.VendorProfileFile{}, fmt.Errorf("invalid status: %s. Valid statuses: pending, approved, rejected", req.Status)
	}

	// Get file record
	vendorFile, err := s.VendorRepo.GetVendorProfileFileByID(fileId)
	if err != nil {
		return domainvendors.VendorProfileFile{}, errors.New("file not found")
	}

	// Update status
	now := time.Now()
	vendorFile.Status = req.Status
	vendorFile.VerifiedAt = &now
	vendorFile.VerifiedBy = &userId
	if vendorFile.Status == utils.VendorDocReject {
		vendorFile.RejectReason = &req.Reason
	}

	if err := s.VendorRepo.UpdateVendorProfileFile(vendorFile); err != nil {
		return domainvendors.VendorProfileFile{}, err
	}

	return vendorFile, nil
}

var _ interfacevendors.ServiceVendorInterface = (*ServiceVendor)(nil)
