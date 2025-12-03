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

	params, _ := filter.GetBaseParams(ctx, "created_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"status"})
	params.Filters["vendor_id"] = vendor.Id

	data, totalData, err := h.Service.GetAllPayments(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetAllPayments; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerPayment) GetMyPaymentByID(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][GetMyPaymentByID]", logId)

	id, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	// Get vendor by user ID
	vendor, err := h.VendorRepo.GetVendorByUserID(userId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetVendorByUserID; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = "vendor profile not found"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	// Get payment
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

	// Verify payment belongs to this vendor
	if data.VendorID != vendor.Id {
		res := response.Response(http.StatusForbidden, messages.MsgFail, logId, nil)
		res.Error = "you don't have access to this payment"
		ctx.JSON(http.StatusForbidden, res)
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

func (h *HandlerPayment) UploadPaymentFile(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][UploadPaymentFile]", logId)

	paymentId := ctx.Param("id")
	if paymentId == "" {
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = "payment id is required"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])

	// Get file from form
	file, err := ctx.FormFile("file")
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; FormFile ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = "file is required"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	// Get file type and caption from form
	fileType := ctx.PostForm("file_type")
	if fileType == "" {
		fileType = "proof" // default
	}
	caption := ctx.PostForm("caption")

	req := dto.UploadPaymentFileRequest{
		FileType: fileType,
		Caption:  caption,
	}

	data, err := h.Service.UploadPaymentFile(ctx.Request.Context(), paymentId, userId, file, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UploadPaymentFile; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusCreated, "File uploaded successfully", logId, data)
	ctx.JSON(http.StatusCreated, res)
}

func (h *HandlerPayment) DeletePaymentFile(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][PaymentHandler][DeletePaymentFile]", logId)

	fileId := ctx.Param("file_id")
	if fileId == "" {
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = "file id is required"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	if err := h.Service.DeletePaymentFile(ctx.Request.Context(), fileId); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeletePaymentFile; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "file not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "File deleted successfully", logId, nil)
	ctx.JSON(http.StatusOK, res)
}
