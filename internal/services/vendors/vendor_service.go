package servicevendors

import (
	"errors"
	"time"
	domainvendors "vendor-management-system/internal/domain/vendors"
	"vendor-management-system/internal/dto"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/utils"

	"gorm.io/gorm"
)

type ServiceVendor struct {
	VendorRepo interfacevendors.RepoVendorInterface
}

func NewVendorService(vendorRepo interfacevendors.RepoVendorInterface) *ServiceVendor {
	return &ServiceVendor{
		VendorRepo: vendorRepo,
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

func (s *ServiceVendor) CreateOrUpdateVendorProfile(userId string, req dto.VendorProfileRequest) (map[string]interface{}, error) {
	vendor, err := s.VendorRepo.GetVendorByUserID(userId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			vendorType := "perusahaan"
			if req.VendorType != "" {
				vendorType = req.VendorType
			}
			vendor = domainvendors.Vendor{
				Id:         utils.CreateUUID(),
				UserId:     userId,
				VendorType: vendorType,
				Status:     "pending",
				CreatedAt:  time.Now(),
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
			Phone:             req.Telephone,
			Fax:               req.Fax,
			Mobile:            utils.NormalizePhoneTo62(req.Mobile),
			Province:          req.Province,
			City:              req.City,
			District:          req.District,
			Address:           req.Address,
			BusinessField:     req.BusinessField,
			NpwpNumber:        req.NpwpNumber,
			NpwpName:          req.NpwpName,
			NpwpAddress:       req.NpwpAddress,
			NpwpFilePath:      req.NpwpFilePath,
			BankName:          req.BankName,
			BankBranch:        req.BankBranch,
			AccountNumber:     req.AccountNumber,
			AccountHolderName: req.AccountHolderName,
			BankBookFilePath:  req.BankBookFilePath,
			TransactionType:   req.TransactionType,
			PurchGroup:        req.PurchGroup,
			RegionOrSo:        req.RegionOrSo,
			Nik:               req.NIK,
			KtpFilePath:       req.KtpFilePath,
			CreatedAt:         now,
		}
		if err := s.VendorRepo.CreateVendorProfile(profile); err != nil {
			return nil, err
		}
	} else {
		profile.VendorName = req.VendorName
		profile.Email = req.Email
		profile.Phone = req.Telephone
		profile.Fax = req.Fax
		profile.Mobile = utils.NormalizePhoneTo62(req.Mobile)
		profile.Province = req.Province
		profile.City = req.City
		profile.District = req.District
		profile.Address = req.Address
		profile.BusinessField = req.BusinessField
		profile.NpwpNumber = req.NpwpNumber
		profile.NpwpName = req.NpwpName
		profile.NpwpAddress = req.NpwpAddress
		if req.NpwpFilePath != "" {
			profile.NpwpFilePath = req.NpwpFilePath
		}
		profile.BankName = req.BankName
		profile.BankBranch = req.BankBranch
		profile.AccountNumber = req.AccountNumber
		profile.AccountHolderName = req.AccountHolderName
		if req.BankBookFilePath != "" {
			profile.BankBookFilePath = req.BankBookFilePath
		}
		profile.TransactionType = req.TransactionType
		profile.PurchGroup = req.PurchGroup
		profile.RegionOrSo = req.RegionOrSo
		profile.Nik = req.NIK
		if req.KtpFilePath != "" {
			profile.KtpFilePath = req.KtpFilePath
		}
		profile.UpdatedAt = &now

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
	vendor.UpdatedAt = &now

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

var _ interfacevendors.ServiceVendorInterface = (*ServiceVendor)(nil)
