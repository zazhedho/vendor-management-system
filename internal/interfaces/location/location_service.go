package interfacelocation

import domainlocation "vendor-management-system/internal/domain/location"

type ServiceLocationInterface interface {
	GetProvince(year string) ([]domainlocation.Location, error)
	GetCity(year, lvl, pro string) ([]domainlocation.Location, error)
	GetDistrict(year, lvl, pro, kab string) ([]domainlocation.Location, error)
}
