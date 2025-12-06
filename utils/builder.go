package utils

import (
	"fmt"
	"strings"
	domainvendors "vendor-management-system/internal/domain/vendors"
)

func BuildVendorProfileFilename(vendor domainvendors.Vendor, profile domainvendors.VendorProfile) string {
	nameCandidate := strings.TrimSpace(vendor.VendorCode)
	if nameCandidate == "" {
		nameCandidate = strings.TrimSpace(profile.VendorName)
	}
	if nameCandidate == "" {
		nameCandidate = vendor.Id
	}

	safe := strings.Builder{}
	for _, r := range nameCandidate {
		switch {
		case r >= 'a' && r <= 'z':
			safe.WriteRune(r)
		case r >= 'A' && r <= 'Z':
			safe.WriteRune(r + 32)
		case r >= '0' && r <= '9':
			safe.WriteRune(r)
		case r == '-' || r == '_':
			safe.WriteRune(r)
		default:
			safe.WriteRune('_')
		}
	}

	safeName := strings.Trim(safe.String(), "_")
	if safeName == "" {
		safeName = "vendor"
	}

	return fmt.Sprintf("vendor_profile_%s.xlsx", safeName)
}
