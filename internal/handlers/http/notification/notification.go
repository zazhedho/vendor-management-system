package notificationhandler

import (
	"fmt"
	"net/http"
	"vendor-management-system/internal/dto"
	interfacenotification "vendor-management-system/internal/interfaces/notification"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/pkg/logger"
	"vendor-management-system/pkg/messages"
	"vendor-management-system/pkg/response"
	"vendor-management-system/utils"

	"github.com/gin-gonic/gin"
)

type HandlerNotification struct {
	Service interfacenotification.ServiceNotificationInterface
}

func NewNotificationHandler(s interfacenotification.ServiceNotificationInterface) *HandlerNotification {
	return &HandlerNotification{
		Service: s,
	}
}

func (h *HandlerNotification) GetNotifications(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][NotificationHandler][GetNotifications]", logId)

	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	params, _ := filter.GetBaseParams(ctx, "created_at", "desc", 10)

	var isRead *bool
	if val := ctx.Query("is_read"); val != "" {
		if val == "true" {
			tmp := true
			isRead = &tmp
		} else if val == "false" {
			tmp := false
			isRead = &tmp
		}
	}

	data, total, err := h.Service.GetUserNotifications(userId, params, isRead)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetUserNotifications ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(total), params.Page, params.Limit, logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerNotification) MarkRead(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][NotificationHandler][MarkRead]", logId)

	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	var req dto.MarkNotificationsReadRequest
	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	var err error
	if len(req.IDs) == 0 {
		err = h.Service.MarkAllRead(userId)
	} else {
		err = h.Service.MarkReadByIDs(userId, req.IDs)
	}

	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.MarkRead ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Notifications updated", logId, nil)
	ctx.JSON(http.StatusOK, res)
}
