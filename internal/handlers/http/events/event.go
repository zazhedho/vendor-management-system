package handlerevents

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"strconv"

	domainevents "vendor-management-system/internal/domain/events"
	"vendor-management-system/internal/dto"
	interfaceevents "vendor-management-system/internal/interfaces/events"
	interfacevendors "vendor-management-system/internal/interfaces/vendors"
	"vendor-management-system/pkg/filter"
	"vendor-management-system/pkg/logger"
	"vendor-management-system/pkg/messages"
	"vendor-management-system/pkg/response"
	"vendor-management-system/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HandlerEvent struct {
	Service    interfaceevents.ServiceEventInterface
	VendorRepo interfacevendors.RepoVendorInterface
}

func NewEventHandler(s interfaceevents.ServiceEventInterface, vendorRepo interfacevendors.RepoVendorInterface) *HandlerEvent {
	return &HandlerEvent{
		Service:    s,
		VendorRepo: vendorRepo,
	}
}

func (h *HandlerEvent) CreateEvent(ctx *gin.Context) {
	var req dto.CreateEventRequest
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][CreateEvent]", logId)

	if err := ctx.BindJSON(&req); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; BindJSON ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = utils.ValidateError(err, reflect.TypeOf(req), "json")
		ctx.JSON(http.StatusBadRequest, res)
		return
	}
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Request: %+v;", logPrefix, utils.JsonEncode(req)))

	data, err := h.Service.CreateEvent(userId, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.CreateEvent; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusCreated, "Event created successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusCreated, res)
}

func (h *HandlerEvent) GetEventByID(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userRole := utils.InterfaceString(authData["role"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][GetEventByID]", logId)

	id, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetEventByID(id)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetEventByID; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "event not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	// Block draft events for vendors
	if userRole == "vendor" && data.Status == "draft" {
		res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
		res.Error = response.Errors{Code: http.StatusNotFound, Message: "event not found"}
		ctx.JSON(http.StatusNotFound, res)
		return
	}

	res := response.Response(http.StatusOK, "success", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) GetAllEvents(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userRole := utils.InterfaceString(authData["role"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][GetAllEvents]", logId)

	params, _ := filter.GetBaseParams(ctx, "created_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"status", "category"})

	events, totalData, err := h.Service.GetAllEvents(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetAllEvents; ERROR: %+v;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	// Filter out draft events for vendors
	if userRole == "vendor" {
		var filteredEvents []domainevents.Event
		for _, event := range events {
			if event.Status != utils.EventDraft {
				filteredEvents = append(filteredEvents, event)
			}
		}
		events = filteredEvents
		totalData = int64(len(filteredEvents))
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, events)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) UpdateEvent(ctx *gin.Context) {
	var req dto.UpdateEventRequest
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][UpdateEvent]", logId)

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

	data, err := h.Service.UpdateEvent(id, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UpdateEvent; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "event not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusOK, "Event updated successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) DeleteEvent(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][DeleteEvent]", logId)

	id, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	if err := h.Service.DeleteEvent(id); err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeleteEvent; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "event not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Event deleted successfully", logId, nil)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) SubmitPitch(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][SubmitPitch]", logId)

	eventId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	// Get proposal details from form
	proposalDetails := ctx.PostForm("proposal_details")
	if proposalDetails == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; proposal_details is required", logPrefix))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = "proposal_details is required"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	// Get file from multipart form
	file, err := ctx.FormFile("file")
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; FormFile ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, "File is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	// Get file metadata from form
	fileType := ctx.PostForm("file_type")
	caption := ctx.PostForm("caption")

	vendor, err := h.VendorRepo.GetVendorByUserID(userId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetVendorByUserID; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = "vendor profile not found"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	// Validate vendor status is active
	if vendor.Status != utils.VendorActive {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Vendor status is not active: %s;", logPrefix, vendor.Status))
		res := response.Response(http.StatusForbidden, messages.MsgFail, logId, nil)
		res.Error = "only vendors with active status can submit pitches"
		ctx.JSON(http.StatusForbidden, res)
		return
	}

	// Create DTO request
	req := dto.SubmitPitchRequest{
		ProposalDetails: proposalDetails,
	}

	// Submit pitch with file
	data, err := h.Service.SubmitPitchWithFile(ctx.Request.Context(), eventId, vendor.Id, req, file, fileType, caption)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.SubmitPitchWithFile; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusOK, "Pitch submitted successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Response: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) GetSubmissionsByEventID(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][GetSubmissionsByEventID]", logId)

	eventId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	params, _ := filter.GetBaseParams(ctx, "created_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"is_shortlisted", "is_winner"})
	params.Filters["event_id"] = eventId

	data, totalData, err := h.Service.GetSubmissionsByEventIDPaginated(eventId, params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetSubmissionsByEventID; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) GetAllSubmissions(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][GetAllSubmissions]", logId)

	params, _ := filter.GetBaseParams(ctx, "created_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"event_id", "vendor_id", "is_shortlisted", "is_winner"})

	data, totalData, err := h.Service.GetAllSubmissions(params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetAllSubmissions; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) GetGroupedSubmissions(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][GetGroupedSubmissions]", logId)

	params, _ := filter.GetBaseParams(ctx, "created_at", "desc", 10)

	submissionPage := 1
	if page := ctx.Query("submission_page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			submissionPage = p
		}
	}

	submissionLimit := 10
	if limit := ctx.Query("submission_limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			submissionLimit = l
		}
	}

	data, err := h.Service.GetGroupedSubmissions(params, submissionPage, submissionLimit)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetGroupedSubmissions; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, messages.MsgSuccess, logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) GetMySubmissions(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][GetMySubmissions]", logId)

	params, _ := filter.GetBaseParams(ctx, "updated_at", "desc", 10)
	params.Filters = filter.WhitelistFilter(params.Filters, []string{"event_id", "is_shortlisted", "is_winner"})

	vendor, err := h.VendorRepo.GetVendorByUserID(userId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetVendorByUserID; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = "vendor profile not found"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, totalData, err := h.Service.GetMySubmissions(vendor.Id, params)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetMySubmissions; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.PaginationResponse(http.StatusOK, int(totalData), params.Page, params.Limit, logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) ScoreSubmission(ctx *gin.Context) {
	var req dto.ScoreSubmissionRequest
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][ScoreSubmission]", logId)

	submissionId, err := utils.ValidateUUID(ctx, logId)
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

	data, err := h.Service.ScoreSubmission(submissionId, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.ScoreSubmission; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "submission not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusOK, "Submission scored successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) ShortlistSubmission(ctx *gin.Context) {
	var req dto.ShortlistSubmissionRequest
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][ShortlistSubmission]", logId)

	submissionId, err := utils.ValidateUUID(ctx, logId)
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

	data, err := h.Service.ShortlistSubmission(submissionId, req.IsShortlisted)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.ShortlistSubmission; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "submission not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusOK, "Submission shortlist updated successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) SelectWinner(ctx *gin.Context) {
	var req dto.SelectWinnerRequest
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][SelectWinner]", logId)

	eventId, err := utils.ValidateUUID(ctx, logId)
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

	data, err := h.Service.SelectWinner(eventId, req.SubmissionID)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.SelectWinner; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "event or submission not found"}
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	res := response.Response(http.StatusOK, "Winner selected successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) GetEventResult(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][GetEventResult]", logId)

	eventId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	vendor, err := h.VendorRepo.GetVendorByUserID(userId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; GetVendorByUserID; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusBadRequest, messages.MsgFail, logId, nil)
		res.Error = "vendor profile not found"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	data, err := h.Service.GetEventResult(eventId, vendor.Id)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetEventResult; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "event not found"}
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

func (h *HandlerEvent) GetEventResultForAdmin(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][GetEventResultForAdmin]", logId)

	eventId, err := utils.ValidateUUID(ctx, logId)
	if err != nil {
		return
	}

	data, err := h.Service.GetEventResultForAdmin(eventId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetEventResultForAdmin; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = response.Errors{Code: http.StatusNotFound, Message: "event not found"}
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

func (h *HandlerEvent) UploadEventFile(ctx *gin.Context) {
	authData := utils.GetAuthData(ctx)
	userId := utils.InterfaceString(authData["user_id"])
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][UploadEventFile]", logId)

	eventId := ctx.Param("id")
	if eventId == "" {
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = "event id is required"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	file, err := ctx.FormFile("file")
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; FormFile ERROR: %s;", logPrefix, err.Error()))
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = "file is required"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	fileType := ctx.PostForm("file_type")
	if fileType == "" {
		fileType = "document"
	}
	caption := ctx.PostForm("caption")

	req := dto.UploadEventFileRequest{
		FileType: fileType,
		Caption:  caption,
	}

	data, err := h.Service.UploadEventFile(ctx.Request.Context(), eventId, userId, file, req)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.UploadEventFile; ERROR: %s;", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "file uploaded successfully", logId, data)
	ctx.JSON(http.StatusOK, res)
}

func (h *HandlerEvent) DeleteEventFile(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][EventHandler][DeleteEventFile]", logId)

	fileId := ctx.Param("fileId")
	if fileId == "" {
		res := response.Response(http.StatusBadRequest, messages.InvalidRequest, logId, nil)
		res.Error = "file id is required"
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	err := h.Service.DeleteEventFile(ctx.Request.Context(), fileId)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.DeleteEventFile; ERROR: %s;", logPrefix, err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			res := response.Response(http.StatusNotFound, messages.MsgNotFound, logId, nil)
			res.Error = "file not found"
			ctx.JSON(http.StatusNotFound, res)
			return
		}
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "file deleted successfully", logId, nil)
	ctx.JSON(http.StatusOK, res)
}
