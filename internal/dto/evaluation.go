package dto

// CreateEvaluationRequest - Vendor creates evaluation after winning and completing event
type CreateEvaluationRequest struct {
	EventID  string `json:"event_id" binding:"required,uuid"`
	Comments string `json:"comments" binding:"omitempty"`
}

type UpdateEvaluationRequest struct {
	Comments string `json:"comments" binding:"omitempty"`
}

// UploadEvaluationPhotoRequest - Vendor uploads photo with caption only
type UploadEvaluationPhotoRequest struct {
	Caption string `json:"caption" binding:"omitempty,max=500"`
}

// ReviewEvaluationPhotoRequest - Client reviews and rates a photo (1-5 stars)
type ReviewEvaluationPhotoRequest struct {
	Review string `json:"review" binding:"omitempty,max=1000"`
	Rating int    `json:"rating" binding:"required,min=1,max=5"`
}
