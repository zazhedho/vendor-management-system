package interfacenotification

import (
	domainnotification "vendor-management-system/internal/domain/notification"
	"vendor-management-system/pkg/filter"
)

type RepoNotificationInterface interface {
	Create(notification domainnotification.Notification) error
	GetByUser(userId string, params filter.BaseParams, isRead *bool) ([]domainnotification.Notification, int64, error)
	MarkAllRead(userId string) error
	MarkReadByIDs(userId string, ids []string) error
	GetReadMap(userId string, notifIDs []string) (map[string]bool, error)
}
