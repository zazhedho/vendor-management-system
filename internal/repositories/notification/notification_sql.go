package reponotification

import (
	"vendor-management-system/pkg/filter"
	"vendor-management-system/utils"

	domainnotification "vendor-management-system/internal/domain/notification"
	interfacenotification "vendor-management-system/internal/interfaces/notification"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type repo struct {
	DB *gorm.DB
}

func NewNotificationRepo(db *gorm.DB) interfacenotification.RepoNotificationInterface {
	return &repo{DB: db}
}

func (r *repo) Create(notification domainnotification.Notification) error {
	return r.DB.Create(&notification).Error
}

func (r *repo) GetByUser(userId string, params filter.BaseParams, isRead *bool) ([]domainnotification.Notification, int64, error) {
	query := r.DB.Model(&domainnotification.Notification{}).Where("user_id = ? OR user_id IS NULL", userId)
	// When filtering by isRead, apply logic for personal vs broadcast with read receipts
	if isRead != nil {
		readCondition := "(user_id = ? AND is_read = TRUE) OR (user_id IS NULL AND EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = notifications.id AND nr.user_id = ?))"
		unreadCondition := "(user_id = ? AND is_read = FALSE) OR (user_id IS NULL AND NOT EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = notifications.id AND nr.user_id = ?))"
		if *isRead {
			query = query.Where(readCondition, userId, userId)
		} else {
			query = query.Where(unreadCondition, userId, userId)
		}
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy == "" {
		params.OrderBy = "created_at"
	}
	if params.OrderDirection == "" {
		params.OrderDirection = "desc"
	}

	var notifications []domainnotification.Notification
	if err := query.Order(params.OrderBy + " " + params.OrderDirection).
		Offset(params.Offset).Limit(params.Limit).
		Find(&notifications).Error; err != nil {
		return nil, 0, err
	}

	// Resolve read status with per-user reads for broadcast
	ids := make([]string, 0, len(notifications))
	for _, n := range notifications {
		ids = append(ids, n.ID)
	}
	readMap, err := r.GetReadMap(userId, ids)
	if err != nil {
		return nil, 0, err
	}

	for i := range notifications {
		if notifications[i].UserID == nil {
			notifications[i].IsRead = readMap[notifications[i].ID]
		}
	}

	return notifications, total, nil
}

func (r *repo) MarkAllRead(userId string) error {
	// Mark personal notifications
	if err := r.DB.Model(&domainnotification.Notification{}).
		Where("user_id = ?", userId).
		Update("is_read", true).Error; err != nil {
		return err
	}

	// Insert read entries for broadcast notifications
	return r.addReadsForBroadcast(userId, nil)
}

func (r *repo) MarkReadByIDs(userId string, ids []string) error {
	var notifications []domainnotification.Notification
	if err := r.DB.Where("id IN ? AND (user_id = ? OR user_id IS NULL)", ids, userId).Find(&notifications).Error; err != nil {
		return err
	}

	personalIDs := make([]string, 0)
	broadcastIDs := make([]string, 0)
	for _, n := range notifications {
		if n.UserID != nil {
			personalIDs = append(personalIDs, n.ID)
		} else {
			broadcastIDs = append(broadcastIDs, n.ID)
		}
	}

	if len(personalIDs) > 0 {
		if err := r.DB.Model(&domainnotification.Notification{}).
			Where("user_id = ? AND id IN ?", userId, personalIDs).
			Update("is_read", true).Error; err != nil {
			return err
		}
	}

	if len(broadcastIDs) > 0 {
		return r.addReadsForBroadcast(userId, broadcastIDs)
	}

	return nil
}

func (r *repo) addReadsForBroadcast(userId string, broadcastIDs []string) error {
	// If broadcastIDs nil, insert for all broadcast notifications
	query := r.DB.Table("notifications").Select("id").Where("user_id IS NULL")
	if len(broadcastIDs) > 0 {
		query = query.Where("id IN ?", broadcastIDs)
	}

	var ids []string
	if err := query.Find(&ids).Error; err != nil {
		return err
	}
	if len(ids) == 0 {
		return nil
	}

	// Bulk insert with ON CONFLICT DO NOTHING
	rows := make([]map[string]interface{}, 0, len(ids))
	for _, id := range ids {
		rows = append(rows, map[string]interface{}{
			"id":              utils.CreateUUID(),
			"notification_id": id,
			"user_id":         userId,
		})
	}

	return r.DB.Table("notification_reads").
		Clauses(clause.OnConflict{DoNothing: true}).
		Create(rows).Error
}

func (r *repo) GetReadMap(userId string, notifIDs []string) (map[string]bool, error) {
	if len(notifIDs) == 0 {
		return map[string]bool{}, nil
	}
	type Row struct {
		NotificationID string
	}
	rows := make([]Row, 0)
	if err := r.DB.Table("notification_reads").
		Select("notification_id").
		Where("user_id = ? AND notification_id IN ?", userId, notifIDs).
		Find(&rows).Error; err != nil {
		return nil, err
	}

	m := make(map[string]bool, len(rows))
	for _, row := range rows {
		m[row.NotificationID] = true
	}
	return m, nil
}

var _ interfacenotification.RepoNotificationInterface = (*repo)(nil)
