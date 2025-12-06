package interfacenotification

import (
	domainnotification "vendor-management-system/internal/domain/notification"
	"vendor-management-system/pkg/filter"
)

type ServiceNotificationInterface interface {
	CreateForAll(title, message, notifType, refType, refID string) error
	CreateForUser(userId, title, message, notifType, refType, refID string) error
	GetUserNotifications(userId string, params filter.BaseParams, isRead *bool) ([]domainnotification.Notification, int64, error)
	MarkAllRead(userId string) error
	MarkReadByIDs(userId string, ids []string) error
}
