package handlerpayments

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"

	"vendor-management-system/internal/dto"
	interfacepayments "vendor-management-system/internal/interfaces/payments"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/pkg/logger"
	"vendor-management-system/pkg/messages"
	"vendor-management-system/pkg/response"
	"vendor-management-system/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HandlerPayment struct {
	Service    interfacepayments.ServicePaymentInterface
	VendorRepo interfacevendors.RepoVendorInterface
}

func NewPaymentHandler(s interfacepayments.ServicePaymentInterface, vendorRepo interfacevendors.RepoVendorInterface) *HandlerPayment {
	return &HandlerPayment{
		Service:    s,
		VendorRepo: vendorRepo,
	}
}

func (h *HandlerPayment) CreatePayment(ctx *gin.Context) {
	var req dto.CreatePaymentRequest
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][CreatePayment]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.CreatePayment(req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.CreatePayment; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusCreated, "Payment created successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

func (h *HandlerPayment) GetPaymentByID(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][GetPaymentByID]", logId)

	id, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetPaymentByID(id)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetPaymentByID; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "payment not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "success", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerPayment) GetAllPayments(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][GetAllPayments]", logId)

	params, _ := filter.GetBaseParams(ctx, "created_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"status", "vendor_id"})

	payments, totalData, err := h.Service.GetAllPayments(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetAllPayments; ERROR: %+v;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, payments)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerPayment) GetMyPayments(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][GetMyPayments]", logId)

	vendor, err := h.VendorRepo.GetVendorByUserID(userId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetVendorByUserID; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = "vendor profile not found"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.GetPaymentsByVendorID(vendor.Id)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetPaymentsByVendorID; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "success", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerPayment) UpdatePayment(ctx *gin.Context) {
	var req dto.UpdatePaymentRequest
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][UpdatePayment]", logId)

	id, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.UpdatePayment(id, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UpdatePayment; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "payment not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusOK, "Payment updated successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerPayment) UpdatePaymentStatus(ctx *gin.Context) {
	var req dto.UpdatePaymentStatusRequest
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][UpdatePaymentStatus]", logId)

	id, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.UpdatePaymentStatus(id, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UpdatePaymentStatus; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "payment not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusOK, "Payment status updated successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerPayment) DeletePayment(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][DeletePayment]", logId)

	id, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	if err := h.Service.DeletePayment(id); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeletePayment; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "payment not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Payment deleted successfully", logId, nil)
	ctx.JSON(http.StatusOK, res)
}
