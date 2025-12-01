package utils

import (
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"reflect"
	"regexp"
	"vendor-management-system/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

func init() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("lowercase_nospace", validateLowercaseNoSpace)
	}
}

// validateLowercaseNoSpace validates that a string is lowercase and has no spaces
func validateLowercaseNoSpace(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	if value == "" {
		return true
	}
	// Check: lowercase only and no spaces
	matched, _ := regexp.MatchString(`^[a-z0-9_-]+$`, value)
	return matched
}

type ValidateMessage struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func mapValidateMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Invalid email"
	case "alphanum":
		return "Should be alphanumeric"
	case "min":
		return "Minimum " + fe.Param()
	case "max":
		return "Maximum " + fe.Param()
	case "lte":
		return "Should be less than " + fe.Param()
	case "gte":
		return "Should be greater than " + fe.Param()
	case "ltefield":
		return "Should be less than " + fe.Param()
	case "gtefield":
		return "Should be greater than " + fe.Param()
	case "lowercase_nospace":
		return "Must be lowercase with no spaces (only a-z, 0-9, underscore, and hyphen allowed)"
	}

	return "Invalid value"
}

func ValidateError(err error, reflectType reflect.Type, tagName string) []ValidateMessage {
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		out := make([]ValidateMessage, len(ve))
		for i, fe := range ve {
			field := fe.Field()
			if structField, ok := reflectType.FieldByName(fe.Field()); ok {
				field = structField.Tag.Get(tagName)
			}
			out[i] = ValidateMessage{field, mapValidateMessage(fe)}
		}
		return out
	}
	return []ValidateMessage{{"", err.Error()}}
}

func ValidateUUID(ctx *gin.Context, logID uuid.UUID) (string, error) {
	id := ctx.Param("id")
	if id == "" {
		res := response.Response(http.StatusBadRequest, http.StatusText(http.StatusBadRequest), logID, nil)
		res.Error = "ID parameter is required"
		ctx.JSON(http.StatusBadRequest, res)
		return "", fmt.Errorf("missing ID")
	}

	if _, err := uuid.Parse(id); err != nil {
		res := response.Response(http.StatusBadRequest, http.StatusText(http.StatusBadRequest), logID, nil)
		res.Error = response.Errors{Code: http.StatusBadRequest, Message: "ID must be a valid UUID"}
		ctx.JSON(http.StatusBadRequest, res)
		return "", fmt.Errorf("invalid UUID")
	}

	return id, nil
}

func ValidateFileSize(fileHeader *multipart.FileHeader, maxMB int) error {
	if fileHeader == nil {
		return fmt.Errorf("invalid file header")
	}

	maxBytes := int64(maxMB * 1024 * 1024)
	if fileHeader.Size > maxBytes {
		return fmt.Errorf("file %s exceeds maximum size of %dMB (current: %.2fMB)",
			fileHeader.Filename, maxMB, float64(fileHeader.Size)/(1024*1024))
	}

	return nil
}
