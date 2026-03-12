package response

import (
	"errors"
	"net/http"
	"strings"
	"unicode"
	"vendor-management-system/pkg/messages"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func WriteError(ctx *gin.Context, logID uuid.UUID, err error, fallbackStatus int, fallbackMessage string) {
	status, publicMessage := resolveError(err, fallbackStatus, fallbackMessage)
	res := Response(status, publicMessage, logID, nil)
	res.Error = Errors{
		Code:    status,
		Message: publicMessage,
	}
	ctx.JSON(status, res)
}

func resolveError(err error, fallbackStatus int, fallbackMessage string) (int, string) {
	if err == nil {
		if fallbackMessage != "" {
			return fallbackStatus, fallbackMessage
		}
		return fallbackStatus, defaultFallbackMessage(fallbackStatus)
	}

	rawMessage := strings.TrimSpace(err.Error())
	normalized := strings.ToLower(rawMessage)

	switch {
	case errors.Is(err, gorm.ErrDuplicatedKey), strings.Contains(normalized, "already exists"), strings.Contains(normalized, "duplicate"):
		return http.StatusBadRequest, humanizeMessage(rawMessage, "The data already exists.")
	case errors.Is(err, gorm.ErrRecordNotFound), strings.Contains(normalized, " not found"), strings.HasSuffix(normalized, "not found"):
		return http.StatusNotFound, humanizeMessage(rawMessage, "The requested data could not be found.")
	case normalized == strings.ToLower(messages.InvalidCred), normalized == strings.ToLower(messages.MsgCredential), rawMessage == messages.ErrHashPassword:
		return http.StatusBadRequest, "Invalid email or password."
	case strings.Contains(normalized, "unauthorized"):
		return http.StatusUnauthorized, humanizeMessage(rawMessage, "You are not authorized to perform this action.")
	case strings.Contains(normalized, "forbidden"),
		strings.Contains(normalized, "access denied"),
		strings.Contains(normalized, "don't have access"),
		strings.Contains(normalized, "do not have access"),
		strings.Contains(normalized, "you can only"):
		return http.StatusForbidden, humanizeMessage(rawMessage, "You do not have permission to perform this action.")
	case strings.Contains(normalized, "failed to open file"),
		strings.Contains(normalized, "failed to upload file"),
		strings.Contains(normalized, "failed to delete file"):
		return http.StatusInternalServerError, "We could not process the file right now. Please try again."
	case strings.Contains(normalized, "failed to fetch"),
		strings.Contains(normalized, "failed to read"),
		strings.Contains(normalized, "failed to unmarshal"),
		strings.Contains(normalized, "failed to marshal"),
		strings.Contains(normalized, "failed to create"),
		strings.Contains(normalized, "failed to get"),
		strings.Contains(normalized, "failed to set"),
		strings.Contains(normalized, "failed to destroy"),
		strings.Contains(normalized, "failed to update"),
		strings.Contains(normalized, "failed to delete"),
		strings.Contains(normalized, "failed to check"):
		return http.StatusInternalServerError, chooseFallbackMessage(fallbackStatus, fallbackMessage, http.StatusInternalServerError)
	case strings.Contains(normalized, "required"),
		strings.Contains(normalized, "invalid "),
		strings.Contains(normalized, " must "),
		strings.HasPrefix(normalized, "must "),
		strings.Contains(normalized, "can only "),
		strings.Contains(normalized, "maximum "),
		strings.Contains(normalized, "minimum "),
		strings.Contains(normalized, "leave blank"),
		strings.Contains(normalized, "expired"),
		strings.Contains(normalized, "no properties"),
		strings.Contains(normalized, "already submitted"),
		strings.Contains(normalized, "already selected"),
		strings.Contains(normalized, "does not belong"),
		strings.Contains(normalized, "is not open"),
		strings.Contains(normalized, "is required"):
		return http.StatusBadRequest, humanizeMessage(rawMessage, chooseFallbackMessage(fallbackStatus, fallbackMessage, http.StatusBadRequest))
	default:
		return fallbackStatus, chooseFallbackMessage(fallbackStatus, fallbackMessage, fallbackStatus)
	}
}

func chooseFallbackMessage(fallbackStatus int, fallbackMessage string, defaultStatus int) string {
	if fallbackMessage != "" {
		return fallbackMessage
	}

	if fallbackStatus == 0 {
		fallbackStatus = defaultStatus
	}

	return defaultFallbackMessage(fallbackStatus)
}

func defaultFallbackMessage(status int) string {
	switch status {
	case http.StatusBadRequest:
		return "Please review your input and try again."
	case http.StatusUnauthorized:
		return "You are not authorized to perform this action."
	case http.StatusForbidden:
		return "You do not have permission to perform this action."
	case http.StatusNotFound:
		return "The requested data could not be found."
	default:
		return "We could not process your request right now. Please try again later."
	}
}

func humanizeMessage(message string, fallback string) string {
	cleaned := strings.TrimSpace(message)
	if cleaned == "" {
		return fallback
	}

	cleaned = strings.ReplaceAll(cleaned, "_", " ")
	cleaned = strings.ReplaceAll(cleaned, "  ", " ")

	switch cleaned {
	case "email already exists":
		return "Email already exists."
	case "phone number already exists":
		return "Phone number already exists."
	case "email or phone already exists", "email or phone number already exists":
		return "Email or phone number already exists."
	case "vendor profile not found":
		return "Vendor profile not found."
	case "vendor not found":
		return "Vendor not found."
	case "user not found":
		return "User not found."
	case "event not found":
		return "Event not found."
	case "evaluation not found":
		return "Evaluation not found."
	case "photo not found":
		return "Photo not found."
	case "payment not found":
		return "Payment not found."
	case "file not found":
		return "File not found."
	}

	runes := []rune(cleaned)
	if len(runes) == 0 {
		return fallback
	}

	runes[0] = unicode.ToUpper(runes[0])
	cleaned = string(runes)
	cleaned = strings.ReplaceAll(cleaned, ", use ", ". Use ")
	if !strings.HasSuffix(cleaned, ".") {
		cleaned += "."
	}

	return cleaned
}
