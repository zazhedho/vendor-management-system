package handlerlocation

import (
	"fmt"
	"net/http"
	interfacelocation "vendor-management-system/internal/interfaces/location"
	"vendor-management-system/pkg/logger"
	"vendor-management-system/pkg/messages"
	"vendor-management-system/pkg/response"
	"vendor-management-system/utils"

	"github.com/gin-gonic/gin"
)

type LocationHandler struct {
	Service interfacelocation.ServiceLocationInterface
}

func NewLocationHandler(s interfacelocation.ServiceLocationInterface) *LocationHandler {
	return &LocationHandler{
		Service: s,
	}
}

// GetProvince godoc
// @Summary Get provinces
// @Description Retrieve list of provinces for a given year
// @Tags Provinces
// @Accept json
// @Produce json
// @Param thn query string false "Reference year (default from env)"
// @Success 200 {object} response.Success
// @Failure 500 {object} response.Error
// @Router /province [get]
func (h *LocationHandler) GetProvince(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][LocationHandler][GetProvince]", logId)

	year := ctx.DefaultQuery("thn", utils.GetEnv("PROVINCE_YEAR", "2025").(string))
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Query Year: %s;", logPrefix, year))

	data, err := h.Service.GetProvince(year)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetProvince; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get province successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// GetCity godoc
// @Summary Get cities
// @Description Retrieve list of cities filtered by province
// @Tags Cities
// @Accept json
// @Produce json
// @Param thn query string false "Reference year (default from env)"
// @Param lvl query string false "Level code (default 11)"
// @Param pro query string true "Province code"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /city [get]
func (h *LocationHandler) GetCity(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][LocationHandler][GetCity]", logId)

	year := ctx.DefaultQuery("thn", utils.GetEnv("PROVINCE_YEAR", "2025").(string))
	lvl := ctx.DefaultQuery("lvl", "11")
	pro := ctx.Query("pro")

	if pro == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing required parameter: pro", logPrefix))
		res := response.Response(http.StatusBadRequest, "Parameter 'pro' is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Query params - year: %s, lvl: %s, pro: %s;", logPrefix, year, lvl, pro))

	data, err := h.Service.GetCity(year, lvl, pro)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetCity; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get city successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}

// GetDistrict godoc
// @Summary Get districts
// @Description Retrieve list of districts filtered by province and city
// @Tags Districts
// @Accept json
// @Produce json
// @Param thn query string false "Reference year (default from env)"
// @Param lvl query string false "Level code (default 12)"
// @Param pro query string true "Province code"
// @Param kab query string true "City code"
// @Success 200 {object} response.Success
// @Failure 400 {object} response.Error
// @Failure 500 {object} response.Error
// @Router /district [get]
func (h *LocationHandler) GetDistrict(ctx *gin.Context) {
	logId := utils.GenerateLogId(ctx)
	logPrefix := fmt.Sprintf("[%s][LocationHandler][GetDistrict]", logId)

	year := ctx.DefaultQuery("thn", utils.GetEnv("PROVINCE_YEAR", "2025").(string))
	lvl := ctx.DefaultQuery("lvl", "12")
	pro := ctx.Query("pro")
	kab := ctx.Query("kab")

	if pro == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing required parameter: pro", logPrefix))
		res := response.Response(http.StatusBadRequest, "Parameter 'pro' is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	if kab == "" {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Missing required parameter: kab", logPrefix))
		res := response.Response(http.StatusBadRequest, "Parameter 'kab' is required", logId, nil)
		ctx.JSON(http.StatusBadRequest, res)
		return
	}

	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Query params - year: %s, lvl: %s, pro: %s, kab: %s;", logPrefix, year, lvl, pro, kab))

	data, err := h.Service.GetDistrict(year, lvl, pro, kab)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("%s; Service.GetDistrict; Error: %+v", logPrefix, err))
		res := response.Response(http.StatusInternalServerError, messages.MsgFail, logId, nil)
		res.Error = err.Error()
		ctx.JSON(http.StatusInternalServerError, res)
		return
	}

	res := response.Response(http.StatusOK, "Get district successfully", logId, data)
	logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("%s; Success: %+v;", logPrefix, utils.JsonEncode(data)))
	ctx.JSON(http.StatusOK, res)
}
