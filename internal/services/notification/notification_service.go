package servicenotification

import (
	"errors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/utils"

	domainnotification "vendor-management-system/internal/domain/notification"
	interfacenotification "vendor-management-system/internal/interfaces/notification"
)

type ServiceNotification struct {
	NotificationRepo interfacenotification.RepoNotificationInterface
}

func NewNotificationService(repo interfacenotification.RepoNotificationInterface) *ServiceNotification {
	return &ServiceNotification{
		NotificationRepo: repo,
	}
}

func (s *ServiceNotification) CreateForAll(title, message, notifType, refType, refID string) error {
	if title == "" || message == "" {
		return errors.New("title and message are required")
	}

	notif := domainnotification.Notification{
		ID:            utils.CreateUUID(),
		Title:         title,
		Message:       message,
		Type:          notifType,
		ReferenceType: refType,
		ReferenceID:   refID,
	}
	return s.NotificationRepo.Create(notif)
}

func (s *ServiceNotification) CreateForUser(userId, title, message, notifType, refType, refID string) error {
	if userId == "" || title == "" || message == "" {
		return errors.New("userId, title and message are required")
	}

	notif := domainnotification.Notification{
		ID:            utils.CreateUUID(),
		UserID:        &userId,
		Title:         title,
		Message:       message,
		Type:          notifType,
		ReferenceType: refType,
		ReferenceID:   refID,
	}
	return s.NotificationRepo.Create(notif)
}

func (s *ServiceNotification) GetUserNotifications(userId string, params filter.BaseParams, isRead *bool) ([]domainnotification.Notification, int64, error) {
	return s.NotificationRepo.GetByUser(userId, params, isRead)
}

func (s *ServiceNotification) MarkAllRead(userId string) error {
	return s.NotificationRepo.MarkAllRead(userId)
}

func (s *ServiceNotification) MarkReadByIDs(userId string, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	return s.NotificationRepo.MarkReadByIDs(userId, ids)
}

var _ interfacenotification.ServiceNotificationInterface = (*ServiceNotification)(nil)
